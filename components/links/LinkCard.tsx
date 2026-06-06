'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

interface LinkCardProps {
  link: any;
  variant?: 'full' | 'mini' | 'profile' | 'dose';
  showVotes?: boolean;
  showComments?: boolean;
  showViews?: boolean;
  showTags?: boolean;
  showPreview?: boolean;
  showPoster?: boolean;
  showDescription?: boolean;
  doseNumber?: number;
  onLike?: (linkId: string) => Promise<void>;
  onClick?: () => void;
  isClickable?: boolean;
  isOwner?: boolean;
  onVisibilityChange?: (linkId: string, visibility: string) => void;
}

export default function LinkCard({
  link,
  variant = 'full',
  showVotes = true,
  showComments = true,
  showViews = true,
  showTags = true,
  showPreview = false,
  showPoster = true,
  showDescription = true,
  doseNumber,
  onLike,
  onClick,
  isClickable = true,
  isOwner = false,
  onVisibilityChange,
}: LinkCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [likeCount, setLikeCount] = React.useState(link.like_count ?? 0);
  const [likedByUser, setLikedByUser] = React.useState(!!link.liked_by_user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentVisibility, setCurrentVisibility] = useState(link.visibility || 'public');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentVisibility(link.visibility || 'public');
  }, [link.visibility]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeVisibility = async (v: string) => {
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: v }),
      });
      if (res.ok) {
        setCurrentVisibility(v);
        addToast(`Visibility changed to ${v}`, 'success');
        onVisibilityChange?.(link.id, v);
      } else {
        addToast('Failed to change visibility', 'error');
      }
    } catch {
      addToast('Failed to change visibility', 'error');
    }
    setMenuOpen(false);
  };

  const visibilityLabel = (v: string) => {
    if (v === 'public') return 'Public';
    if (v === 'followers') return 'Followers';
    return 'Private';
  };

  const visibilityIcon = (v: string) => {
    if (v === 'public') return '\uD83C\uDF10';
    if (v === 'followers') return '\uD83D\uDC65';
    return '\uD83D\uDD12';
  };

  React.useEffect(() => {
    setLikeCount(link.like_count ?? 0);
    setLikedByUser(!!link.liked_by_user);
  }, [link.like_count, link.liked_by_user]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (onLike) {
        await onLike(link.id);
        return;
      }

      const res = await fetch(`/api/links/${link.id}/like`, { method: 'POST' });
      if (res.status === 401) {
        router.push(`/login?from=${window.location.pathname}`);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLikedByUser(data.liked);
        setLikeCount(data.like_count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (isClickable) {
      router.push(`/link/${link.id}`);
    }
  };

  const domain = new URL(link.original_url).hostname;
  const date = new Date(link.created_at).toLocaleDateString();

  const renderFooter = () => (
    <div className="card-footer">
      <button
        className={`card-stat like-stat ${likedByUser ? 'active' : ''}`}
        onClick={handleLike}
        type="button"
        title={likedByUser ? 'Unlike' : 'Like'}
      >
        <svg width="14" height="14" fill={likedByUser ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.35-1.92-4.25-4.29-4.25-1.69 0-3.15.97-3.85 2.38A4.32 4.32 0 008.86 4C6.48 4 4.5 5.9 4.5 8.25c0 6.03 7.5 10.75 7.5 10.75s9-4.72 9-10.75z" />
        </svg>
        <span>{likeCount}</span>
      </button>
      {showComments && (
        <span className="card-stat">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <span>{link.comment_count ?? 0}</span>
        </span>
      )}
    </div>
  );

  // Full variant - complete card with votes and all info
  if (variant === 'full') {
    return (
      <div
        className="link-card"
        onClick={handleCardClick}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
      >
        {/* {showVotes && (
          <div className="vote-col" onClick={(e) => e.stopPropagation()}>
            <button className="vote-btn up" onClick={(e) => handleVote(e, 1)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <span className="vote-count">{link.upvote_count - link.downvote_count}</span>
            <button className="vote-btn down" onClick={(e) => handleVote(e, -1)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        )} */}

        <div className="card-body">
          <div className="card-meta">
            <span className="card-domain">{domain}</span>
            <span className={`vis-badge vis-${currentVisibility}`} title={visibilityLabel(currentVisibility)}>
              {visibilityIcon(currentVisibility)}
            </span>
            {showPoster && (
              <span className="card-poster" onClick={(e) => e.stopPropagation()}>
                {link.is_anonymous ? (
                  <span className="anon-badge">anon</span>
                ) : (
                  <Link href={`/profile/${link.username}`}>@{link.username}</Link>
                )}
              </span>
            )}
            <span className="card-time">{date}</span>
            {isOwner && (
              <div className="card-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button className="card-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                {menuOpen && (
                  <div className="card-menu-dropdown">
                    {['public', 'followers', 'private'].map(v => (
                      <button
                        key={v}
                        className={`card-menu-item ${currentVisibility === v ? 'active' : ''}`}
                        onClick={() => changeVisibility(v)}
                      >
                        {visibilityIcon(v)} {visibilityLabel(v)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card-title" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '5px' }}>
            {link.title}
          </div>

          {showDescription && <div className="card-desc">{link.description}</div>}

          {showTags && link.tags && link.tags.length > 0 && (
            <div className="card-tags" onClick={(e) => e.stopPropagation()}>
              {link.tags.map((tag: string) => (
                <Link key={tag} href={`/tags/${tag}`} className="tag">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {renderFooter()}
        </div>
        {showPreview && link.preview_image && (
          <div className="card-preview right">
            <img src={link.preview_image} alt={link.title} />
          </div>
        )}
      </div>
    );
  }

  // Mini variant - compact card
  if (variant === 'mini') {
    return (
      <div className="link-card mini" onClick={handleCardClick} style={{ cursor: isClickable ? 'pointer' : 'default' }}>
        <div className="card-body">
          <div className="card-meta">
            <span className="card-domain">{domain}</span>
            <span className={`vis-badge vis-${currentVisibility}`} title={visibilityLabel(currentVisibility)}>
              {visibilityIcon(currentVisibility)}
            </span>
            {showPoster && (
              <span className="card-poster" onClick={(e) => e.stopPropagation()}>
                {link.is_anonymous ? (
                  <span className="anon-badge">anon</span>
                ) : (
                  <Link href={`/profile/${link.username}`}>@{link.username}</Link>
                )}
              </span>
            )}
            <span className="card-time">{date}</span>
            {isOwner && (
              <div className="card-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button className="card-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                {menuOpen && (
                  <div className="card-menu-dropdown">
                    {['public', 'followers', 'private'].map(v => (
                      <button
                        key={v}
                        className={`card-menu-item ${currentVisibility === v ? 'active' : ''}`}
                        onClick={() => changeVisibility(v)}
                      >
                        {visibilityIcon(v)} {visibilityLabel(v)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Link href={`/link/${link.id}`} className="card-title" style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)', marginBottom: '5px', display: 'block' }} onClick={(e) => e.preventDefault()}>
              {link.title}
            </Link>
          {showDescription && <div className="card-desc">{link.description}</div>}

          {showTags && link.tags && link.tags.length > 0 && (
            <div className="card-tags" onClick={(e) => e.stopPropagation()}>
              {link.tags.map((tag: string) => (
                <Link key={tag} href={`/tags/${tag}`} className="tag">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          {renderFooter()}
        </div>
        {showPreview && link.preview_image && (
          <div className="card-preview right">
            <img src={link.preview_image} alt={link.title} />
          </div>
        )}
      </div>
    );
  }

  // Profile variant - simplified card
  if (variant === 'profile') {
    return (
      <div className="link-card" onClick={() => router.push(`/link/${link.id}`)} style={{ cursor: 'pointer' }}>
        <div className="card-body">
                    <div className="card-meta">
            <span className="card-domain">{domain}</span>
            <span className={`vis-badge vis-${currentVisibility}`} title={visibilityLabel(currentVisibility)}>
              {visibilityIcon(currentVisibility)}
            </span>
            {showPoster && (
              <span className="card-poster" onClick={(e) => e.stopPropagation()}>
                {link.is_anonymous ? (
                  <span className="anon-badge">anon</span>
                ) : (
                  <span onClick={(e) => { e.stopPropagation(); router.push(`/profile/${link.username}`); }} style={{ cursor: 'pointer' }}>@{link.username}</span>
                )}
              </span>
            )}
            <span className="card-time">{date}</span>
            {isOwner && (
              <div className="card-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button className="card-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                {menuOpen && (
                  <div className="card-menu-dropdown">
                    {['public', 'followers', 'private'].map(v => (
                      <button
                        key={v}
                        className={`card-menu-item ${currentVisibility === v ? 'active' : ''}`}
                        onClick={() => changeVisibility(v)}
                      >
                        {visibilityIcon(v)} {visibilityLabel(v)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="card-title" style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)', marginBottom: '5px', display: 'block' }}>
              {link.title}
            </div>
          {showDescription && <div className="card-desc">{link.description}</div>}
          {showTags && link.tags && link.tags.length > 0 && (
            <div className="card-tags" onClick={(e) => e.stopPropagation()}>
              {link.tags.map((tag: string) => (
                <Link key={tag} href={`/tags/${tag}`} className="tag">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          {renderFooter()}
        </div>
        {showPreview && link.preview_image && (
          <div className="card-preview right">
            <img src={link.preview_image} alt={link.title} />
          </div>
        )}
      </div>
    );
  }

  // Dose variant - numbered with special styling
  if (variant === 'dose') {
    return (
      <div className="dose-card">
        {doseNumber && <div className="dose-number">0{doseNumber}</div>}
        <div className="link-card" style={{ flex: 1, marginBottom: 0 }}>
          <div className="card-body">
          <div className="card-meta">
            <span className="card-domain">{domain}</span>
            <span className={`vis-badge vis-${currentVisibility}`} title={visibilityLabel(currentVisibility)}>
              {visibilityIcon(currentVisibility)}
            </span>
            {showPoster && (
              <span className="card-poster" onClick={(e) => e.stopPropagation()}>
                {link.is_anonymous ? (
                  <span className="anon-badge">anon</span>
                ) : (
                  <Link href={`/profile/${link.username}`}>@{link.username}</Link>
                )}
              </span>
            )}
            <span className="card-time">{date}</span>
            {isOwner && (
              <div className="card-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button className="card-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                {menuOpen && (
                  <div className="card-menu-dropdown">
                    {['public', 'followers', 'private'].map(v => (
                      <button
                        key={v}
                        className={`card-menu-item ${currentVisibility === v ? 'active' : ''}`}
                        onClick={() => changeVisibility(v)}
                      >
                        {visibilityIcon(v)} {visibilityLabel(v)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
            <Link href={`/link/${link.id}`} className="card-title" style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)', marginBottom: '5px', display: 'block' }}>
              {link.title}
            </Link>
            {showDescription && <div className="card-desc">{link.description}</div>}
            {showTags && link.tags && link.tags.length > 0 && (
            <div className="card-tags" onClick={(e) => e.stopPropagation()}>
              {link.tags.map((tag: string) => (
                <Link key={tag} href={`/tags/${tag}`} className="tag">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
            {renderFooter()}
          </div>
        </div>
        {showPreview && link.preview_image && (
          <div className="card-preview right">
            <img src={link.preview_image} alt={link.title} />
          </div>
        )}
      </div>
    );
  }

  return null;
}
