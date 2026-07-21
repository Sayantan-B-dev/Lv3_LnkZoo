import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import sql from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const [link] = await sql`
    SELECT title, description, preview_image FROM links WHERE short_code = ${code} LIMIT 1
  `;
  if (!link) return { title: 'Redirecting...' };
  return {
    title: link.title,
    description: link.description || undefined,
    openGraph: {
      title: link.title,
      description: link.description || undefined,
      images: link.preview_image ? [{ url: link.preview_image }] : [],
    },
  };
}

export default async function ShortCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referrer = (await headers()).get('referer') ?? null;

  const [short] = await sql`
    SELECT original_url FROM shortened_links
    WHERE short_code = ${code} AND created_at > NOW() - INTERVAL '1 day'
    LIMIT 1
  `;
  if (short) {
    await sql`UPDATE shortened_links SET click_count = click_count + 1 WHERE short_code = ${code}`.catch(() => {});
    redirect(short.original_url);
  }

  const [link] = await sql`
    SELECT id, original_url FROM links WHERE short_code = ${code} LIMIT 1
  `;
  if (link) {
    await sql`UPDATE links SET click_count = click_count + 1 WHERE short_code = ${code}`.catch(() => {});
    sql`INSERT INTO link_click_events (link_id, short_code, referrer) VALUES (${link.id}, ${code}, ${referrer})`.catch(() => {});
    redirect(link.original_url);
  }

  notFound();
}
