'use client';

import React, { useState, useEffect } from 'react';
import Topbar from '@/components/common/Topbar';
import { useRouter } from 'next/navigation';
import { useScrollProgress } from './home-components/hooks';
import { HeroSection } from './home-components/HeroSection';
import { MarqueeSection } from './home-components/MarqueeSection';
import { AboutSection } from './home-components/AboutSection';
import { FeaturesSection } from './home-components/FeaturesSection';
import { MetricsSection } from './home-components/MetricsSection';
import { FeedSection } from './home-components/FeedSection';
import { FAQSection } from './home-components/FAQSection';
import { CTASection } from './home-components/CTASection';
import { FooterSection } from './home-components/FooterSection';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('explore');
  const [sortBy, setSortBy] = useState('new');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/stats').then(function(r) { return r.ok && r.json(); }).then(function(d) { setStats(d); }).catch(function() {});
  }, []);

  function fetchLinks(query?: string) {
    setLoading(true);
    var url = query
      ? '/api/links?q=' + encodeURIComponent(query)
      : '/api/links?tab=' + activeTab + '&sort=' + sortBy;
    fetch(url).then(function(res) {
      if (res.ok) {
        res.json().then(function(data) { setLinks(data.links); });
      }
    }).catch(function(err) {
      console.error('Failed to fetch links', err);
    }).finally(function() {
      setLoading(false);
    });
  }

  useEffect(function() {
    if (!searchQuery) fetchLinks();
  }, [activeTab, sortBy]);

  useEffect(function() {
    var timer = setTimeout(function() {
      if (searchQuery.trim()) fetchLinks(searchQuery);
    }, 400);
    return function() { clearTimeout(timer); };
  }, [searchQuery]);

  function handleLike(id: string) {
    fetch('/api/links/' + id + '/like', { method: 'POST' }).then(function(res) {
      if (res.status === 401) { router.push('/login?from=/'); return; }
      if (res.ok) fetchLinks(searchQuery);
    }).catch(function(err) { console.error(err); });
  }

  var scrollProgress = useScrollProgress();

  return (
    <>
      <div className="progress-bar" style={{ transform: 'scaleX(' + scrollProgress + ')' }} />
      <Topbar title="Home" />

      <div id="main-content" className="home-page">
        <HeroSection stats={stats} onShareClick={function() { router.push('/submit'); }} />
        <MarqueeSection />
        <AboutSection stats={stats} />
        <FeaturesSection />
        <MetricsSection stats={stats} />
        <FeedSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sortBy={sortBy}
          setSortBy={setSortBy}
          links={links}
          loading={loading}
          handleLike={handleLike}
          onLinkClick={function(id) { router.push('/link/' + id); }}
        />
        <FAQSection faqOpen={faqOpen} setFaqOpen={setFaqOpen} />
        <CTASection onShareClick={function() { router.push('/submit'); }} />
      </div>

      <FooterSection />
    </>
  );
}
