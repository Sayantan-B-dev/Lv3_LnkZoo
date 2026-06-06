'use client';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    }
  }

  return (
    <div className="ml-pagination">
      <button className="ml-page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </button>
      {pages.map((p, i) => (
        <span key={p} style={{ display: 'contents' }}>
          {i > 0 && pages[i - 1] !== p - 1 && <span className="ml-page-info">...</span>}
          <button className={`ml-page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>
            {p}
          </button>
        </span>
      ))}
      <button className="ml-page-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
      <span className="ml-page-info">{total} total</span>
    </div>
  );
}
