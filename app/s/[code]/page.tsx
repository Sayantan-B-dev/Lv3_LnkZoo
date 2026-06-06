import sql from '@/lib/db';

export default async function ShortCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  let url: string | null = null;
  let title = 'Redirecting...';
  let description = '';
  let image = '';
  let isShort = false;

  const [short] = await sql`
    SELECT original_url, created_at FROM shortened_links WHERE short_code = ${code} LIMIT 1
  `;
  if (short) {
    if (new Date(short.created_at) >= new Date(Date.now() - 86400000)) {
      url = short.original_url;
      isShort = true;
    }
  }

  if (!url) {
    const [link] = await sql`
      SELECT original_url, title, description, preview_image FROM links WHERE short_code = ${code} LIMIT 1
    `;
    if (link) {
      url = link.original_url;
      title = link.title;
      description = link.description || '';
      image = link.preview_image || '';
    }
  }

  if (!url) {
    return (
      <html>
        <body style={{ fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, background: '#f5f5f5' }}>
          <p>Link not found.</p>
        </body>
      </html>
    );
  }

  if (isShort) {
    await sql`UPDATE shortened_links SET click_count = click_count + 1 WHERE short_code = ${code}`.catch(() => {});
  } else {
    await sql`UPDATE links SET click_count = click_count + 1 WHERE short_code = ${code}`.catch(() => {});
  }

  const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://lnkzoo.vercel.app';

  return (
    <html>
      <head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {image && <meta property="og:image" content={image} />}
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
        <meta httpEquiv="refresh" content={`0;url=${url}`} />
      </head>
      <body style={{ fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, background: '#f5f5f5', flexDirection: 'column', gap: '12px' }}>
        <p>Redirecting...</p>
        <a href={url} style={{ color: '#3b82f6' }}>Click here if not redirected</a>
        <script dangerouslySetInnerHTML={{ __html: `window.location.href=${JSON.stringify(url)}` }} />
      </body>
    </html>
  );
}
