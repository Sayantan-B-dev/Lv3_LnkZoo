# LnkZoo — Docs Index

| File | What it is |
|---|---|
| `README.md` | Project overview, tech stack, local setup |
| `AGENT.md` | Agent guidelines: coding rules, security checklist, structure |
| `STYLE.md` | CSS architecture, token map, class conventions |
| `DESIGN.md` | Route/component/data-layer map ("where's what") |
| `policies.md` | Access & security policy matrix: page/route/row layers, abuse limits, SSRF guard |
| `vercel-deploy.md` | Oct 2026 deploy incident: 4 stacked Vercel failures, rules + checklist |
| `all_current_features.md` | Full feature list + changelog |
| `all_features.md` | Every feature by date, from the full git history (2026-04-29 → today) |
| `tools.md` | Developer Tools page: URL Shortener, Low Weight File Transfer, Text Share |
| `next_tools.md` | Backlog of candidate `/tools` additions + the SSRF guard any URL-fetching tool needs |
| `userdashboard.md` | User dashboard (`/manage/links`) notes |
| `feedback.md` | Public report board (`/feedback`): access + visibility policy, limits, statuses, Cloudinary screenshots |
| `possible_*_engineering_features.md` | Feature idea backlogs (small / medium / over) |
| `db/` | Manual DB queries per feature |
| `db/temp-file-transfer.md` | `temp_files` + `temp_file_limits` DDL & usage |
| `db/text-share.md` | `shared_texts` + `shared_text_limits` DDL & usage |

Also see `../database/` for the core migration SQL files (`init.sql`, `migrate_*.sql`).
