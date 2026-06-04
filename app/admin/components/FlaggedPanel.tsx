'use client';
import React from 'react';

export default function FlaggedPanel({ flags }: { flags: { id: string; title: string; original_url: string; flagged_count: number; username: string }[] }) {
  return (
    <div className="adm-chart-card adm-chart-full">
      <div className="adm-chart-header">
        <span className="adm-chart-title">Flagged Links</span>
        <span className="adm-chart-total">{flags.length} flagged</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="adm-table">
          <thead>
            <tr><th>Title</th><th>URL</th><th>Author</th><th>Flags</th></tr>
          </thead>
          <tbody>
            {flags.map(f => (
              <tr key={f.id}>
                <td className="adm-td-title">{f.title.slice(0, 50)}</td>
                <td className="adm-td-url">{f.original_url}</td>
                <td>@{f.username}</td>
                <td><span className="adm-badge-danger">{f.flagged_count}</span></td>
              </tr>
            ))}
            {!flags.length && <tr><td colSpan={4} className="adm-empty">No flagged links</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
