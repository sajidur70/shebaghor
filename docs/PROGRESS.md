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

### 2026-10-20 — server setup started
- [x] Ran `npm init` in `server/` and installed `express`, `cors`, `helmet`, `morgan`, `zod`, `dotenv`
- [x] `server/package.json` now matches the guide: `"type": "module"`, Node `>=22`, scripts `dev` / `start` / `build` / `db:seed` / `test`, entry point `src/index.js`
- [x] Installed Prisma **6.19.3** (`@prisma/client` + `-D prisma`) and ran `npx prisma init`
- [x] Switched `prisma init`'s new-style output back to the classic Prisma 6 setup: deleted `prisma.config.ts`, generator `prisma-client-js`, `url` + `directUrl` in `schema.prisma`
- [x] **Day 1, Step 2:** Neon pooled URL (+ `&pgbouncer=true`) as `DATABASE_URL` and direct URL as `DIRECT_URL` in `server/.env`; `server/.env.example` has the names only
- [x] Checked: `npx prisma validate` passes, `npx prisma migrate status` connects to `neondb` in Singapore (empty, no migrations yet: expected)
- [x] VS Code: pinned the Prisma extension to Prisma 6 (`.vscode/settings.json`) so it stops flagging `url` / `directUrl`

### 2026-10-20 — Day 1, Steps 3–5: Express server
- [x] **3.3** Folders: `src/config`, `src/middleware`, `src/routes`, `src/services`, `src/utils`, `test`, `scripts`
- [x] **4.1–4.3** JWT secret generated; `.env.example` has all variable names with fake values; real `.env` has all 10 variables (added by hand, not `Copy-Item`, so the Neon URLs weren't overwritten)
- [x] **4.4** `src/config/env.js` checks the env variables with zod when the server starts
- [x] **5.1–5.4** `httpError.js`, `middleware/error.js`, `app.js`, `index.js`
- [x] **5.5** Checked: `/api/health` → `{"ok":true,...}` with helmet headers and CORS for `http://localhost:5173`; `/api/nope` → 404 `{"error":"Route not found"}`

### 2026-10-20 — Day 1, Step 6: Prisma schema
- [x] **6.2** Typed the full schema in `prisma/schema.prisma`: 3 enums (`Role`, `BookingStatus`, `PaymentStatus`) + 7 models (`User`, `ProviderProfile`, `Category`, `Service`, `Availability`, `Booking`, `Payment`). `Review` left out on purpose (Day 6, second migration)
- [x] `npx prisma format` + `npx prisma validate` pass; checked line by line against the guide (no differences)

### 2026-10-20 — Day 1, Step 7: first migration
- [x] Fixed `P1013: scheme is not recognized`: `DIRECT_URL` in `.env` had an opening `"` but no closing one, so the quote became part of the URL
- [x] **7.1** `npx prisma migrate dev --name init` → `prisma/migrations/20261020043151_init/migration.sql` (3 enum types, 7 tables, 10 indexes, 8 foreign keys); `migrate status` says "Database schema is up to date!"
- [x] **7.2** Saw the tables in `npx prisma studio` and in Neon (Tables page; also `_prisma_migrations`, Prisma's record of applied migrations)
- [x] **7.3** `src/db.js`: one shared `PrismaClient` for the whole app
- [x] **7.4** `src/index.js` runs `await prisma.$connect()` before `app.listen`; checked: prints `✅ Postgres connected` then `🚀 API running`, `/api/health` → 200
- [x] Committed and pushed Steps 6–7: `d30e579`

### 2026-10-20 — Day 1, Step 8: seed demo data
- [x] Installed `bcryptjs` (pure JS, so no native build on Windows); `prisma/seed.js` typed from the guide
- [x] `npm run db:seed` run twice (safe to repeat: it wipes children first). Checked in Neon: 7 users (1 admin, 1 customer, 5 providers), 5 provider profiles (4 approved, `pending@` not), 4 categories, 6 services, 30 availability rows; demo hash starts `$2b$10$` and `password123` matches

### 2026-10-21 — Day 1, Step 9: React app
- [x] **9.1** `client/` created with Vite (React, JS); installed `react-router` (got **v8**) and `axios`
- [x] **9.2** Removed the template's `App.css`, `src/assets`, and `public/icons.svg` (this Vite version makes `icons.svg` instead of `vite.svg`); kept `favicon.svg`
- [x] **9.3–9.4** Tailwind via `@tailwindcss/vite`; `@/` alias in `vite.config.js` + `jsconfig.json`
- [x] **9.5** shadcn/ui (`radix`, `nova`), `"tsx": false`, 12 components in `src/components/ui/`; `--primary` / `--ring` set to teal in `:root`
- [x] **9.6–9.8** `client/.env` (ignored) + `.env.example` (committed) with `VITE_API_URL`; `src/api.js`; temporary health-check `App.jsx`
- [x] Checked: `vite build` passes; `npm run lint` clean

### 2026-10-21 — Day 2, Steps 1–4: auth API
- [x] **1** Installed `jsonwebtoken` and `express-rate-limit`
- [x] **2** `src/middleware/auth.js`: `requireAuth` (401 if no valid token, sets `req.user = { id, role }`) and `requireRole(...roles)` (403)
- [x] **3** `src/routes/auth.js`: `POST /register`, `POST /login` (both rate-limited, 20 per 15 min), `GET /me`; mounted at `/api/auth` in `app.js`
- [x] **4** Tested: login 200 + token; wrong password and unknown email both 401 with the same message; provider without area 400; `role: "ADMIN"` 400; `/me` without token 401, with token 200 (no `passwordHash`), with a changed token 401; `test1@mail.com` registered, stored hash starts `$2b$10$`
- [x] Committed: `bb8e454`

### 2026-10-22 — Day 2, Steps 5–6: frontend auth
- [x] **5.1** `api.js`: request interceptor adds `Authorization: Bearer <token>` from `localStorage`
- [x] **5.2** `src/context/AuthContext.jsx`: `user`, `loading`, `login`, `register`, `logout`; on page load checks a saved token with `/auth/me`
- [x] **6.1–6.8** `constants.js`, `RequireRole.jsx`, `Navbar.jsx`, `Field.jsx`, `Login.jsx`, `Register.jsx`, 6 placeholder pages, router in `App.jsx`
- [x] Checked: `npm run lint` clean, `vite build` passes; browser test OK (log in, stay logged in after F5, `/admin` blocked for a customer, `/bookings` sends a logged-out user to Login and back, log out)

### 2026-10-22 — Day 3, Steps 1–3: categories and services API
- [x] **1.1** `src/utils/provider.js`: `getMyProvider(userId)` finds the logged-in provider's profile from the token (fixed a missing `HttpError` import)
- [x] **1.2** `src/routes/categories.js`: public `GET /`, admin-only `POST /` (makes the slug)
- [x] **2** `src/routes/services.js`: public search (q / category / area, pages), `GET /mine` (above `/:id`), `GET /:id`, provider `POST`, `PATCH` and soft `DELETE` with the ownership check in the `WHERE`; both routers mounted in `app.js`
- [x] **3** Tested all 11: 5 services (pending provider hidden), `q=fan`, `category=tutor`, `area=uttara` (lowercase works), `pageSize=2&page=2` → `totalPages: 3`, `page=0` → 400, `/mine` → Rahim's 2, create 201, customer 403, Rahim editing/deleting Jamal's → 404 (price unchanged), delete own → 204 and gone from search. Also: provider `POST /categories` → 403, unknown id → 404
- [x] Guide note: test #10's body `{"price":1}` gives **400**, not 404, because zod (price ≥ 50) runs before the ownership check. Use a valid price (e.g. 500) to see the 404
- [x] Didn't re-seed after testing: deleted the new "Socket installation" instead of one of Rahim's, so the demo data is unchanged (one inactive row left over)

### 2026-10-22 — Day 3, Steps 4–5: Home page and provider dashboard
- [x] **4.1–4.3** `utils/format.js` (`formatTaka`, South-Asian grouping), `components/Stars.jsx`, `components/ServiceCard.jsx`
- [x] **4.4** `pages/Home.jsx`: search box, area select, category chips, skeletons, empty/error states, pagination; filters live in the URL
- [x] Fixed the guide's `Home.jsx` lint error (`react-hooks/set-state-in-effect`): each answer is saved with the search it belongs to, and `loading` is worked out from that instead of being stored (see Decisions)
- [x] **5** `pages/ProviderDashboard.jsx`: my services list with Remove, add-service form with toast, "waiting for approval" alert
- [x] Checked: `npm run lint` clean, `vite build` passes, code matches the guide
- [x] Committed and pushed

### 2026-10-22 — Day 4, Steps 1–3: time helpers, slot calculator, unit tests
- [x] **1** `src/utils/time.js`: `dhakaToUtc`, `utcToDhaka`, `weekdayOf`, `addMinutes`, `isValidDateStr` (UTC methods only, so laptop and Render agree)
- [x] **2.1** `src/utils/slots.js`: `overlaps` + pure `getFreeSlots` (`now` passed in, no database)
- [x] **2.2** `src/utils/blocking.js`: `blockingBookingWhere` (Prisma `where` fragment) + `isHoldActive`, 15-minute payment hold
- [x] **3** `test/slots.test.js`: `npm test` → pass 11, fail 0
- [ ] "Prove the tests catch bugs" (`aEnd > bStart` → `>=`, see the touching test fail, change back), then commit

## Next

- [x] Commit the server setup: `b52a477`, pushed; `.env` is not tracked (checked with `git ls-files`)
- [x] Steps 3–5 committed and pushed: `d9e5212`
- [ ] Day 1, Step 5.5 last check (if not done yet): rename `JWT_SECRET` → `JWT_SECRETX`, see the ❌ error, rename back
- [x] Day 1, Step 6: Prisma schema (not migrated yet)
- [x] Commit Step 8 (`feat: seed script with demo users, providers and services`): `f16548e`
- [x] Day 1, Step 9: React app (Vite + Tailwind + shadcn/ui) in `client/`
- [x] Confirmed in the browser: server + client running, http://localhost:5173 shows "✅ API is up" in a shadcn card (first try said `Network Error` because the API wasn't running: two terminals needed)
- [x] Step 9 committed and pushed: `8eb84f6`. **Day 1 complete.**
- [x] Day 2, Steps 1–4: auth API (`bb8e454`)
- [ ] Day 2, Step 4 leftovers: register `test1@mail.com` again → 409; wrong password ~21 times → 429 (restart the server after)
- [x] Day 2, Step 5: `api.js` interceptor + `AuthContext.jsx`
- [x] Day 2, Step 6: router, Navbar, Login, Register, RequireRole
- [x] Commit Day 2 Steps 5–6: `ef5f0ee`, pushed
- [x] Day 3, Steps 1–3: categories + services API, tested
- [x] Day 3, Steps 4–5: Home page + provider dashboard (code committed)
- [ ] Day 3 browser checks (Step 4: skeletons, 5 cards, 3→2→1 columns, `?q=fan`, chips, URL in new tab, Back button; Step 5: rahim's 2 services, add → toast + on Home, remove → `active = false` in Prisma Studio, new provider hidden until `approved = true`)
- [ ] Optional: rename the loop's `key` → `name` in `Home.jsx` `updateFilters` (it hides the outer `key`)
- [ ] Day 4: working hours and slots (Steps 1–3 done; next: Step 4, `routes/providers.js`)
- [x] Made `shebaghor-docs` public so Claude can check steps against the guide

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
| ES modules (`"type": "module"`) | The guide's code uses `import` / `export`, the modern standard |
| `node --watch` instead of `nodemon` | Built into Node 22+, so one less package to install |
| Prisma **6**, not the newest | Prisma 7+ moved the database URLs out of `schema.prisma` into a separate config file; the guide's schema uses `url` + `directUrl` in the schema, which is the Prisma 6 way |
| Removed `prisma.config.ts`, used `prisma-client-js` | `prisma init` (6.19) creates a newer TypeScript-style setup; plain JS + the guide's `import { PrismaClient } from "@prisma/client"` need the classic one |
| Pin the VS Code Prisma extension to Prisma 6 | The extension follows Prisma 7+ rules and shows `url` / `directUrl` as errors; the CLI (`prisma validate`) is what my project actually runs |
| Ignore "Update available: `@prisma/client@latest`" | Latest is Prisma 8; upgrading would break the plan's schema setup |
| Keep react-router **8** (guide says v7) | Checked: every name the guide imports (`BrowserRouter`, `Routes`, `Link`, `useNavigate`, …) still exists in v8 |
| No `baseUrl` in `client/jsconfig.json` | TypeScript 6 (inside VS Code) deprecates it; `paths` alone works, and the shadcn CLI still finds `@/` |
| Components import `cn` from the `cn` package | Newer shadcn uses its own `cn` package instead of `clsx` + `tailwind-merge`; `@/lib/utils` re-exports it |
| ESLint ignores `src/components/ui` | shadcn's generated files trip the Vite lint rules (unused `React` import); my own code is still checked |
| Keep Thunder Client 3.0 for API tests | Its sidebar button has two parts: **New Request** makes a normal HTTP request; the ▼ arrow next to it makes SSE / WebSocket / gRPC requests (a tab with a **Connect** button and an empty answer) |
| `loading` starts from `Boolean(localStorage.getItem("token"))`, not `true` | The newer React lint rule forbids calling `setLoading` straight inside `useEffect` (extra re-render); with no token there's nothing to wait for |
| `eslint-disable-next-line` above `useAuth` | Vite fast refresh wants component-only files; keeping the hook next to its context is the normal pattern, so the rule is switched off for that one line |
| `Home.jsx` stores `{ key, result, error }` and works out `loading`, not `setResult(null)` in the effect | Same lint rule as `AuthContext`: changing state straight inside `useEffect` draws the page twice. State only changes in `.then()`; `loading = data.key !== key` |
| `ignore` flag in the `Home.jsx` search effect | Race condition: if "Tutor" then "Plumber" are clicked fast and the Tutor answer arrives last, the cleanup throws it away |
| I run installs and setup commands myself | I'm learning by doing each step by hand; Claude explains and gives the commands |

## Things I learned (interview notes)

- **Price snapshot:** a booking is a record of a past deal, like a shop receipt; it must not change when the price changes.
- **One-to-one table split:** shared login data in `User`, role-specific data in `ProviderProfile` linked by a unique `userId`.
- **Connection pooling:** Neon gives a pooled URL (PgBouncer) for the app and a direct URL for Prisma migrations.
- **`dependencies` vs `devDependencies`:** `@prisma/client` runs inside the live app, so it's a normal dependency; the `prisma` CLI is only used while building (migrations, generate), so it's `-D`.
- **`npm start` vs `npm run dev`:** `dev` restarts on every save (for me while coding); `start` runs once (what Render uses).
- **`url` vs `directUrl`:** the app's many short queries go through the pooler (like a call-centre receptionist sharing a few staff); migrations need one connection from start to finish, so they use the direct URL.
- **"Not managed by Prisma Migrate":** normal on an empty database before the first migration; *baselining* is only for databases that already have tables made without Prisma.
- **`.env` quotes:** a missing closing `"` doesn't cause a "syntax error", it silently becomes part of the value. `prisma validate` doesn't read the URL, so only `migrate` caught it.
- **`Network Error` in the browser:** Axios got no response at all (server not running, wrong URL, or CORS blocked it). If the server answers with an error, you see its `{ error }` message instead.
- **Bearer token:** the login answer's `token` is like a cinema ticket. I show it on later requests as `Authorization: Bearer <token>`; the server checks the signature with `JWT_SECRET`, so a changed token gets 401.
- **401 vs 403:** 401 = "who are you?" (no or bad token); 403 = "I know you, but you're not allowed" (wrong role).
- **React Context:** a notice board every component can read with `useAuth()`, instead of passing `user` down through every level as props.
- **Login is checked by the server, not the browser:** the browser only holds a signed token; `/auth/me` reloads the user from Postgres on every page load.
- **`Could not resolve './pages/Home'`:** an `import` points at a file that doesn't exist yet; Vite can't build anything until every imported file exists.
- **IDOR:** `requireRole("PROVIDER")` only proves "you're a provider", not "this is your service". Putting `providerId: me.id` in the `updateMany` WHERE means Rahim can't touch Jamal's service; he gets 404, which also hides that it exists.
- **Missing import = hidden bug:** JavaScript only fails when the line actually runs, so a missing `HttpError` import only breaks the rare "no profile" path. Every happy-path test still passes.
- **Filters in the URL:** `/?q=fan&category=tutor` means a search can be shared as a link and the Back button works; `useSearchParams` reads and writes it.
- **Race condition in `useEffect`:** two requests can come back in the wrong order; the cleanup function (`return () => { ignore = true }`) marks the old one as out of date.
- **Leaked secrets:** if `.env` is ever pushed, deleting it isn't enough (it stays in history), so rotate the keys immediately.
