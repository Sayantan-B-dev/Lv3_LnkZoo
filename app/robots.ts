import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lnkzoo.vercel.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/login', '/register', '/settings', '/notifications', '/bookmarks', '/manage/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
