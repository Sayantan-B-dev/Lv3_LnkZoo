'use client';

import React from 'react';
import { FEATURES_DATA } from './data';
import { Reveal } from './Reveal';

export function FeaturesSection() {
  return (
    <Reveal>
      <section className="features-section">
        <div className="about-ghost" style={{ right: '0', left: 'auto' }}>02</div>
        <h2 className="section-label" style={{ textAlign: 'center', marginBottom: '8px' }}>Why Glinqx</h2>
        <h3 className="features-heading">Everything you need to <br />share and discover links.</h3>
        <div className="features-grid">
          <div className="features-row wide-left">
            <div className="feature-card">
              <span className="feature-icon">{React.createElement(FEATURES_DATA[0].icon)}</span>
              <h4>{FEATURES_DATA[0].title}</h4>
              <p>{FEATURES_DATA[0].desc}</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">{React.createElement(FEATURES_DATA[1].icon)}</span>
              <h4>{FEATURES_DATA[1].title}</h4>
              <p>{FEATURES_DATA[1].desc}</p>
            </div>
          </div>
          <div className="features-row wide-right">
            <div className="feature-card">
              <span className="feature-icon">{React.createElement(FEATURES_DATA[2].icon)}</span>
              <h4>{FEATURES_DATA[2].title}</h4>
              <p>{FEATURES_DATA[2].desc}</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">{React.createElement(FEATURES_DATA[3].icon)}</span>
              <h4>{FEATURES_DATA[3].title}</h4>
              <p>{FEATURES_DATA[3].desc}</p>
            </div>
          </div>
          <div className="features-row triple">
            {FEATURES_DATA.slice(4, 7).map(function(f, i) {
              return <div key={i} className="feature-card">
                <span className="feature-icon">{React.createElement(f.icon)}</span>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>;
            })}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
