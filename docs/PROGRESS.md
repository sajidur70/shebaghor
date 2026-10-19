# ShebaGhor — Progress log

The story of this project so far: what's done, what was decided and why, and what's next.
Update it at the end of each work session.

## Where things live

| What | Where |
|---|---|
| App code (this repo) | `C:\dev\shebaghor` → https://github.com/sajidur70/shebaghor |
| Guides and design docs | https://github.com/sajidur70/shebaghor-docs (`ROADMAP.md`, `PROJECT_OVERVIEW.md`, `DESIGN.md`, `INTERVIEW_ANSWERS.md`, `database/`, `shebaghor-7-day-guide/DAY-1 … DAY-7`) |
| Requirements (my user stories) | [docs/requirements.md](requirements.md) |
| Data model (8 tables) | [docs/data-model.md](data-model.md) |

To get the guides back locally: `git clone https://github.com/sajidur70/shebaghor-docs.git`

## Accounts and services

| Service | Status | Notes |
|---|---|---|
| Git | ✅ Set up | Name `Sajidur Rahman`, default branch `main` |
| GitHub | ✅ Repo `sajidur70/shebaghor` created and pushed | Public |
| Neon (database) | ✅ Account (login with GitHub), project `shebaghor` created | Only **Postgres database** turned on. Region: **AWS Asia Pacific (Singapore)**, the closest to Dhaka. **Pick Singapore on Render too.** Pooled + direct URLs not yet copied into `server/.env` |
| Render (backend hosting) | ✅ Account + personal workspace | Web service not created yet (that's Day 7 / roadmap 10.1) |
| SSLCommerz (payments) | ⏳ Sandbox registration started | Domain `https://shebaghor.vercel.app`, business name `ShebaGhor`. Store ID + password arrive by email → later go in `server/.env` |

> Secrets (database URLs, store passwords, JWT secret) never go in this file or in git. They live only in `server/.env`.

## Done

### 2026-10-19/20 — Day 1, Steps 0–1
- [x] **0.1** Wrote the user stories → [docs/requirements.md](requirements.md) (customer, provider, admin; each line tagged with its FR/BR/NFR id)
- [x] **0.2** Drew the data model → [docs/data-model.md](data-model.md) (Mermaid diagram + boxes-and-lines drawing + relationship table)
- [x] **1.1** Created `C:\dev\shebaghor` with `server/` and ran `git init`
- [x] **1.2** Added `.gitignore` (`node_modules/`, `.env`, `dist/`, `*.log`, `.DS_Store`)
- [x] Added a starter `README.md` (work-in-progress; live link, screenshots and setup steps come on Day 7)
- [x] **1.3** First commit `edb7005` pushed to GitHub

## Next

- [ ] **Day 1, Step 2:** In Neon → **Connect** → copy the **pooled** URL (host has `-pooler`, add `&pgbouncer=true`) as `DATABASE_URL`, and the **direct** URL as `DIRECT_URL`
- [ ] Day 1, Steps 3–5: Express server, env validation, error handling
- [ ] Then Prisma schema + first migration (see `database/PRISMA_SCHEMA.md` in the docs repo; leave out `Review` until Day 6)

## Decisions and why

| Decision | Why |
|---|---|
| PostgreSQL only (no MongoDB) | Data is relational; a review and the provider's rating update must happen in one transaction |
| Neon: only Postgres, no Neon Auth / storage / functions | I build my own JWT login (Day 2), it's part of the learning; images use Cloudinary later if at all |
| Skipped Neon's "Agent" / "CLI" quickstart | Only the two connection URLs are needed; doing setup by hand is the point |
| Same region for Neon and Render | API ↔ database calls stay fast |
| `Booking.price` is a snapshot | Later price changes must not rewrite what the customer agreed to and paid (BR-5) |
| `ProviderProfile` separate from `User` | Provider-only fields (area, bio, approved, rating) don't belong on every customer row |
| Ignore `node_modules`, `.env`, `dist` | Reinstallable with `npm install`; `.env` holds secrets; `dist` is build output. Commit `.env.example` instead |

## Things I learned (interview notes)

- **Price snapshot:** a booking is a record of a past deal, like a shop receipt; it must not change when the price changes.
- **One-to-one table split:** shared login data in `User`, role-specific data in `ProviderProfile` linked by a unique `userId`.
- **Connection pooling:** Neon gives a pooled URL (PgBouncer) for the app and a direct URL for Prisma migrations.
- **Leaked secrets:** if `.env` is ever pushed, deleting it isn't enough (it stays in history), so rotate the keys immediately.
