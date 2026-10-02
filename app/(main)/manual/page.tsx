'use client';

import React from 'react';
import Link from 'next/link';
import Topbar from '@/components/common/Topbar';
import NotificationPanel from '@/components/common/NotificationPanel';
import { useAuth } from '@/context/AuthContext';
import {
  ALL_SECTIONS,
  AUDIENCE_LABEL,
  accessLabel,
  type NavAudience,
  type NavRoute,
} from '@/lib/navRoutes';

const RANK: Record<NavAudience, number> = { guest: 0, user: 1, admin: 2 };

/** A section is as restricted as its most restricted route. */
function sectionAudience(items: NavRoute[]): NavAudience {
  return items.reduce<NavAudience>(
    (acc, item) => (RANK[item.audience] > RANK[acc] ? item.audience : acc),
    'guest'
  );
}

function accessClass(audience: NavAudience, signedIn: boolean): string {
  if (audience === 'guest') return 'open';
  if (!signedIn) return 'locked';
  return audience === 'admin' ? 'admin' : 'open';
}

export default function ManualPage() {
  const { user } = useAuth();
  const signedIn = !!user;

  return (
    <>
      <Topbar title="Manual" />
      <NotificationPanel />

      <div id="content">
        <div className="manual-page">
          <header className="manual-head">
            <h1 className="manual-title">The manual</h1>
            <p className="manual-sub">
              Every route in the sidebar, what it actually does, and whether you
              need an account for it. Read this once and you won&apos;t have to
              guess what a nav item is for — hover any sidebar link and you get
              the same one-liner as a bubble.
            </p>
            <p className="manual-you">
              You are browsing as{' '}
              <b>{user ? `@${user.username}${user.role === 'admin' ? ' (admin)' : ''}` : 'a guest'}</b>
              {signedIn
                ? ' — the signed-in column below is your view.'
                : ' — sign in for the Create, Account and Admin rows.'}
            </p>
          </header>

          <ul className="manual-legend">
            <li><span className="manual-tag open">Open</span> anyone, no account</li>
            <li><span className="manual-tag locked">Sign-in required</span> the sidebar hides it and the page sends you to /login</li>
            <li><span className="manual-tag admin">Admins only</span> needs the admin role</li>
          </ul>

          {ALL_SECTIONS.map((section) => {
            const audience = sectionAudience(section.items);
            return (
              <section key={section.label} className="manual-section">
                <div className="manual-section-head">
                  <h2 className="manual-section-title">{section.label}</h2>
                  <span className={`manual-tag ${audience === 'guest' ? 'open' : audience === 'admin' ? 'admin' : 'locked'}`}>
                    {AUDIENCE_LABEL[audience]}
                  </span>
                </div>

                <div className="manual-table-wrap">
                  <table className="manual-table">
                    <thead>
                      <tr>
                        <th>Route</th>
                        <th>What it&apos;s for</th>
                        <th>Logged out</th>
                        <th>Logged in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item) => (
                        <tr key={item.id}>
                          <td data-label="Route">
                            <Link href={item.href} className="manual-route">
                              {item.label}
                            </Link>
                            <code className="manual-path">{item.href}</code>
                          </td>
                          <td data-label="What it's for">
                            <span className="manual-about">{item.about}</span>
                          </td>
                          <td data-label="Logged out">
                            <span className={`manual-tag ${accessClass(item.audience, false)}`}>
                              {accessLabel(item.audience, false)}
                            </span>
                            {item.guestNote && (
                              <span className="manual-note">{item.guestNote}</span>
                            )}
                          </td>
                          <td data-label="Logged in">
                            <span className={`manual-tag ${accessClass(item.audience, true)}`}>
                              {accessLabel(item.audience, true)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}

          <footer className="manual-foot">
            <p>
              Short on time? The three things people ask about most:{' '}
              <Link href="/submit">post a link</Link> (needs an account),{' '}
              <Link href="/tools">use the tools</Link> (no account needed) and{' '}
              <Link href="/guest-pool">the guest pool</Link> (where anonymous tool
              links live until they expire).
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
