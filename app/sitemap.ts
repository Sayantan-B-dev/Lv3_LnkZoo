import { MetadataRoute } from 'next'
import sql from '@/lib/db'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lnkzoo.vercel.app'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/daily-dose`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/random`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/tags`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/users`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.4 },
    { url: `${baseUrl}/tools`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
  ]

  try {
    const links = await sql`SELECT id, created_at FROM links WHERE visibility = 'public' ORDER BY created_at DESC`
    const linkPages: MetadataRoute.Sitemap = links.map((l: any) => ({
      url: `${baseUrl}/link/${l.id}`,
      lastModified: l.created_at,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const tags = await sql`SELECT name FROM tags ORDER BY name`
    const tagPages: MetadataRoute.Sitemap = tags.map((t: any) => ({
      url: `${baseUrl}/tags/${t.name}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    }))

    const users = await sql`SELECT username FROM users ORDER BY username`
    const userPages: MetadataRoute.Sitemap = users.map((u: any) => ({
      url: `${baseUrl}/profile/${u.username}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.3,
    }))

    return [...staticPages, ...linkPages, ...tagPages, ...userPages]
  } catch {
    return staticPages
  }
}
