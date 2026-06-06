'use client';

import React from 'react';
import Topbar from '@/components/common/Topbar';

export default function CookiesPage() {
  return (
    <>
      <Topbar title="Cookie Policy" />
      <div id="content" className="legal-page fade-in">
        <h1>Cookie Policy</h1>
        <p className="legal-date">Last updated: June 5, 2026</p>

        <section>
          <h2>What Are Cookies</h2>
          <p>Cookies are small text files stored on your device by your web browser. They help websites remember your preferences and improve your browsing experience.</p>
        </section>

        <section>
          <h2>How We Use Cookies</h2>
          <p>Linkzoo uses essential cookies for authentication and security — these are necessary for the platform to function. We also use preference cookies to remember your theme and layout settings.</p>
        </section>

        <section>
          <h2>Analytics</h2>
          <p>We use minimal analytics to understand how the platform is used and to improve performance. These analytics are privacy-friendly and do not track you across other websites.</p>
        </section>

        <section>
          <h2>Third-Party Cookies</h2>
          <p>We do not use third-party tracking cookies. Any embedded content from external services may set their own cookies, which are governed by their respective policies.</p>
        </section>

        <section>
          <h2>Managing Cookies</h2>
          <p>You can control cookies through your browser settings. Disabling certain cookies may affect the functionality of Linkzoo, particularly authentication and theme preferences.</p>
        </section>

        <section>
          <h2>Updates</h2>
          <p>We may update this Cookie Policy as our practices evolve. Any changes will be reflected on this page.</p>
        </section>
      </div>
    </>
  );
}
