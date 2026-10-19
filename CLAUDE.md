# ShebaGhor

Home-service booking app for Dhaka (React + Express + Postgres/Prisma on Neon, SSLCommerz sandbox). A learning/portfolio project: the owner is building it step by step to learn full-stack development and prepare for interviews.

- **Start every session by reading [docs/PROGRESS.md](docs/PROGRESS.md)**: what's done, decisions, next step. Update it when a step is finished.
- The plan and guides live in a separate repo: https://github.com/sajidur70/shebaghor-docs (`ROADMAP.md`, `shebaghor-7-day-guide/DAY-1 … DAY-7`, `DESIGN.md`, `database/PRISMA_SCHEMA.md`). Follow them; don't invent a different architecture.
- The owner is a beginner. Explain the "why" in plain words with ShebaGhor examples, and leave the "in your own words" exercises for them unless they ask.
- Never put secrets (database URLs, JWT secret, SSLCommerz keys) in committed files or in PROGRESS.md. They belong in `server/.env` (git-ignored); commit `server/.env.example` with names only.
