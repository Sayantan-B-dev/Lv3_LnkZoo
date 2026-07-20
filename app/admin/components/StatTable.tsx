'use client';
import React from 'react';

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  width?: string;
}

export default function StatTable<T>({
  title, columns, rows, empty = 'No data yet', full = false,
}: { title: string; columns: Column<T>[]; rows: T[]; empty?: string; full?: boolean }) {
  return (
    <div className={`adm-chart-card${full ? ' adm-chart-full' : ''}`}>
      <div className="adm-chart-header">
        <span className="adm-chart-title">{title}</span>
        <span className="adm-chart-total">{rows.length}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="adm-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} style={{ textAlign: c.align ?? 'left', width: c.width }}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {columns.map((c, ci) => (
                  <td key={ci} style={{ textAlign: c.align ?? 'left' }}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={columns.length} className="adm-empty">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
