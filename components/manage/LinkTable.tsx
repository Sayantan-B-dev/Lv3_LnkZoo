'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LinkRow {
  id: string;
  title: string;
  original_url: string;
  short_code: string;
  visibility: string;
  like_count: number;
  view_count: number;
  comment_count: number;
  click_count: number;
  created_at: string;
  tags: string[];
}

interface LinkTableProps {
  links: LinkRow[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  sort: string;
  order: string;
  onSort: (col: string) => void;
}

const SORTABLE = ['title', 'like_count', 'view_count', 'comment_count', 'click_count', 'created_at'];

const VIS_LABEL: Record<string, string> = {
  public: '\uD83C\uDF10 Public',
  followers: '\uD83D\uDC65 Followers',
  private: '\uD83D\uDD12 Private',
};

export default function LinkTable({ links, selected, onSelect, onSelectAll, sort, order, onSort }: LinkTableProps) {
  const router = useRouter();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const allSelected = links.length > 0 && selected.size === links.length;

  const sortIcon = (col: string) => {
    if (sort !== col) return '';
    return order === 'asc' ? '\u25B2' : '\u25BC';
  };

  return (
    <div className="ml-table-wrap">
      <table className="ml-table">
        <thead>
          <tr>
            <th style={{ width: '32px' }}>
              <input type="checkbox" className="ml-checkbox" checked={allSelected} onChange={onSelectAll} />
            </th>
            <th className="ml-sortable" onClick={() => onSort('title')}>
              Title <span className="ml-sort-icon">{sortIcon('title')}</span>
            </th>
            <th>Visibility</th>
            <th>Tags</th>
            <th className="ml-sortable" onClick={() => onSort('like_count')}>
              Likes <span className="ml-sort-icon">{sortIcon('like_count')}</span>
            </th>
            <th className="ml-sortable" onClick={() => onSort('view_count')}>
              Views <span className="ml-sort-icon">{sortIcon('view_count')}</span>
            </th>
            <th className="ml-sortable" onClick={() => onSort('comment_count')}>
              Comments <span className="ml-sort-icon">{sortIcon('comment_count')}</span>
            </th>
            <th className="ml-sortable" onClick={() => onSort('created_at')}>
              Created <span className="ml-sort-icon">{sortIcon('created_at')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {links.length === 0 ? (
            <tr>
              <td colSpan={8} className="ml-empty">No links found.</td>
            </tr>
          ) : (
            links.map(link => (
              <tr key={link.id} className={selected.has(link.id) ? 'ml-selected' : ''} style={{ opacity: navigatingId === link.id ? 0.6 : 1 }}>
                <td>
                  <input
                    type="checkbox"
                    className="ml-checkbox"
                    checked={selected.has(link.id)}
                    onChange={() => onSelect(link.id)}
                  />
                </td>
                <td>
                   <div className="ml-title-cell" onClick={() => { setNavigatingId(link.id); router.push(`/link/${link.id}`); }}>
                    {link.title}
                  </div>
                </td>
                <td>
                  <span className="ml-vis-badge">{VIS_LABEL[link.visibility] ?? link.visibility}</span>
                </td>
                <td>
                  <div className="ml-tag-list">
                    {link.tags.slice(0, 3).map(t => (
                      <span key={t} className="ml-tag">{t}</span>
                    ))}
                    {link.tags.length > 3 && (
                      <span className="ml-tag-more">+{link.tags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td>{link.like_count}</td>
                <td>{link.view_count}</td>
                <td>{link.comment_count}</td>
                <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-4)' }}>
                  {new Date(link.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
