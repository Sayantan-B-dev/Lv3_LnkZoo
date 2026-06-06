import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lnkzoo.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/login', '/register', '/s/'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
