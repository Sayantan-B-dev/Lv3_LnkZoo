'use client';

import { Reveal } from './Reveal';

export function CTASection({ onShareClick }: { onShareClick: () => void }) {
  return (
    <Reveal disableExit>
      <section className="cta-section">
        <div className="cta-ghost">LNKZOO</div>
        <div className="cta-content">
          <h2 className="cta-heading">Ready to start sharing?</h2>
          <p className="cta-desc">Join a growing community of curators, explorers, and link lovers.</p>
          <button className="hero-btn primary" onClick={onShareClick} style={{ fontSize: '14px', padding: '12px 32px' }}>Join the Community</button>
        </div>
      </section>
    </Reveal>
  );
}
