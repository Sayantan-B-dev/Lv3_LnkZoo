'use client';

import React from 'react';
import Topbar from '@/components/common/Topbar';

export default function TermsPage() {
  return (
    <>
      <Topbar title="Terms of Service" />
      <div id="content" className="legal-page fade-in">
        <h1>Terms of Service</h1>
        <p className="legal-date">Last updated: September 30, 2026</p>

        <section>
          <h2>Acceptance of Terms</h2>
          <p>By accessing or using LnkZoo, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
        </section>

        <section>
          <h2>Your Account</h2>
          <p>You are responsible for keeping your account credentials confidential and for all activity under your account. You must provide accurate information when registering and may be asked to stop using a username that impersonates another person or the platform itself.</p>
        </section>

        <section>
          <h2>Content You Post</h2>
          <p>You are responsible for the links, comments, tags and feedback reports you post. You agree not to post content that is illegal, abusive, hateful, infringes on the rights of others, or links to malware or phishing. You retain ownership of what you submit; by posting it you grant LnkZoo a non-exclusive, royalty-free license to display and distribute it on the platform for as long as you choose to keep it there.</p>
        </section>

        <section>
          <h2>Public and Private Content</h2>
          <p>Links and feedback reports you mark public can be seen by anyone, and you should assume anything public may be read, linked to or quoted. Feedback you mark private is visible only to you and the site maintainers. Do not post secrets in public content, and do not rely on tool output (short links, transferred files, shared texts) for anything long-lived — it expires automatically.</p>
        </section>

        <section>
          <h2>Fair Use of the Platform</h2>
          <p>The tools and APIs are rate-limited, and you agree not to circumvent those limits or attempt to disrupt the service, scrape it aggressively, bypass its security measures, or use it to proxy requests to systems you do not have permission to reach. Accounts used for abuse may be rate-limited, suspended or terminated.</p>
        </section>

        <section>
          <h2>Moderation</h2>
          <p>Maintainers may set a status on feedback reports, remove content that violates these terms, and suspend or terminate accounts. If your account is terminated for violations, you may not re-register without permission.</p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>LnkZoo is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to loss of data or interruption of service.</p>
        </section>

        <section>
          <h2>Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of LnkZoo after changes constitutes acceptance of the new terms.</p>
        </section>
      </div>
    </>
  );
}
