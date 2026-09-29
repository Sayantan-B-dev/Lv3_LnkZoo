'use client';

import React from 'react';
import Topbar from '@/components/common/Topbar';

export default function CookiesPage() {
  return (
    <>
      <Topbar title="Cookie Policy" />
      <div id="content" className="legal-page fade-in">
        <h1>Cookie Policy</h1>
        <p className="legal-date">Last updated: September 30, 2026</p>

        <section>
          <h2>What Are Cookies</h2>
          <p>Cookies are small text files stored on your device by your web browser. They help websites remember your preferences and keep you signed in. Sites can also store similar data in your browser&apos;s local storage, which works the same way from your point of view.</p>
        </section>

        <section>
          <h2>The Session Cookie</h2>
          <p>LnkZoo sets exactly one cookie: <strong>lnkzoo_token</strong>, your sign-in session. It is httpOnly (invisible to scripts), restricted to this site, lasts 30 days unless you sign out sooner, and contains nothing but a signed token identifying your session. Without it you can still read the site — including the public feedback board — you just cannot post or manage your content.</p>
        </section>

        <section>
          <h2>Local Storage Preferences</h2>
          <p>We use your browser&apos;s local storage, not cookies, for a few preferences: your light/dark theme choice, and the state of an in-progress tool result (like a short link you just created on the Tools page) so a refresh does not lose it. These never leave your device and are not sent to us with requests.</p>
        </section>

        <section>
          <h2>Analytics</h2>
          <p>View and click analytics are recorded server-side, first-party, and do not use cookies or cross-site tracking of any kind.</p>
        </section>

        <section>
          <h2>Third Parties</h2>
          <p>We set no third-party tracking cookies. Loading fonts from Google Fonts makes a request to Google&apos;s servers, which are governed by Google&apos;s policies; no LnkZoo cookie data is involved. Embedded external content may set its own cookies under its own policy.</p>
        </section>

        <section>
          <h2>Managing Cookies</h2>
          <p>You can clear or block cookies in your browser settings. Blocking the session cookie signs you out and may affect functionality — particularly posting and account management. Clearing local storage resets your theme and tool-page state.</p>
        </section>

        <section>
          <h2>Updates</h2>
          <p>We may update this Cookie Policy as our practices evolve. Any changes will be reflected on this page.</p>
        </section>
      </div>
    </>
  );
}
