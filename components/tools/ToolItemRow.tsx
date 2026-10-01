'use client';

import React from 'react';
import { formatCountdown } from '@/lib/textShareRules';
import { formatBytes } from '@/lib/tempFileRules';

export type ToolItemType = 'short' | 'file' | 'text';

export interface ToolItem {
  type: ToolItemType;
  code: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  originalUrl?: string;
  clickCount?: number;
  fileName?: string;
  sizeBytes?: number;
  preview?: string;
}

const TYPE_META: Record<ToolItemType, { label: string; icon: React.ReactNode }> = {
  short: {
    label: 'URL Shortener',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 7H7a5 5 0 000 10h2" />
        <path d="M15 7h2a5 5 0 010 10h-2" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  file: {
    label: 'File Transfer',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M4 20h16" />
      </svg>
    ),
  },
  text: {
    label: 'Text Share',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h9" />
      </svg>
    ),
  },
};

/** Stable identity for React keys and in-flight requests. */
export const toolItemKey = (item: ToolItem) => `${item.type}:${item.code}`;

/** The type-specific second line: the shortened URL, filename or text preview. */
export const toolItemLabel = (item: ToolItem): string | undefined => {
  if (item.type === 'short') return item.originalUrl;
  if (item.type === 'file') return item.fileName;
  return item.preview;
};

export const stripOrigin = (url: string) => url.replace(/^https?:\/\/[^/]+/, '');

interface ToolItemRowProps {
  item: ToolItem;
  /** Shared 1s ticker value, so one timer drives every row on a page. */
  now: number;
  /** Omit to render the row read-only (no Destroy button). */
  onDestroy?: (item: ToolItem) => void;
  destroying?: boolean;
}

export default function ToolItemRow({ item, now, onDestroy, destroying }: ToolItemRowProps) {
  const remaining = Math.max(
    0,
    Math.ceil((new Date(item.expiresAt).getTime() - now) / 1000)
  );
  const label = toolItemLabel(item);

  return (
    <div className="tool-item">
      <span className="tool-item-icon">{TYPE_META[item.type].icon}</span>
      <div className="tool-item-body">
        <div className="tool-item-head">
          <span className="tool-item-type">{TYPE_META[item.type].label}</span>
          {item.type === 'short' && (
            <span className="tool-item-extra">{item.clickCount ?? 0} clicks</span>
          )}
          {item.type === 'file' && (
            <span className="tool-item-extra">{formatBytes(item.sizeBytes ?? 0)}</span>
          )}
          <span
            className="tool-item-expiry"
            title={`Destroyed at ${new Date(item.expiresAt).toLocaleString()}`}
          >
            {formatCountdown(remaining)} left
          </span>
        </div>
        <div className="tool-item-sub">
          <a href={item.url} target="_blank" rel="noreferrer" className="tool-item-url">
            {stripOrigin(item.url)}
          </a>
          {label && <span className="tool-item-name">{label}</span>}
        </div>
      </div>
      {onDestroy && (
        <button
          type="button"
          className="tool-item-destroy"
          onClick={() => onDestroy(item)}
          disabled={destroying}
        >
          {destroying ? '...' : 'Destroy'}
        </button>
      )}
    </div>
  );
}
