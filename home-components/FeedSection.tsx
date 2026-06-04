'use client';

import React from 'react';
import LinkCard from '@/components/links/LinkCard';
import SortDropdown from '@/components/common/SortDropdown';
import { Reveal } from './Reveal';

interface FeedSectionProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  activeTab: string;
  setActiveTab: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  links: any[];
  loading: boolean;
  handleLike: (id: string) => void;
  onLinkClick: (id: string) => void;
}

export function FeedSection(props: FeedSectionProps) {
  return (
    <Reveal disableExit>
      <section className="feed-section">
        <div className="feed-container">
          <div style={{ marginBottom: '24px' }}>
            <h2 className="section-label" style={{ marginBottom: '16px' }}>Browse Links</h2>
            <div className="search-bar">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input
                type="text"
                placeholder="Search the web..."
                value={props.searchQuery}
                onChange={function(e) { props.setSearchQuery(e.target.value); }}
                className="feed-search-input"
              />
            </div>
          </div>

          {!props.searchQuery && (
            <div className="tabs-row" style={{ marginBottom: '20px' }}>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button className={'tab' + (props.activeTab === 'following' ? ' active' : '')} onClick={function() { props.setActiveTab('following'); }}>following</button>
                <button className={'tab' + (props.activeTab === 'explore' ? ' active' : '')} onClick={function() { props.setActiveTab('explore'); }}>explore</button>
                <button className={'tab' + (props.activeTab === 'recommended' ? ' active' : '')} onClick={function() { props.setActiveTab('recommended'); }}>for you</button>
              </div>
              <SortDropdown value={props.sortBy} onChange={function(v) { props.setSortBy(v); }} />
            </div>
          )}

          <div id="home-feed">
            {props.loading ? (
              Array.from({ length: 5 }).map(function(_, i) {
                return <div key={i} className="link-card" style={{ height: '120px' }}>
                  <div className="skel" style={{ width: '100%', height: '100%' }} />
                </div>;
              })
            ) : props.links.length === 0 ? (
              <div className="empty">No results found.</div>
            ) : (
              props.links.map(function(link: any) {
                return <LinkCard
                  key={link.id}
                  link={link}
                  variant="full"
                  showPreview={true}
                  onLike={function(id: string) { return Promise.resolve(props.handleLike(id)); }}
                  onClick={function() { props.onLinkClick(link.id); }}
                  isClickable={true}
                />;
              })
            )}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
