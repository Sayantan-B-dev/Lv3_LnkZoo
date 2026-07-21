'use client';

import React, { useState } from 'react';
import { Reveal } from './Reveal';
import { TUTORIAL_DATA } from './tutorialData';

export function TutorialSection() {
  const [activeTab, setActiveTab] = useState(0);

  const current = TUTORIAL_DATA[activeTab];

  return (
    <Reveal>
      <section className="tutorial-section">
        <div className="about-ghost">05</div>

        <h2 className="section-label" style={{ textAlign: 'center', marginBottom: '8px' }}>
          Full Platform Guide
        </h2>
        <h3 className="features-heading">
          Everything you can do on LnkZoo,<br />explained step by step.
        </h3>

        <div className="tutorial-tabs">
          {TUTORIAL_DATA.map((tab, i) => (
            <button
              key={tab.id}
              className={'tutorial-tab' + (i === activeTab ? ' active' : '')}
              onClick={() => setActiveTab(i)}
            >
              <span className="tutorial-tab-icon">{tab.icon}</span>
              <span className="tutorial-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tutorial-panel">
          <p className="tutorial-intro">{current.intro}</p>

          <div className="tutorial-steps">
            {current.steps.map((step, i) => (
              <div key={i} className="tutorial-step">
                <div className="tutorial-step-num">{i + 1}</div>
                <div className="tutorial-step-body">
                  <h4 className="tutorial-step-title">{step.title}</h4>
                  <p className="tutorial-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
