'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const isHome = usePathname() === '/';
  return (
    <footer className="home-footer" data-home={isHome}>
      <div className="footer-bg" />
      <div className="footer-inner">
        <div className="footer-col brand">
          <div className="footer-logo">gx</div>
          <p className="footer-desc">A community for sharing and discovering the best links on the web.</p>
        </div>
        <div className="footer-col links-col">
          <h5 className="footer-heading">Resources</h5>
          <Link href="/explore" className="footer-link">Explore</Link>
          <Link href="/leaderboard" className="footer-link">Leaderboard</Link>
          <Link href="/tags" className="footer-link">Tags</Link>
          <Link href="/daily-dose" className="footer-link">Daily Dose</Link>
        </div>
        <div className="footer-col links-col">
          <h5 className="footer-heading">Community</h5>
          <Link href="/users" className="footer-link">Users</Link>
          <Link href="/submit" className="footer-link">Submit Link</Link>
          <Link href="/tools" className="footer-link">Tools</Link>
        </div>
        <div className="footer-col links-col">
          <h5 className="footer-heading">Legal</h5>
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
          <Link href="/terms" className="footer-link">Terms of Service</Link>
          <Link href="/cookies" className="footer-link">Cookie Policy</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Glinqx. All rights reserved.</span>
      </div>
    </footer>
  );
}
