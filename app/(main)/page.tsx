'use client';

import React, { useState, useEffect } from 'react';
import Topbar from '@/components/common/Topbar';
import { useRouter } from 'next/navigation';
import { useScrollProgress } from './home-components/hooks';
import { HeroSection } from './home-components/HeroSection';
import { MarqueeSection } from './home-components/MarqueeSection';
import { AboutSection } from './home-components/AboutSection';
import { FeaturesSection } from './home-components/FeaturesSection';
import { HowItWorksSection } from './home-components/HowItWorksSection';
import { MetricsSection } from './home-components/MetricsSection';
import { FeedSection } from './home-components/FeedSection';
import { FAQSection } from './home-components/FAQSection';
import { TutorialSection } from './home-components/TutorialSection';
import { CTASection } from './home-components/CTASection';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('explore');
  const [sortBy, setSortBy] = useState('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/stats').then(function(r) { return r.ok && r.json(); }).then(function(d) { setStats(d); }).catch(function() {});
  }, []);

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
        <HowItWorksSection />
        <MetricsSection stats={stats} />
        <FeedSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <FAQSection faqOpen={faqOpen} setFaqOpen={setFaqOpen} />
        <TutorialSection />
        <CTASection onShareClick={function() { router.push('/submit'); }} />
      </div>

    </>
  );
}
