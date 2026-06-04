'use client';
import React from 'react';

export default function MetricCard({ label, value, change, color, icon }: { label: string; value: string; change?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="adm-metric">
      <div className="adm-metric-top">
        <div className="adm-metric-icon" style={{ background: `${color}18`, color }}>{icon}</div>
        {change && <span className="adm-metric-change">{change}</span>}
      </div>
      <div className="adm-metric-value">{value}</div>
      <div className="adm-metric-label">{label}</div>
    </div>
  );
}
