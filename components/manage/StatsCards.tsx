'use client';

interface Stats {
  total: number;
  public_count: number;
  followers_count: number;
  private_count: number;
  total_likes: number;
  total_views: number;
  total_comments: number;
  total_clicks: number;
  avg_likes: number;
}

export default function StatsCards({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total', value: stats.total, className: '' },
    { label: 'Public', value: stats.public_count, className: 'ml-stat-public' },
    { label: 'Followers', value: stats.followers_count, className: 'ml-stat-followers' },
    { label: 'Private', value: stats.private_count, className: 'ml-stat-private' },
    { label: 'Likes', value: stats.total_likes, className: '' },
    { label: 'Views', value: stats.total_views, className: '' },
    { label: 'Comments', value: stats.total_comments, className: '' },
    { label: 'Clicks', value: stats.total_clicks, className: '' },
  ];

  return (
    <div className="ml-stats">
      {cards.map(c => (
        <div key={c.label} className={`ml-stat-card ${c.className}`}>
          <span className="ml-stat-value">{c.value.toLocaleString()}</span>
          <span className="ml-stat-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
