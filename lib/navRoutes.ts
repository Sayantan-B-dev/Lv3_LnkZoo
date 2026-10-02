/**
 * One source of truth for the sidebar's routes.
 *
 * The sidebar renders its sections from here and the `/manual` manual builds its
 * comparison table from the same list, so a label, a hint and the documented
 * access level cannot drift apart. Icons stay in `components/common/Sidebar.tsx`
 * (they are JSX, this file is data) keyed by `id`.
 *
 * `audience` is the *practical* answer to "who can use this page", matching
 * `proxy.ts` + `lib/policies.ts` + the per-page guards:
 *   guest → anyone   ·   user → needs a session   ·   admin → needs `role === 'admin'`
 */

export type NavAudience = 'guest' | 'user' | 'admin';

export interface NavRoute {
  id: string;
  label: string;
  href: string;
  /** Short line: the sidebar hover bubble and the table's one-liner. */
  hint: string;
  /** What the page actually does, for the manual. */
  about: string;
  audience: NavAudience;
  /** Caveat shown in the manual's "logged out" cell. */
  guestNote?: string;
  /** false = documented in the manual but not rendered as a sidebar section item. */
  sidebar?: false;
}

export interface NavSection {
  label: string;
  items: NavRoute[];
}

/** Shown to everyone, signed in or not. */
export const PUBLIC_SECTIONS: NavSection[] = [
  {
    label: 'Feed',
    items: [
      {
        id: 'home',
        label: 'Home',
        href: '/',
        hint: 'The landing page: hero, community stats and the tabbed link feed.',
        about:
          'Start here. Hero + platform stats, trending tags, the tabbed feed (Following / Explore / For You) with search and sorting, the FAQ and a step-by-step tutorial.',
        audience: 'guest',
      },
      {
        id: 'explore',
        label: 'Explore',
        href: '/explore',
        hint: 'Search and filter every public link.',
        about:
          'The full public catalogue. Search by title or tag, sort by newest / oldest / most liked, and narrow it down by category (source domain) or topic.',
        audience: 'guest',
      },
      {
        id: 'daily',
        label: 'Daily Dose',
        href: '/daily-dose',
        hint: 'The top 5 links of the last 24 hours.',
        about:
          'A short, curated list: the five most-liked links posted in the last day. Falls back to random links when the day is quiet.',
        audience: 'guest',
      },
      {
        id: 'random',
        label: 'Random',
        href: '/random',
        hint: 'Internet Roulette — auto-plays random links.',
        about:
          'Hit play and get a random link every 10 seconds. Good for discovering something you would never have searched for.',
        audience: 'guest',
      },
      {
        id: 'websites',
        label: 'Amazing Websites',
        href: '/websites',
        hint: 'A curated feed of notable websites.',
        about:
          'The same filters as Explore, scoped to the "Website" topic — hand-picked sites instead of every link.',
        audience: 'guest',
      },
    ],
  },
  {
    label: 'Discover',
    items: [
      {
        id: 'users',
        label: 'Users',
        href: '/users',
        hint: 'Directory of everyone on LnkZoo.',
        about:
          'A searchable grid of every member. Open a profile to follow them, see their stats and browse the links they shared.',
        audience: 'guest',
      },
      {
        id: 'leaderboard',
        label: 'Leaderboard',
        href: '/leaderboard',
        hint: 'Top sharers by likes this week, month or all time.',
        about:
          'Ranks members by the likes their links collected over the last week, month or all time, and shows your own position.',
        audience: 'guest',
      },
      {
        id: 'tags',
        label: 'Tags',
        href: '/tags',
        hint: 'Every tag in use — open one to see its links.',
        about:
          'Free-form tags across the whole platform, with usage counts. A tag page lists every link carrying it.',
        audience: 'guest',
      },
      {
        id: 'topics',
        label: 'Topics',
        href: '/topics',
        hint: 'The curated topic taxonomy.',
        about:
          'Around 60 curated topics, grouped into topic-types. Every link must pick one; a topic page filters the feed to it.',
        audience: 'guest',
      },
      {
        id: 'categories',
        label: 'Categories',
        href: '/categories',
        hint: 'Browse links grouped by source domain.',
        about:
          'Domain-based grouping — YouTube, GitHub, news sites and so on. Pick a domain to see every link pointing at it.',
        audience: 'guest',
      },
      {
        id: 'tools',
        label: 'Tools',
        href: '/tools',
        hint: 'Short links, file transfer, text share and QR codes.',
        about:
          'The developer tools, free and fully public: URL Shortener (24h), Low Weight File Transfer and Text Share (5 min / 1 hour / 24 hours), each with a QR code. Rate-limited per IP.',
        audience: 'guest',
      },
      {
        id: 'guest-pool',
        label: 'Guest Pool',
        href: '/guest-pool',
        hint: 'Tool links guests created, until they expire.',
        about:
          'A public, read-only pool of tool output made without an account — short links, files and texts, each with its own countdown. No destroy button: guest rows can only expire, and signed-in output never lands here.',
        audience: 'guest',
        guestNote: 'Built for guests, open to everyone. No account needed either way.',
      },
      {
        id: 'manual',
        label: 'Manual',
        href: '/manual',
        hint: 'This page — what every route does and who can open it.',
        about:
          'The manual: every sidebar route explained side by side for logged-out visitors and signed-in members, so you know where things live before hunting for them.',
        audience: 'guest',
      },
    ],
  },
];

/** Only rendered (and only reachable) with a session. */
export const USER_SECTIONS: NavSection[] = [
  {
    label: 'Create',
    items: [
      {
        id: 'manage-links',
        label: 'My Links',
        href: '/manage/links',
        hint: 'Manage everything you posted.',
        about:
          'Your personal dashboard: totals and likes/views/clicks, a searchable and sortable table of your links, plus bulk delete, bulk visibility (public / followers / private) and bulk tagging.',
        audience: 'user',
        guestNote: 'Hidden when logged out; the data needs a session.',
      },
      {
        id: 'submit',
        label: 'Post Link',
        href: '/submit',
        hint: 'Share a new link with the community.',
        about:
          'Paste a URL and LnkZoo fetches the title, description, preview image and suggested tags for you to edit. Title, description and a topic are required; you pick the visibility (public / followers / private).',
        audience: 'user',
      },
      {
        id: 'bulk',
        label: 'Bulk Upload',
        href: '/submit/bulk',
        hint: 'Post many URLs at once.',
        about:
          'Drop in a list of URLs and they are parsed in parallel with streamed progress, auto-tagging via AI and a downloadable report. Regular users get 10 per batch, admins unlimited.',
        audience: 'user',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 'bookmarks',
        label: 'Bookmarks',
        href: '/bookmarks',
        hint: 'Links you saved for later.',
        about:
          'Everything you saved with the bookmark button on a link card, separated into your own links and everyone else\'s.',
        audience: 'user',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/notifications',
        hint: 'Likes, comments and follows aimed at you.',
        about:
          'Your notification log with read/unread state. The bell in the topbar previews the latest ones.',
        audience: 'user',
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        hint: 'Your account settings and sign out.',
        about:
          'Account preferences and the sign-out button. Profile details (avatar, cover, bio, website, interests, username) are edited from your own profile instead.',
        audience: 'user',
      },
      {
        id: 'feedback',
        label: 'Feedback',
        href: '/feedback',
        hint: 'Report a bug or send feedback.',
        about:
          'A public report board: a title, a description and an optional screenshot, marked public or private per report. Admins triage statuses; you can delete your own.',
        audience: 'guest',
        guestNote: 'Reads the public board; posting a report needs a sign-in.',
      },
      {
        id: 'profile',
        label: 'Your Profile',
        href: '/profile',
        hint: 'Your public profile page.',
        about:
          'Where your shared links live, along with your header, bio, streak, follower counts and — on your own profile — the Tool Links section listing (and destroying) the short links, files and texts you created while signed in.',
        audience: 'user',
        guestNote: 'Profiles need a session; the sidebar link goes to sign-in instead.',
        sidebar: false,
      },
    ],
  },
];

/** Admin-only, on top of everything above. */
export const ADMIN_SECTIONS: NavSection[] = [
  {
    label: 'Admin',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/admin/dashboard',
        hint: 'Platform analytics and moderation.',
        about:
          'KPIs, growth and engagement charts with a 7D / 30D / 90D / all-time range switcher, plus the flagged-links panel and the feedback triage table.',
        audience: 'admin',
      },
      {
        id: 'admin-users',
        label: 'Users',
        href: '/admin/users',
        hint: 'Manage roles and bans.',
        about:
          'Every account with an inline role selector (user / prouser / admin) and a ban toggle.',
        audience: 'admin',
      },
    ],
  },
];

export const ALL_SECTIONS: NavSection[] = [
  ...PUBLIC_SECTIONS,
  ...USER_SECTIONS,
  ...ADMIN_SECTIONS,
];

/** Sidebar-hoverable routes, in render order. */
export const SIDEBAR_SECTIONS: NavSection[] = ALL_SECTIONS.map((section) => ({
  ...section,
  items: section.items.filter((item) => item.sidebar !== false),
}));

export const AUDIENCE_LABEL: Record<NavAudience, string> = {
  guest: 'Anyone',
  user: 'Signed in',
  admin: 'Admins',
};

/** Which mini-badge the manual shows, keyed by audience + viewer. */
export function accessLabel(audience: NavAudience, signedIn: boolean): string {
  if (audience === 'guest') return 'Open';
  if (!signedIn) return 'Sign-in required';
  return audience === 'admin' ? 'Admins only' : 'Open';
}
