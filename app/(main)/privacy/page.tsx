'use client';

import React from 'react';
import Topbar from '@/components/common/Topbar';

export default function PrivacyPage() {
  return (
    <>
      <Topbar title="Privacy Policy" />
      <div id="content" className="legal-page fade-in">
        <h1>Privacy Policy</h1>
        <p className="legal-date">Last updated: September 30, 2026</p>

        <section>
          <h2>Information We Collect</h2>
          <p>When you create an account we store your email address, username, password hash and, if you upload them, your avatar and cover images. If you sign in with Google, we receive your name, email and profile picture from Google. Content you post — links, comments, tags, and feedback reports — is stored along with your account. When you use the developer tools we keep the generated short link, transferred file or shared text, optionally linked to your account so you can manage it from your profile.</p>
        </section>

        <section>
          <h2>Public Content</h2>
          <p>Links you post as public, and feedback reports you post as public, are visible to everyone, including signed-out visitors — including your username as the author. Private feedback reports are visible only to you and the site maintainers. Tool output (short links, transferred files, shared texts) is accessible to anyone who has the link, and expires automatically: short links after 24 hours, transferred files and shared texts after the lifetime you chose when creating them.</p>
        </section>

        <section>
          <h2>Analytics</h2>
          <p>We record view and click events for links on the platform (which link was viewed or clicked and when) to power dashboards and leaderboards. These events are first-party, tied to the content rather than to a persistent profile of you, and are not shared with advertising networks. We do not sell your personal data to anyone.</p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>We rely on a small number of processors to run the platform: Neon for the database, Cloudinary for image storage (avatars, covers, feedback screenshots and transferred files), and Google for sign-in. Fonts are loaded from Google Fonts. These services receive only what is needed to provide their function. Embedded content on external sites you navigate to is governed by those sites&apos; own policies.</p>
        </section>

        <section>
          <h2>Data Storage &amp; Security</h2>
          <p>Passwords are stored only as hashes. Sessions use a signed, httpOnly cookie. Data is encrypted in transit and at rest by our infrastructure providers, and is retained only as long as your account is active or the content itself has not expired.</p>
        </section>

        <section>
          <h2>Deletion</h2>
          <p>You can delete your own content at any time: links, comments, feedback reports and tool output from your profile. Deleting a feedback report also removes its screenshot. When your account is deleted, content you posted is kept but unattributed — it stops showing your username.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>If you have questions about this Privacy Policy, or want to exercise access, correction or deletion rights, please reach out to our support team.</p>
        </section>
      </div>
    </>
  );
}
