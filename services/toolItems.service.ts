import sql from '@/lib/db';
import { destroyTempFileByCode } from '@/lib/tempFiles';

/**
 * The three `/tools` outputs a signed-in user can own. Guests create the same
 * rows with `user_id = NULL` and are simply never listed here.
 */
export type ToolItemType = 'short' | 'file' | 'text';

export interface ToolItem {
  type: ToolItemType;
  code: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  originalUrl?: string;
  clickCount?: number;
  fileName?: string;
  sizeBytes?: number;
  preview?: string;
}

const TOOL_ITEM_TYPES: ToolItemType[] = ['short', 'file', 'text'];

export function isToolItemType(value: string): value is ToolItemType {
  return (TOOL_ITEM_TYPES as string[]).includes(value);
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

/**
 * Active (non-expired) tool output owned by `userId`, newest first.
 * Expiry is uniform: short links last 1 day from creation, files and shared
 * texts carry an explicit `expires_at`.
 */
export async function listToolItems(userId: string): Promise<ToolItem[]> {
  // shortened_links.created_at is TIMESTAMP (no tz) while the other two tables
  // use TIMESTAMPTZ; cast so the UNION resolves to one consistent type.
  const rows = await sql`
    SELECT 'short' AS type, short_code AS code, original_url,
           NULL::text AS preview, NULL::text AS file_name, NULL::int AS size_bytes,
           click_count, created_at::timestamptz AS created_at,
           created_at::timestamptz + INTERVAL '1 day' AS expires_at
    FROM shortened_links
    WHERE user_id = ${userId} AND created_at > NOW() - INTERVAL '1 day'
    UNION ALL
    SELECT 'file', code, NULL, NULL, file_name, size_bytes,
           NULL, created_at, expires_at
    FROM temp_files
    WHERE user_id = ${userId} AND expires_at > NOW()
    UNION ALL
    SELECT 'text', code, NULL, LEFT(content, 80), NULL, NULL,
           NULL, created_at, expires_at
    FROM shared_texts
    WHERE user_id = ${userId} AND expires_at > NOW()
    ORDER BY created_at DESC
  `;

  const base = appUrl();
  return rows.map((row: any): ToolItem => {
    const type = row.type as ToolItemType;
    return {
      type,
      code: row.code,
      url: `${base}/${type === 'short' ? 's' : type === 'file' ? 'f' : 't'}/${row.code}`,
      createdAt: new Date(row.created_at).toISOString(),
      expiresAt: new Date(row.expires_at).toISOString(),
      originalUrl: type === 'short' ? row.original_url : undefined,
      clickCount: type === 'short' ? row.click_count : undefined,
      fileName: type === 'file' ? row.file_name : undefined,
      sizeBytes: type === 'file' ? row.size_bytes : undefined,
      preview: type === 'text' ? row.preview : undefined,
    };
  });
}

/**
 * Destroy one item, but only if the signed-in user owns it — the ownership
 * check is part of every statement so a guessed code can never touch
 * somebody else's row (or its Cloudinary asset).
 */
export async function destroyToolItem(
  userId: string,
  type: ToolItemType,
  code: string
): Promise<boolean> {
  if (type === 'file') {
    const [row] = await sql`
      SELECT public_id FROM temp_files WHERE code = ${code} AND user_id = ${userId}
    `;
    if (!row) return false;
    await destroyTempFileByCode(code);
    return true;
  }

  if (type === 'text') {
    const rows = await sql`
      DELETE FROM shared_texts WHERE code = ${code} AND user_id = ${userId} RETURNING id
    `;
    return rows.length > 0;
  }

  const rows = await sql`
    DELETE FROM shortened_links WHERE short_code = ${code} AND user_id = ${userId} RETURNING id
  `;
  return rows.length > 0;
}
