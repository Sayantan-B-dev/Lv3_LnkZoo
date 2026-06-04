'use client';

import React from 'react';
import { FAQ_DATA } from './data';
import { Reveal } from './Reveal';

export function FAQSection({ faqOpen, setFaqOpen }: { faqOpen: number | null; setFaqOpen: (v: number | null) => void }) {
  return (
    <Reveal>
      <section className="faq-section">
        <div className="faq-layout">
          <div className="faq-sticky">
            <div className="about-ghost">03</div>
            <h2 className="section-label">Got questions?</h2>
            <h3 className="faq-heading">Frequently asked <br />questions.</h3>
          </div>
          <div className="faq-accordion">
            {FAQ_DATA.map(function(item, i) {
              return <div key={i} className={'faq-item' + (faqOpen === i ? ' open' : '')}>
                <button className="faq-question" onClick={function() { setFaqOpen(faqOpen === i ? null : i); }}>
                  <span>{item.q}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={'faq-chevron' + (faqOpen === i ? ' open' : '')}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className="faq-answer" style={{ maxHeight: faqOpen === i ? '300px' : '0' }}>
                  <p>{item.a}</p>
                </div>
              </div>;
            })}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
