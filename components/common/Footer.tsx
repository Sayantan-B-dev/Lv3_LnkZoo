import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="home-footer">
      <div className="footer-bg" />
      <div className="footer-inner">
        <div className="footer-col brand">
          <div className="footer-logo">gx</div>
          <p className="footer-desc">A community for sharing and discovering the best links on the web.</p>
        </div>
        <div className="footer-col">
          <h5 className="footer-heading">Resources</h5>
          <Link href="/explore" className="footer-link">Explore</Link>
          <Link href="/leaderboard" className="footer-link">Leaderboard</Link>
          <Link href="/tags" className="footer-link">Tags</Link>
          <Link href="/daily-dose" className="footer-link">Daily Dose</Link>
        </div>
        <div className="footer-col">
          <h5 className="footer-heading">Community</h5>
          <Link href="/users" className="footer-link">Users</Link>
          <Link href="/submit" className="footer-link">Submit Link</Link>
          <Link href="/tools" className="footer-link">Tools</Link>
        </div>
        <div className="footer-col">
          <h5 className="footer-heading">Legal</h5>
          <span className="footer-link passive">Privacy Policy</span>
          <span className="footer-link passive">Terms of Service</span>
          <span className="footer-link passive">Cookie Policy</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Glinqx. All rights reserved.</span>
      </div>
    </footer>
  );
}
