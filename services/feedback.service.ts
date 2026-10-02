import { getCloudinary } from '@/lib/cloudinary';
import sql, { query } from '@/lib/db';
import {
  DEFAULT_FEEDBACK_STATUS,
  DEFAULT_FEEDBACK_VISIBILITY,
  type FeedbackStatus,
  type FeedbackVisibility,
} from '@/lib/feedbackRules';

export const FEEDBACK_FOLDER = 'lnkzoo_feedback';

export interface FeedbackItem {
  id: number;
  title: string;
  description: string;
  screenshot_url: string | null;
  status: FeedbackStatus;
  visibility: FeedbackVisibility;
  created_at: string;
  updated_at: string;
  username: string | null;
  avatar_url: string | null;
  /** True when the row belongs to the requesting user. */
  is_mine: boolean;
}

export interface ListFeedbackOptions {
  /** null for signed-out visitors. */
  viewerId: string | null;
  isAdmin: boolean;
  status?: string;
  visibility?: string;
  limit: number;
  offset: number;
}

const SELECT_COLUMNS = `
  f.id, f.user_id, f.title, f.description, f.screenshot_url, f.status, f.visibility,
  f.created_at, f.updated_at, u.username, u.avatar_url
`;

/**
 * Access policy for reads:
 *   admin        -> everything
 *   signed in    -> public reports + their own, whatever the visibility
 *   signed out   -> public reports only
 *
 * `status` and `visibility` filters narrow whatever the policy already allows,
 * so they can never widen it.
 */
function visibilityCondition(
  viewerId: string | null,
  isAdmin: boolean,
  conds: string[],
  params: any[],
  n: number
): number {
  if (isAdmin) return n;
  if (viewerId) {
    conds.push(`(f.visibility = 'public' OR f.user_id = $${n + 1})`);
    params.push(viewerId);
    return n + 1;
  }
  conds.push(`f.visibility = 'public'`);
  return n;
}

export async function listFeedback(
  options: ListFeedbackOptions
): Promise<{ items: FeedbackItem[]; total: number }> {
  const { viewerId, isAdmin, status, visibility, limit, offset } = options;

  const conds: string[] = [];
  const params: any[] = [];

  let n = visibilityCondition(viewerId, isAdmin, conds, params, 0);

  if (status) {
    conds.push(`f.status = $${++n}`);
    params.push(status);
  }
  if (visibility) {
    conds.push(`f.visibility = $${++n}`);
    params.push(visibility);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [countRow] = await query(
    `SELECT COUNT(*)::int AS count FROM feedback f ${where}`,
    params
  );

  const rows = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM feedback f
     LEFT JOIN users u ON u.id = f.user_id
     ${where}
     ORDER BY f.created_at DESC
     LIMIT $${n + 1} OFFSET $${n + 2}`,
    [...params, limit, offset]
  );

  return {
    items: rows.map(
      (row: any): FeedbackItem => ({
        ...row,
        status: (row.status ?? DEFAULT_FEEDBACK_STATUS) as FeedbackStatus,
        visibility: (row.visibility ?? DEFAULT_FEEDBACK_VISIBILITY) as FeedbackVisibility,
        is_mine: !!viewerId && row.user_id === viewerId,
      })
    ),
    total: countRow?.count ?? 0,
  };
}

/**
 * Per-status tallies, respecting the same access policy as the list so a
 * counter never reveals the existence of a private report.
 */
export async function feedbackStatusCounts(
  viewerId: string | null,
  isAdmin: boolean
): Promise<Record<string, number>> {
  const rows = isAdmin
    ? await query(`SELECT status, COUNT(*)::int AS count FROM feedback GROUP BY status`)
    : viewerId
      ? await query(
          `SELECT status, COUNT(*)::int AS count FROM feedback
           WHERE visibility = 'public' OR user_id = $1 GROUP BY status`,
          [viewerId]
        )
      : await query(
          `SELECT status, COUNT(*)::int AS count FROM feedback
           WHERE visibility = 'public' GROUP BY status`
        );

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

export async function createFeedback(input: {
  userId: string;
  title: string;
  description: string;
  visibility: FeedbackVisibility;
  screenshot?: { buffer: Buffer; mime: string } | null;
}): Promise<FeedbackItem> {
  let screenshotUrl: string | null = null;
  let screenshotPublicId: string | null = null;

  if (input.screenshot) {
    // Same data-URI approach as the temp-file tool, so nothing touches disk.
    const uploaded = await (await getCloudinary()).uploader.upload(
      `data:${input.screenshot.mime};base64,${input.screenshot.buffer.toString('base64')}`,
      {
        folder: FEEDBACK_FOLDER,
        resource_type: 'image',
        // Screenshots are routinely gigantic; cap the stored width so we serve
        // something sane instead of a 4000px PNG.
        transformation: [{ width: 1920, crop: 'limit' }],
      }
    );
    screenshotUrl = uploaded.secure_url;
    screenshotPublicId = uploaded.public_id;
  }

  const [row] = await sql`
    INSERT INTO feedback (user_id, title, description, screenshot_url, screenshot_public_id, visibility)
    VALUES (${input.userId}, ${input.title}, ${input.description}, ${screenshotUrl}, ${screenshotPublicId}, ${input.visibility})
    RETURNING id, title, description, screenshot_url, status, visibility, created_at, updated_at
  `;

  return {
    ...row,
    username: null,
    avatar_url: null,
    is_mine: true,
  } as FeedbackItem;
}

export async function updateFeedbackStatus(
  id: number,
  status: FeedbackStatus,
  adminId: string
): Promise<{ id: number; status: string; updated_at: string } | null> {
  const [row] = await sql`
    UPDATE feedback
    SET status = ${status}, updated_at = NOW(), reviewed_by = ${adminId}
    WHERE id = ${id}
    RETURNING id, status, updated_at
  `;
  return row ?? null;
}

/**
 * Admins can delete any report; a user can delete their own. The ownership
 * check is part of the DELETE so a guessed id can never remove someone
 * else's row, and the Cloudinary asset is torn down with it.
 */
export async function deleteFeedback(
  id: number,
  requesterId: string,
  isAdmin: boolean
): Promise<boolean> {
  const rows = isAdmin
    ? await sql`DELETE FROM feedback WHERE id = ${id} RETURNING screenshot_public_id`
    : await sql`DELETE FROM feedback WHERE id = ${id} AND user_id = ${requesterId} RETURNING screenshot_public_id`;

  if (rows.length === 0) return false;

  const publicId = rows[0].screenshot_public_id;
  if (publicId) {
    await (await getCloudinary()).uploader.destroy(publicId).catch(() => {});
  }
  return true;
}
