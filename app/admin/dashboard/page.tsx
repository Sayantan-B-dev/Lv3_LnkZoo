'use client';

import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import Sparkline from '../components/Sparkline';
import TrendChart from '../components/TrendChart';
import DualTrendChart from '../components/DualTrendChart';
import DonutChart from '../components/DonutChart';
import HorizBarChart from '../components/HorizBarChart';
import FlaggedPanel from '../components/FlaggedPanel';

const colors = {
  blue: '#3b82f6', green: '#10b981', amber: '#f59e0b', red: '#ef4444', pink: '#ec4899',
};

interface Stats {
  totals: { users: number; links: number; comments: number; likes: number; flagged: number; banned: number };
  userGrowth: { date: string; count: number }[];
  linkGrowth: { date: string; count: number }[];
  userGrowthWeekly: { date: string; count: number }[];
  linkGrowthWeekly: { date: string; count: number }[];
  roleDist: { role: string; count: number }[];
  topTags: { name: string; usage_count: number }[];
  dailyActivity: { date: string; posts: number; comments: number }[];
  recentFlags: { id: string; title: string; original_url: string; flagged_count: number; username: string }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(setStats)
      .catch(() => setError('Failed to load statistics'));
  }, []);

  if (error) return <div className="adm-error">{error}</div>;
  if (!stats) return (
    <div className="adm-loading">
      <div className="adm-loading-spinner" />
      <span>Loading dashboard data...</span>
    </div>
  );

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-sub">Real-time platform analytics</p>
        </div>
        <div className="adm-page-time">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </div>

      <div className="adm-metrics">
        <MetricCard label="Total Users" value={stats.totals.users.toLocaleString()} change={`+${stats.userGrowthWeekly.reduce((s, d) => s + d.count, 0)} this week`} color={colors.blue} icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>} />
        <MetricCard label="Total Links" value={stats.totals.links.toLocaleString()} change={`+${stats.linkGrowthWeekly.reduce((s, d) => s + d.count, 0)} this week`} color={colors.green} icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>} />
        <MetricCard label="Comments" value={stats.totals.comments.toLocaleString()} color={colors.amber} icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>} />
        <MetricCard label="Total Likes" value={stats.totals.likes.toLocaleString()} color={colors.pink} icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>} />
        <MetricCard label="Flagged" value={stats.totals.flagged.toLocaleString()} color={colors.red} icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"/></svg>} />
        <MetricCard label="Banned" value={stats.totals.banned.toLocaleString()} color={colors.red} icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>} />
      </div>

      <div className="adm-metric-sparklines">
        <Sparkline data={stats.userGrowthWeekly} color={colors.blue} />
        <Sparkline data={stats.linkGrowthWeekly} color={colors.green} />
      </div>

      <div className="adm-grid">
        <TrendChart data={stats.userGrowth} title="User Growth" color={colors.blue} />
        <TrendChart data={stats.linkGrowth} title="Link Growth" color={colors.green} />
      </div>

      <DualTrendChart data={stats.dailyActivity} title="Daily Activity" />

      <div className="adm-grid">
        <DonutChart data={stats.roleDist} title="User Roles" />
        <HorizBarChart data={stats.topTags} title="Top Tags" />
      </div>

      <FlaggedPanel flags={stats.recentFlags} />
    </div>
  );
}
