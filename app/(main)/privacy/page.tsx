'use client';

import React from 'react';
import Topbar from '@/components/common/Topbar';

export default function PrivacyPage() {
  return (
    <>
      <Topbar title="Privacy Policy" />
      <div id="content" className="legal-page fade-in">
        <h1>Privacy Policy</h1>
        <p className="legal-date">Last updated: June 5, 2026</p>

        <section>
          <h2>Information We Collect</h2>
          <p>When you use Linkzoo, we collect information you provide directly, such as your email address and username when creating an account, and any links you submit or save. We also collect usage data including pages visited and interactions with content.</p>
        </section>

        <section>
          <h2>How We Use Your Information</h2>
          <p>Your information is used to operate and improve Linkzoo, personalize your experience, communicate with you about service updates, and enforce our terms. We never sell your personal data to third parties.</p>
        </section>

        <section>
          <h2>Data Storage & Security</h2>
          <p>We implement industry-standard security measures including encryption at rest and in transit. Your data is stored securely on our servers and retained only as long as necessary to provide our services.</p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can also export your data from your account settings.</p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>Linkzoo may contain links to external websites. We are not responsible for the privacy practices of these third parties. We encourage you to review their policies before providing any personal information.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>If you have questions about this Privacy Policy, please reach out to our support team.</p>
        </section>
      </div>
    </>
  );
}
