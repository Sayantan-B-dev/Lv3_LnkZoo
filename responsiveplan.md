# Responsive Plan — Glinqx

## 1. Architecture Overview (Current State)

### CSS File Tree (56 files, pure CSS, no modules/SCSS)
```
styles/
├── globals.css              ← single entry point, imports everything
├── core/ (variables.css, reset.css, typography.css, utilities.css, animations.css)
├── layout/ (layout.css, main.css, content.css, sidebar.css, topbar.css, tabs.css, responsive.css)
├── ui/ (animated-bg.css, custom-cursor.css, link-card.css, popup.css, comments.css, slider.css, loading-globe.css, toast.css, sort.css)
├── pages/ (home.css → imports 13 sub-css, explore.css, profile.css, login.css, register.css, submit.css, tags.css, leaderboard.css, users.css, tools.css, daily-dose.css, link-detail.css, random.css, not-found.css, submit-bulk.css, admin.css)
└── components/common.css (sidebar config panel, loading spinner, error message)
```

### Key CSS Variables (from `variables.css`)
```
--sidebar-w: 220px    ← collapsed: 56px
--header-h: 52px
--radius: 6px
--t: .18s ease        ← standard transition
```

### Layout DOM
```
body
└── #app [flex container]
    ├── #sidebar [width: var(--sidebar-w), sticky top 0, 100vh, flex-shrink:0]
    │   ├── .sidebar-logo (logo-mark + logo-text + collapse-toggle-top)
    │   ├── .sidebar-nav (nav-sections → nav-items with icons+text)
    │   ├── .sidebar-config (background settings panel)
    │   └── .sidebar-bottom (user avatar + name + streak)
    └── #main [flex:1, flex-col]
        ├── #topbar [sticky top:0, h:52px, has #mobile-toggle + title + theme-btn + post-btn]
        └── #content [flex:1, max-width:90%, margin:0 auto, padding:20px]
```

### Current Responsive (`layout/responsive.css`)
- **@media (max-width:768px)**: sidebar → `position:fixed; left:0; top:0; transform:translateX(-100%)`; `.mobile-open` → `translateX(0)`; `#mobile-toggle` shown
- **Overlay**: `#mobile-overlay` fixed, z-index 199, shown/hidden via `.show`
- **Homepage breakpoints**: 768px (hero→column, grids→1fr, etc.) and 480px (metrics→1fr, footer→1fr)

### Gap Analysis
| Area | Current State | What's Missing |
|------|---------------|----------------|
| **Mobile sidebar** | Static off-canvas slide | Needs full-page overlay menu, animated blanket effect |
| **Topbar (mobile)** | Has toggle button, no burger icon, no logo | Needs "bloating" logo left, animated burger right |
| **State management** | Sidebar uses local `useState(false)`, Topbar toggle has no handler | Need shared context or local state link + mobile open/close logic |
| **Page-level responsive** | Only `users.css`, `toast.css`, homepage have mobile queries | Every page grid/table/component needs mobile sizing |
| **Admin layout** | Separate sidebar, no mobile handling | Needs full mobile pass |
| **Content padding** | `#content { padding: 20px; max-width: 90% }` | Too wide on mobile, needs narrower padding |
| **Forms** | Fixed widths, horizontal gaps, side-by-side layouts | Need full-width stacking on mobile |
| **Tables** | No overflow handling on mobile | Need horizontal scroll or card layout |
| **Animations** | `transform: translateX(-100%)` for sidebar | Need different animation: page-overlay blanket effect |
| **Link cards** | Side-by-side vote col + body + preview | Need to stack or reflow on narrow screens |

---

## 2. Responsive Plan — Step by Step

### Phase A: Mobile Menu Infrastructure (replace current sidebar behavior)

#### A1. Create `styles/layout/mobile-menu.css`
New file. Purpose: all styles for the mobile hamburger menu + overlay page effect.

```css
/* ── MOBILE LAYOUT OVERRIDES ──────────────────── */
/* Show mobile elements, hide desktop elements */
.mobile-only { display: none; }
.desktop-only { display: block; }

@media (max-width: 768px) {
  .mobile-only { display: flex; }
  .desktop-only { display: none; }
  
  /* Sidebar becomes full-page overlay (the "blanket") */
  #sidebar {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 200;
    transform: translateY(-100%);
    opacity: 0;
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                opacity 0.3s ease;
    border-right: none;
    backdrop-filter: blur(20px);
    background: color-mix(in srgb, var(--bg-1) 92%, transparent);
  }
  
  #sidebar.mobile-open {
    transform: translateY(0);
    opacity: 1;
  }

  /* Remove collapsed behavior on mobile */
  #sidebar.collapsed {
    width: 100%;
  }

  #sidebar.collapsed .logo-text,
  #sidebar.collapsed .nav-text,
  #sidebar.collapsed .nav-label,
  #sidebar.collapsed .user-info,
  #sidebar.collapsed .nav-badge {
    opacity: 1;
    width: auto;
    overflow: visible;
  }

  /* Sidebar nav items centered/comfortable for touch */
  .sidebar-nav {
    padding: 12px 0;
  }

  .nav-item {
    padding: 12px 24px;
    font-size: 14px;
    gap: 14px;
  }

  .nav-icon { width: 20px; height: 20px; }

  .nav-label {
    padding: 14px 24px 6px;
    font-size: 10px;
  }

  .sidebar-logo {
    padding: 0 20px;
    height: var(--header-h);
  }

  .collapse-toggle-top {
    display: none;  /* hide collapse on mobile */
  }

  /* Hide sidebar config on mobile (or collapse it) */
  .sidebar-config { display: none; }

  /* Overlay backdrop */
  #mobile-overlay {
    position: fixed;
    inset: 0;
    z-index: 199;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  #mobile-overlay.show {
    opacity: 1;
    pointer-events: all;
  }

  /* Content adjustments */
  #main { margin-left: 0; }
  #content { 
    padding: 14px;
    max-width: 100%;
  }
}

/* ── ANIMATED BURGER ICON ─────────────────────── */
.burger-btn {
  width: 36px;
  height: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  border-radius: var(--radius);
  transition: background var(--t);
  border: none;
  background: none;
  padding: 0;
}

.burger-btn:hover { background: var(--bg-2); }

.burger-line {
  width: 18px;
  height: 2px;
  background: var(--text-3);
  border-radius: 1px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.2s ease;
  transform-origin: center;
}

.burger-btn.open .burger-line:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.burger-btn.open .burger-line:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.burger-btn.open .burger-line:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* ── BLOATING LOGO (mobile topbar left) ───────── */
.mobile-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--text);
  text-decoration: none;
  padding: 0 4px;
}

.mobile-logo .logo-mark {
  width: 28px;
  height: 28px;
  font-size: 13px;
}

/* ── ENSURE TOPBAR IS FIXED ON MOBILE ────────── */
@media (max-width: 768px) {
  #topbar {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 0 12px;
    gap: 8px;
  }

  #topbar .topbar-title { font-size: 12px; }
  #topbar .post-btn { 
    padding: 5px 10px; 
    font-size: 10px;
    gap: 4px;
  }
  #topbar .post-btn svg { width: 10px; height: 10px; }

  .topbar-right { gap: 4px; }
}
```

#### A2. Register in `globals.css`
Add `@import './layout/mobile-menu.css';` after `responsive.css`.

#### A3. Modify `components/common/Topbar.tsx`
Current toggle is a dummy button doing nothing. Changes:
- Accept an `onMenuToggle` prop (or use a shared state)
- Replace `#mobile-toggle` with `.burger-btn` (animated hamburger)
- Add `.mobile-logo` with logo-mark + "glinqx" text to the left of the topbar
- Pass `isOpen` state so burger animates

New Topbar structure (mobile view):
```
[.mobile-logo → logo-mark + "glinqx"]  [.topbar-title]  [.topbar-right → theme-btn, post-btn, .burger-btn(lines)]
```

#### A4. Modify `components/common/Sidebar.tsx`
- Accept `isOpen` and `onClose` props (or use context)
- Add `onClose` handler to all `nav-item` Link clicks (to close menu on navigation)
- Add close button at top of mobile sidebar (optional, overlay click also closes)

#### A5. Modify `app/(main)/layout.tsx`
Wrap to manage mobile menu state and wire it together:
```tsx
'use client';
import { useState } from 'react';
// ...
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// Pass to Topbar: onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
// Pass to Sidebar: isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
// Add: {mobileMenuOpen && <div id="mobile-overlay" className="show" onClick={() => setMobileMenuOpen(false)} />}
```

Sidebar gets: `className={collapsed ? 'collapsed' : ''}${mobileMenuOpen ? ' mobile-open' : ''}`

---

### Phase B: Page-Level Responsive Styles

For every page CSS file, add `@media (max-width: 768px)` and/or `@media (max-width: 480px)` blocks. Rules to follow:

#### B1. `styles/layout/content.css`
At `768px`: `#content { padding: 12px; max-width: 100%; }`
At `480px`: `#content { padding: 10px; }`

#### B2. `styles/pages/explore.css`
At `768px`:
- `.search-bar { flex-direction: column; padding: 10px 14px; }` (if it has side-by-side layout)
- `.tag-cloud { gap: 6px; }`
- `.tag-item { padding: 6px 12px; font-size: 12px; }`
- Section layouts stack

#### B3. `styles/pages/profile.css`
At `768px`:
- `.profile-header { padding: 20px; margin: 10px; }`
- `.profile-top { flex-direction: column; gap: 16px; align-items: center; text-align: center; }`
- `.avatar.large { width: 72px; height: 72px; font-size: 24px; }`
- `.profile-name { font-size: 20px; }`
- `.profile-stats { justify-content: center; flex-wrap: wrap; gap: 16px; }`
- `.profile-bio { max-width: 100%; }`
- `.edit-form { max-width: 100%; }`
- `.profile-feed { padding: 20px; }`

#### B4. `styles/pages/login.css` + `styles/pages/register.css`
At `480px`:
- `.auth-card { padding: 24px 20px; }`
- Already reasonably responsive (max-width: 400px, padding: 20px body), just ensure:
- `.auth-header h1 { font-size: 18px; }`
- Input padding reduced slightly

#### B5. `styles/pages/submit.css`
At `768px`:
- `.submit-card { margin: 20px 0; padding: 20px; max-width: 100%; }`
- `.input-group { flex-direction: column; }`
- `.form-actions { flex-direction: column; gap: 8px; }`
- `.final-btn { width: 100%; }`

#### B6. `styles/pages/tags.css`
At `768px`:
- `.tag-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }`
- `.tag-large { padding: 14px; }`

#### B7. `styles/pages/leaderboard.css`
At `768px`:
- `.leaderboard-header { display: none; }` (hide headers on mobile)
- `.leaderboard-row { grid-template-columns: 40px 1fr 60px; padding: 10px 12px; gap: 8px; }` (hide likes column or stack)
- At `480px`: `.leaderboard-row { grid-template-columns: 30px 1fr; }` — hide likes/streak, show only rank + user

#### B8. `styles/pages/tools.css`
At `768px`:
- `.tool-grid { grid-template-columns: 1fr; gap: 16px; }`
- `.tool-form { flex-direction: column; gap: 8px; }`
- `.tool-btn { padding: 10px; width: 100%; }`
- `.result-box { flex-direction: column; gap: 8px; align-items: stretch; }`
- `.short-copy-btn { width: 100%; justify-content: center; }`

#### B9. `styles/pages/daily-dose.css`
At `768px`:
- `.dose-title { font-size: 22px; }`
- `.dose-card { flex-direction: column; gap: 8px; }`
- `.dose-number { font-size: 24px; padding-top: 0; }`

#### B10. `styles/pages/link-detail.css`
At `768px`:
- `.link-card.detail { padding: 20px; flex-direction: column; }`
- Action buttons: `.visit-btn, .edit-link-btn, .like-btn { width: 100%; justify-content: center; }`
- Button row should wrap

#### B11. `styles/pages/random.css`
At `768px`:
- `.action-btn { width: 100%; min-width: 0; }`
- `.visit-btn { width: 100%; text-align: center; }`

#### B12. `styles/pages/users.css`
Already has responsive block at 600px. Extend:
At `480px`:
- `.users-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }`
- `.user-card { padding: 16px 12px; }`

#### B13. `styles/pages/submit-bulk.css`
At `768px`:
- `.bulk-card { padding: 20px; max-width: 100%; margin: 0; }`
- `.bulk-header { flex-direction: column; }`
- `.bulk-footer { flex-direction: column; gap: 12px; }`
- `.bulk-start-btn { width: 100%; justify-content: center; }`
- `.bulk-actions { flex-direction: column; }`
- `.bulk-back-btn, .bulk-home-btn { width: 100%; text-align: center; }`
- `.bulk-summary { flex-direction: column; align-items: flex-start; gap: 12px; }`

At `480px`:
- `.bulk-textarea { min-height: 120px; font-size: 12px; }`

#### B14. `styles/pages/admin.css`
At `768px`:
- `.admin-root { flex-direction: column; }`
- `.admin-sidebar { width: 100%; height: auto; position: relative; flex-direction: row; overflow-x: auto; padding: 10px 12px; }`
- `.admin-logo { border-bottom: none; padding: 0 12px 0 0; margin-bottom: 0; flex-shrink: 0; }`
- `.admin-nav { flex-direction: row; gap: 4px; padding: 0; overflow-x: auto; }`
- `.admin-nav-item { white-space: nowrap; padding: 8px 12px; font-size: 12px; }`
- `.admin-sidebar-footer { display: none; }` (or collapse)
- `.admin-main { padding: 20px 16px; }`
- `.adm-metrics { grid-template-columns: repeat(2, 1fr); gap: 12px; }`
- `.adm-grid { grid-template-columns: 1fr; gap: 16px; }`
- `.adm-metric-sparklines { grid-template-columns: 1fr; }`
- Table: wrap in `overflow-x: auto` (already in bulk table via `.bulk-results-table-wrap` pattern)

At `480px`:
- `.adm-metrics { grid-template-columns: 1fr; }`
- `.adm-page-header { flex-direction: column; gap: 12px; }`
- `.adm-table { font-size: 12px; }`
- `.adm-table th, .adm-table td { padding: 8px 10px; }`

#### B15. `styles/ui/link-card.css`
At `768px`:
- `.link-card { flex-direction: column; gap: 10px; padding: 12px; }`
- `.vote-col { flex-direction: row; gap: 8px; padding-top: 0; }`
- `.card-preview { width: 100%; height: auto; aspect-ratio: 16/9; }`
- `.card-preview.right { width: 100%; height: auto; }`
- `.card-footer { flex-wrap: wrap; gap: 8px; }`

At `480px`:
- `.link-card { padding: 10px; }`
- `.card-title { font-size: 12px; }`
- `.card-desc { font-size: 10px; }`
- `.card-meta { gap: 6px; }`
- `.short-url-result { flex-direction: column; align-items: stretch; gap: 8px; }`
- `.short-copy-btn { width: 100%; justify-content: center; }`

#### B16. `styles/ui/popup.css`
At `768px`:
- `.popup-shell { width: 96vw; max-height: 92vh; }`
- `.popup-body { padding: 14px; }`
- `.confirm-box { padding: 20px; }`

At `480px`:
- `.popup-shell { width: 100vw; max-height: 100vh; border-radius: 0; }`
- `.popup-nav { padding: 10px 12px; }`

#### B17. `styles/ui/comments.css`
At `768px`:
- `.comment-form { margin-bottom: 20px; }`
- `.comment-input { font-size: 13px; padding: 12px; min-height: 80px; }`
- `.comment-item { padding-left: 10px; }`
- `.comment-content { font-size: 13px; }`

#### B18. `styles/ui/slider.css`
At `768px`:
- `.slider-item { flex: 0 0 80%; }`  (show partial next item for swipe affordance)
- `.slider-track { gap: 8px; }`

#### B19. `styles/ui/toast.css`
Already has responsive at 480px. Update:
At `768px`:
- `.toast { max-width: 100%; min-width: 0; }`
- `.toast-container { left: 12px; right: 12px; transform: none; }`

#### B20. `styles/ui/sort.css`
At `768px`:
- `.sort-dropdown-menu { right: auto; left: 0; }` (if trigger is right-aligned, keep as-is)

#### B21. Homepage Components (`styles/pages/home-component-css/`)
Already has `responsive.css` with 768px and 480px breakpoints. Review and augment:
- `.hero-section { padding: 60px 16px 40px; }` at 768px
- `.hero-headline { font-size: clamp(1.6rem, 7vw, 2.2rem); }` at 480px
- `.hero-inner { width: 100%; }` at 768px
- `.hero-stat-card { min-width: 80px; padding: 10px 14px; }` at 480px
- `.hero-stat-value { font-size: 18px; }` at 480px
- `.about-ghost { font-size: 48px; }` at 480px
- `.faq-layout { gap: 20px; }` at 768px
- `.metrics-section { gap: 10px; }` at 480px
- `.feed-container { padding: 16px; }` at 480px
- `.cta-section { padding: 24px 16px; }` at 480px
- Section padding/margins reduced by ~25%

---

### Phase C: Modify Existing Files

#### C1. `styles/layout/responsive.css` — Replace entirely
The old responsive CSS should be replaced/delegated to `mobile-menu.css`. Keep only:
```css
/* Legacy - mobile menu logic moved to mobile-menu.css */
/* This file now only contains the mobile toggle baseline */
#mobile-toggle {
  display: none; /* overridden by .burger-btn in mobile-menu.css */
}
```

#### C2. `styles/globals.css` — Add import
Insert after `@import './layout/responsive.css';`:
```css
@import './layout/mobile-menu.css';
```

#### C3. `components/common/Topbar.tsx` — Major rewrite
Accept props: `onMenuToggle?: () => void; menuOpen?: boolean;`
Replace `#mobile-toggle` static button with animated `.burger-btn`
Add `.mobile-logo` (shown only on mobile via CSS)
Remove unused imports, keep existing functionality intact.

#### C4. `components/common/Sidebar.tsx` — Add mobile close behavior
Accept props: `isOpen?: boolean; onClose?: () => void;`
On mobile, clicking any nav-item Link should call `onClose()`
Remove the `position: sticky` inline style (it interferes with mobile fullscreen)
Keep all existing desktop behavior 100% intact.

#### C5. `app/(main)/layout.tsx` — Wire mobile menu state
Convert to `'use client'` (entire layout becomes client component since we need useState).
```tsx
'use client';
import { useState, useCallback } from 'react';
import Sidebar from '@/components/common/Sidebar';
import CustomCursor from '@/components/common/CustomCursor';
import Topbar from '@/components/common/Topbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div id="app">
      <CustomCursor />
      <Sidebar isOpen={mobileOpen} onClose={closeMobile} />
      <main id="main">
        <Topbar onMenuToggle={() => setMobileOpen(v => !v)} menuOpen={mobileOpen} />
        <div id="content">
          {children}
        </div>
      </main>
      {mobileOpen && (
        <div id="mobile-overlay" className="show" onClick={closeMobile} />
      )}
    </div>
  );
}
```

Note: This makes `(main)/layout.tsx` a client component. If this causes issues (e.g., metadata), restructure so that `(main)/layout.tsx` is a wrapper server component that renders a client sub-layout. But given Next.js App Router, this is fine — `(main)/layout.tsx` doesn't export metadata and doesn't need to be a server component.

#### C6. Ensure all existing pages receive proper `#content` wrapper
Check if any page bypasses the `#content` div in `(main)/layout.tsx`. Currently it seems `{children}` is rendered directly under `#main`. The `#content` div needs to wrap children:

Current `app/(main)/layout.tsx`:
```tsx
<main id="main">
  {children}
</main>
```

This means children are rendered directly in `#main`, NOT inside `#content`. The `#content` div is NOT being used in the actual layout. Check the pages — they probably either don't use `#content` at all, or the page components themselves include `#content`.

Looking at CSS: `#content` exists in content.css but may not be in the DOM. Let's NOT change this — adding an extra wrapper div might break existing page layouts. Instead, we can either:
a. Add `#content` wrapper in `(main)/layout.tsx` (risky — pages may have their own padding)
b. Leave as-is and apply responsive padding to `#main` directly on mobile

**Decision**: Add `#content` wrapper in the layout AND verify no page has its own conflicting padding. If any page provides its own `#content`, that page needs adjustment. Safer approach: **add `#content` to `(main)/layout.tsx`** and ensure all pages inside `(main)` are children of it. If any page defines its own `#content`, rename that page's wrapper.

Actually looking more carefully at the Topbar component — it's rendered inside `#main` BEFORE children. The `#content` CSS has `flex:1, padding:20px, max-width:90%, margin:0 auto`. The actual layout renders children directly under `#main`. So `#content` is an orphan rule in CSS — not used.

**Revised decision**: Wrap children in `#content` inside `(main)/layout.tsx`:
```tsx
<main id="main">
  <Topbar ... />
  <div id="content">
    {children}
  </div>
</main>
```

This gives us consistent padding, max-width constraint, and a single point to adjust responsive padding. Check each page to ensure they don't have conflicting top-level padding.

#### C7. Sidebar close on navigation
In `Sidebar.tsx`, for each `Link` with href, add `onClick={onClose}` (on mobile only, or always — harmless on desktop since the function will be undefined).

---

### Phase D: Testing & Verification

1. **Desktop (≥1024px)**: No visual changes. Sidebar, topbar, content all behave exactly as before.
2. **Tablet (768–1024px)**: Sidebar becomes full-page overlay, burger visible, logo visible.
3. **Mobile (480–768px)**: Same as tablet + tighter padding, smaller fonts.
4. **Small mobile (<480px)**: Maximum compression, single-column everything, touch-friendly targets (min 44px).
5. **Admin layout**: Separate mobile pass — horizontal scrolling sidebar on tablet, hamburger on phone.

### Touch Target Checklist
- All nav items: min 44px height on mobile
- All buttons: min 44x44px tap target
- Burger button: 36x36px (within spec)
- Form inputs: min 44px height
- Close/overlay tap: full screen

---

## 3. Files to Create
1. `styles/layout/mobile-menu.css` — new, ~250 lines

## 4. Files to Modify
| File | Change |
|------|--------|
| `styles/globals.css` | Add `@import './layout/mobile-menu.css'` |
| `styles/layout/responsive.css` | Remove/reduce, delegate to mobile-menu.css |
| `styles/layout/content.css` | Add mobile padding overrides |
| `styles/layout/sidebar.css` | Add mobile fullscreen variant |
| `styles/layout/topbar.css` | Add mobile logo + burger styles |
| `components/common/Topbar.tsx` | Add props, animated burger, mobile logo |
| `components/common/Sidebar.tsx` | Add isOpen/onClose props, nav close handler |
| `app/(main)/layout.tsx` | Wire state, add overlay, add #content wrapper |
| `styles/pages/explore.css` | Mobile responsive |
| `styles/pages/profile.css` | Mobile responsive |
| `styles/pages/submit.css` | Mobile responsive |
| `styles/pages/tags.css` | Mobile responsive |
| `styles/pages/leaderboard.css` | Mobile responsive |
| `styles/pages/tools.css` | Mobile responsive |
| `styles/pages/daily-dose.css` | Mobile responsive |
| `styles/pages/link-detail.css` | Mobile responsive |
| `styles/pages/random.css` | Mobile responsive |
| `styles/pages/users.css` | Mobile responsive (extend existing) |
| `styles/pages/submit-bulk.css` | Mobile responsive |
| `styles/pages/admin.css` | Mobile responsive |
| `styles/pages/home-component-css/responsive.css` | Augment with tighter mobile |
| `styles/ui/link-card.css` | Mobile responsive |
| `styles/ui/popup.css` | Mobile responsive |
| `styles/ui/comments.css` | Mobile responsive |
| `styles/ui/toast.css` | Mobile responsive (extend existing) |
| `styles/ui/slider.css` | Mobile responsive |

## 5. Key Constraints
- **DO NOT** change any CSS variable values
- **DO NOT** change any existing `--t`, `--radius`, `--sidebar-w`, `--sidebar-c`, `--header-h`
- **DO NOT** alter any existing hover, active, or transition behavior on desktop
- **DO NOT** remove or rename any existing CSS class or ID
- **ALL** existing styles must remain intact for viewport ≥1024px
- Mobile styles use the SAME CSS variables — no new color/token values
- Animation timing: 0.35s cubic-bezier(0.22, 1, 0.36, 1) for the blanket slide — distinct from existing `--t` (.18s) to create the "overtaking page" feel
- Burger animation: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) — springy feel

## 6. Execution Order
```
Phase A (infrastructure) → Phase C (component wiring) → Phase B (page CSS) → Testing
```
Start with `mobile-menu.css`, then `Topbar.tsx`, then `Sidebar.tsx`, then `layout.tsx`, then page CSS files in order of pages visited most.
