'use client';

import React from 'react';
import Topbar from '@/components/common/Topbar';

export default function TermsPage() {
  return (
    <>
      <Topbar title="Terms of Service" />
      <div id="content" className="legal-page fade-in">
        <h1>Terms of Service</h1>
        <p className="legal-date">Last updated: June 5, 2026</p>

        <section>
          <h2>Acceptance of Terms</h2>
          <p>By accessing or using Linkzoo, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
        </section>

        <section>
          <h2>User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree not to post content that is illegal, abusive, or infringes on the rights of others. You must not attempt to disrupt the service or bypass any security measures.</p>
        </section>

        <section>
          <h2>Content Ownership</h2>
          <p>You retain ownership of any links and content you submit to Linkzoo. By submitting content, you grant Linkzoo a non-exclusive, royalty-free license to display and distribute your content on the platform.</p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>Linkzoo is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to loss of data or interruption of service.</p>
        </section>

        <section>
          <h2>Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may stop using the service at any time and request deletion of your account.</p>
        </section>

        <section>
          <h2>Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of Linkzoo after changes constitutes acceptance of the new terms.</p>
        </section>
      </div>
    </>
  );
}
