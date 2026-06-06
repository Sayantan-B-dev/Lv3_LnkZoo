# Homepage Redesign — Discovery Engine

## Core Philosophy
Turn the home page from a static feed into an explorable discovery engine.
Every section should feel like a different "room" — distinct layout, texture, and
interaction pattern, held together by a consistent design language.

---

## Section Blueprint

### 1. Hero — Split Layout
- Left: staggered word slide-up headline + subtitle + CTA buttons
- Right: floating stat cards (total users, links shared, likes given) with
  CSS keyframe `float` animation, each at different delay/amplitude
- Background: subtle grid pattern (CSS `background-image: repeating-linear-gradient`)
- Behind hero: animated gradient orb that shifts on scroll

### 2. Marquee Ticker
- Full-width black strip auto-scrolling trending link titles / tag names
- Pure CSS animation (`translateX(-50%)` loop), pauses on hover
- Data fetched from `/api/links?sort=top&limit=20` or similar
- Click any item → navigates to that link

### 3. What Is Linkzoo — Two-Column
- Left: oversized number (`01`) as ghost watermark, then heading + description
- Right: hover-invert stat grid (4 mini-cards: links shared today, active users,
  communities built, upvotes given)
- On hover each mini-card inverts colors (black ↔ white)

### 4. Features — Card Grid
- 3 rows with varying column ratios (1/3+2/3, 2/3+1/3, 1/1/1)
- Each card has an icon, title, short description
- Hover: card background inverts, icon scales
- Examples: Smart Discovery, Rich Previews, Community, Streaks & Gamification,
  Daily Dose, Short URL Tool

### 5. Trending Now — Horizontal Scroll
- Mouse wheel + drag horizontal scroll (CSS `overflow-x: auto` + `scroll-snap-type`)
- 6–8 large link cards as full snap blocks
- Each card shows title, preview image (if any), username, like count
- Fetched from `/api/links/daily-dose` or `/api/links?sort=top&limit=8`
- Inactive cards have a subtle desaturate, active card pops

### 6. Metrics Strip — 4-Column Band
- Animated counter on scroll-enter (IntersectionObserver, counts from 0 → N)
- Stats: total links shared, registered users, likes given, daily active users
- Each stat has a label below, large number in bold display font

### 7. FAQ — Sticky-Header Accordion
- Left side: sticky heading "Got questions?" with ghost `02` watermark
- Right side: vertically scrolling accordion items
- Each item: question button → expand content
- Active item has left accent bar, others are dimmed

### 8. CTA — Full-Bleed Black
- Giant ghost text watermark ("LINKZOO") behind the content
- Center-aligned: tagline + "Join the Community" button
- Subtle grain texture overlay (CSS `filter: contrast(1.2)`)

### 9. Feed — Restyled Container (Existing)
- The existing Post Link / Search / Tabs / Sort / LinkCards wrapped in
  a distinct container with its own visual identity
- Light border, subtle bg-1 background, rounded corners
- Think of it as "the main attraction" — clean, focused, scannable

### 10. Footer — Always at Bottom
- Not fixed, but `html, body { height: 100% }` + `main { min-height: 100vh }`
  ensures footer is always at the bottom even on short pages
- 4-column: Brand + links, Resources, Community, Legal
- Dark background matching the CTA section

---

## Interactions & Animation Palette

| Interaction | Implementation |
|---|---|
| Progress bar | Fixed top bar (0→1 width based on `scrollY / (docHeight - viewHeight)`) |
| Scroll-reveal | IntersectionObserver adds `.revealed` → CSS `opacity: 1` + `translateY(0)` |
| Staggered hero text | Each word in `<span>` with `animation-delay` cascade |
| Floating stat cards | `@keyframes float` — each card gets random `--float-duration` / `--float-distance` |
| Marquee scroll | `animation: marquee 30s linear infinite` with `translateX(-50%)` |
| Hover invert | `mix-blend-mode: difference` or explicit color swap via state |
| Counter animation | `requestAnimationFrame` counting from 0 → target on scroll-enter |
| Accordion | `max-height` transition on content wrapper, rotate chevron |
| Scroll-snap horizontal | `scroll-snap-type: x mandatory` + `scroll-snap-align: start` |
| Inactive dim | Adjacent sibling `opacity: 0.6` on non-active scroll-snap items |

---

## Implementation Order (pragmatic)

1. Hero section + floating stats
2. Marquee ticker
3. What Is Linkzoo + Features grid
4. Metrics counters (IntersectionObserver)
5. FAQ accordion
6. CTA section
7. Restyle existing feed container
8. Sticky footer fix
9. Progress bar + scroll-reveal (applied globally)
10. CSS polish for all sections
11. Build & verify

---

## Future Possibilities (not in current build)

- **Network visualization**: D3.js force-directed graph showing how links
  connect through tags and users — explorable, zoomable
- **Infinite scroll waterfall**: masonry layout that loads next page as you
  scroll past the feed container
- **"Explore by mood"**: color-coded tag clusters that reveal links in a
  full-screen overlay with a carousel
- **Sound on scroll**: subtle ambient tones that shift pitch based on
  vertical position (purely decorative, opt-in)
- **3D tilt cards**: cards that tilt based on mouse position using
  `transform: perspective(800px) rotateX/Y`
- **Time-travel slider**: drag a timeline slider to see "what was trending"
  on any past date
- **AI-curated "Surprise Me"**: one-click random link with a slot-machine
  animation that lands on a link card
