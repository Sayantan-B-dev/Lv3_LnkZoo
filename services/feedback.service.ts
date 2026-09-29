import { v2 as cloudinary } from 'cloudinary';
import sql, { query } from '@/lib/db';
import { DEFAULT_FEEDBACK_STATUS, type FeedbackStatus } from '@/lib/feedbackRules';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const FEEDBACK_FOLDER = 'lnkzoo_feedback';

export interface FeedbackItem {
  id: number;
  title: string;
  description: string;
  screenshot_url: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  username: string | null;
  avatar_url: string | null;
  /** True when the row belongs to the requesting user. */
  is_mine: boolean;
}

export interface ListFeedbackOptions {
  viewerId: string;
  isAdmin: boolean;
  status?: string;
  limit: number;
  offset: number;
}

const SELECT_COLUMNS = `
  f.id, f.user_id, f.title, f.description, f.screenshot_url, f.status,
  f.created_at, f.updated_at, u.username, u.avatar_url
`;

/**
 * Admins see every report; everyone else sees only their own. `status` filters
 * only apply to the admin view.
 */
export async function listFeedback(
  options: ListFeedbackOptions
): Promise<{ items: FeedbackItem[]; total: number }> {
  const { viewerId, isAdmin, status, limit, offset } = options;

  const conds: string[] = [];
  const params: any[] = [];
  let n = 0;

  if (!isAdmin) {
    conds.push(`f.user_id = $${++n}`);
    params.push(viewerId);
  } else if (status) {
    conds.push(`f.status = $${++n}`);
    params.push(status);
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
        is_mine: row.user_id === viewerId,
      })
    ),
    total: countRow?.count ?? 0,
  };
}

export async function feedbackStatusCounts(): Promise<Record<string, number>> {
  const rows = await query(
    `SELECT status, COUNT(*)::int AS count FROM feedback GROUP BY status`
  );
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

export async function createFeedback(input: {
  userId: string;
  title: string;
  description: string;
  screenshot?: { buffer: Buffer; mime: string } | null;
}): Promise<FeedbackItem> {
  let screenshotUrl: string | null = null;
  let screenshotPublicId: string | null = null;

  if (input.screenshot) {
    // Same data-URI approach as the temp-file tool, so nothing touches disk.
    const uploaded = await cloudinary.uploader.upload(
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
    INSERT INTO feedback (user_id, title, description, screenshot_url, screenshot_public_id)
    VALUES (${input.userId}, ${input.title}, ${input.description}, ${screenshotUrl}, ${screenshotPublicId})
    RETURNING id, title, description, screenshot_url, status, created_at, updated_at
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
    await cloudinary.uploader.destroy(publicId).catch(() => {});
  }
  return true;
}
