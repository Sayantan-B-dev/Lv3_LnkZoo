'use client';

import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import Sparkline from '../components/Sparkline';
import TrendChart from '../components/TrendChart';
import DualTrendChart from '../components/DualTrendChart';
import PieChart from '../components/PieChart';
import HorizBarChart from '../components/HorizBarChart';
import BucketBar from '../components/BucketBar';
import StatTable from '../components/StatTable';
import FlaggedPanel from '../components/FlaggedPanel';
import RangeSelector, { Range } from '../components/RangeSelector';

const c = {
  blue: '#3b82f6', green: '#10b981', amber: '#f59e0b', red: '#ef4444',
  pink: '#ec4899', purple: '#a78bfa', cyan: '#22d3ee', orange: '#fb923c',
};

type Series = { date: string; count: number }[];
type Dist = { label: string; count: number }[];

interface Stats {
  range: string;
  totals: {
    users: number; links: number; comments: number; likes: number; flagged: number; banned: number;
    follows: number; tags: number; topics: number; bookmarks: number; shortLinks: number; views: number; clicks: number;
  };
  userGrowth: Series; linkGrowth: Series; likesGrowth: Series; bookmarksGrowth: Series;
  viewsSeries: Series; clicksSeries: Series; dau: Series;
  cumulativeUsers: Series; cumulativeLinks: Series;
  dailyActivity: { date: string; posts: number; comments: number }[];
  userGrowthWeekly: Series; linkGrowthWeekly: Series;
  roleDist: { role: string; count: number }[];
  visibilityDist: Dist; notificationDist: Dist; topicDist: Dist; engagementMix: Dist;
  topTags: { name: string; usage_count: number }[];
  topLinks: { id: string; title: string; username: string; view_count: number; like_count: number; comment_count: number; engagement: number }[];
  topContributors: { username: string; avatar_url: string | null; links: number; comments: number }[];
  streakBuckets: Dist;
  recentFlags: { id: string; title: string; original_url: string; flagged_count: number; username: string }[];
}

const I = {
  users: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  links: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
  comments: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
  likes: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
  views: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  clicks: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" /></svg>,
  follows: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  tags: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>,
  topics: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
  bookmarks: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>,
  shortLinks: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757" /></svg>,
  flagged: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>,
  banned: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
};

function Section({ title }: { title: string }) {
  return (
    <div className="adm-section">
      <span className="adm-section-title">{title}</span>
      <span className="adm-section-line" />
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState<Range>('30');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/stats?range=${range}`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(d => { if (active) { setStats(d); setError(''); } })
      .catch(() => { if (active) setError('Failed to load statistics'); });
    return () => { active = false; };
  }, [range]);

  const refreshing = !!stats && stats.range !== range;

  if (error && !stats) return <div className="adm-error">{error}</div>;
  if (!stats) return (
    <div className="adm-loading">
      <div className="adm-loading-spinner" />
      <span>Loading dashboard data...</span>
    </div>
  );

  const t = stats.totals;
  const roleData = stats.roleDist.map(r => ({ label: r.role, count: r.count }));

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-sub">Real-time platform analytics</p>
        </div>
        <div className="adm-header-right">
          <RangeSelector value={range} onChange={setRange} />
          <div className="adm-page-time">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      <div className={refreshing ? 'adm-refreshing' : undefined}>
        <Section title="Overview" />
        <div className="adm-metrics">
          <MetricCard label="Total Users" value={t.users.toLocaleString()} change={`+${stats.userGrowthWeekly.reduce((s, d) => s + d.count, 0)} this week`} color={c.blue} icon={I.users} />
          <MetricCard label="Total Links" value={t.links.toLocaleString()} change={`+${stats.linkGrowthWeekly.reduce((s, d) => s + d.count, 0)} this week`} color={c.green} icon={I.links} />
          <MetricCard label="Comments" value={t.comments.toLocaleString()} color={c.amber} icon={I.comments} />
          <MetricCard label="Total Likes" value={t.likes.toLocaleString()} color={c.pink} icon={I.likes} />
          <MetricCard label="Total Views" value={t.views.toLocaleString()} color={c.cyan} icon={I.views} />
          <MetricCard label="Total Clicks" value={t.clicks.toLocaleString()} color={c.orange} icon={I.clicks} />
          <MetricCard label="Follows" value={t.follows.toLocaleString()} color={c.purple} icon={I.follows} />
          <MetricCard label="Bookmarks" value={t.bookmarks.toLocaleString()} color={c.blue} icon={I.bookmarks} />
          <MetricCard label="Tags" value={t.tags.toLocaleString()} color={c.green} icon={I.tags} />
          <MetricCard label="Topics" value={t.topics.toLocaleString()} color={c.purple} icon={I.topics} />
          <MetricCard label="Short Links" value={t.shortLinks.toLocaleString()} color={c.amber} icon={I.shortLinks} />
          <MetricCard label="Flagged" value={t.flagged.toLocaleString()} color={c.red} icon={I.flagged} />
          <MetricCard label="Banned" value={t.banned.toLocaleString()} color={c.red} icon={I.banned} />
        </div>

        <div className="adm-metric-sparklines">
          <Sparkline data={stats.userGrowth} color={c.blue} />
          <Sparkline data={stats.linkGrowth} color={c.green} />
        </div>

        <Section title="Growth" />
        <div className="adm-grid">
          <TrendChart data={stats.userGrowth} title="User Growth" color={c.blue} />
          <TrendChart data={stats.linkGrowth} title="Link Growth" color={c.green} />
        </div>
        <div className="adm-grid">
          <TrendChart data={stats.cumulativeUsers} title="Cumulative Users" color={c.purple} />
          <TrendChart data={stats.cumulativeLinks} title="Cumulative Links" color={c.cyan} />
        </div>

        <Section title="Engagement" />
        <DualTrendChart data={stats.dailyActivity} title="Daily Activity" />
        <div className="adm-grid-3">
          <PieChart data={stats.engagementMix} title="Engagement Mix" unit="actions" />
          <TrendChart data={stats.viewsSeries} title="Views" color={c.cyan} height={220} />
          <TrendChart data={stats.clicksSeries} title="Clicks" color={c.orange} height={220} />
        </div>
        <div className="adm-grid">
          <StatTable
            title="Top Links by Engagement"
            rows={stats.topLinks}
            columns={[
              { header: 'Title', render: (r) => <span className="adm-td-title">{r.title}</span> },
              { header: 'Author', render: (r) => `@${r.username}` },
              { header: 'Views', align: 'right', render: (r) => r.view_count.toLocaleString() },
              { header: 'Likes', align: 'right', render: (r) => r.like_count.toLocaleString() },
              { header: 'Score', align: 'right', render: (r) => <strong>{r.engagement.toLocaleString()}</strong> },
            ]}
          />
          <StatTable
            title="Top Contributors"
            rows={stats.topContributors}
            columns={[
              { header: 'User', render: (r) => `@${r.username}` },
              { header: 'Links', align: 'right', render: (r) => r.links.toLocaleString() },
              { header: 'Comments', align: 'right', render: (r) => r.comments.toLocaleString() },
              { header: 'Total', align: 'right', render: (r) => <strong>{(r.links + r.comments).toLocaleString()}</strong> },
            ]}
          />
        </div>

        <Section title="Content" />
        <div className="adm-grid-3">
          <PieChart data={stats.topicDist} title="Topics" unit="links" />
          <PieChart data={stats.visibilityDist} title="Visibility" unit="links" />
          <HorizBarChart data={stats.topTags} title="Top Tags" />
        </div>

        <Section title="Community" />
        <div className="adm-grid-3">
          <TrendChart data={stats.dau} title="Active Users / Day" color={c.blue} height={220} />
          <TrendChart data={stats.likesGrowth} title="Likes" color={c.pink} height={220} />
          <TrendChart data={stats.bookmarksGrowth} title="Bookmarks" color={c.purple} height={220} />
        </div>
        <div className="adm-grid-3">
          <PieChart data={roleData} title="User Roles" unit="users" />
          <PieChart data={stats.notificationDist} title="Notifications" unit="sent" />
          <BucketBar data={stats.streakBuckets} title="Streak Distribution" color={c.amber} suffix="d" />
        </div>

        <Section title="Moderation" />
        <FlaggedPanel flags={stats.recentFlags} />
      </div>
    </div>
  );
}
