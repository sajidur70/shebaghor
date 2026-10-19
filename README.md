# ShebaGhor

Book trusted home-service professionals in Dhaka (electricians, plumbers, AC technicians, tutors) for a real free time slot, pay online, and review the job afterwards.

> 🚧 **Work in progress.** Built step by step; the live link, demo logins and screenshots will be added when it's deployed.

## Features (planned for v1)

**Customers**
- Search services by keyword, category and area
- See only the time slots a provider is actually free
- Book, pay online (SSLCommerz sandbox) and cancel
- Rate and review completed jobs

**Providers**
- Register and wait for admin approval
- Manage their own services and weekly working hours
- See their bookings and mark jobs complete

**Admins**
- Approve or reject providers
- Manage service categories
- See platform stats (users, bookings, revenue, refunds)

## Highlights

- **No double-booking**, even when two customers click "Book" at the same moment (row locking inside a Postgres transaction)
- **15-minute payment hold** on a slot, with no background job needed
- **Server-side payment verification**: a booking is confirmed only after the server checks the payment with SSLCommerz
- **Price snapshot**: a booking keeps the price agreed at booking time
- All times handled in **Asia/Dhaka (UTC+6)**

## Tech stack

| Layer | Technology | Hosting (free tier) |
|---|---|---|
| Frontend | React, Tailwind CSS, shadcn/ui | Vercel |
| Backend | Node.js, Express | Render |
| Database | PostgreSQL, Prisma | Neon |
| Payments | SSLCommerz (sandbox) | — |

## Project structure

```text
shebaghor/
├── client/   # React frontend
├── server/   # Express API + Prisma
└── docs/     # Requirements and data model
```

## Docs

- [Requirements (user stories)](docs/requirements.md)
- [Data model](docs/data-model.md)

## Run locally

Coming soon.
