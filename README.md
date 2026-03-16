# Fantasy Label v1

Production-ready baseline for a fake-money music fantasy market game using:
- Next.js 15 + TypeScript + Tailwind
- PostgreSQL + Prisma
- NextAuth
- Optional Redis-compatible background orchestration (not required for local v1)
- PostHog analytics instrumentation

## Product behavior implemented

- Equal starting fake cash for new users (`STARTING_CASH`).
- Single card type per artist.
- AMM quadratic bonding curve: `P(s) = base_price + k*s^2`.
- **Integral** buy/sell execution via curve primitive (no naive spot-price fills).
- Transactional wallet + holdings updates.
- Guards for no negative balance and no overselling.
- Weekly lineup submission requiring exactly 5 owned unique artist cards.
- Lineup lock at Monday 00:00 UTC.
- Weekly scoring (Mon 00:00 UTC through Sun 23:59 UTC) from admin-ingested artist metrics.
- Separate weekly, season (4-week), and portfolio views.
- Idempotent scoring jobs through `ScoringJob` uniqueness and status checks.

## Repo structure

- `app/`: Next.js App Router pages and API routes.
- `lib/`: auth, Prisma, AMM math, services (trading, lineup, week, scoring), analytics.
- `prisma/schema.prisma`: full data model.
- `prisma/seed.ts`: seeds 50 artists + admin user + current week.
- `scripts/score-week.ts`: scoring worker entrypoint.
- `tests/`: pricing, wallet, lineup lock, scoring idempotency tests.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env:
   ```bash
   cp .env.example .env
   ```
3. Run DB migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Seed sample data:
   ```bash
   npx prisma db seed
   ```
5. Start app:
   ```bash
   npm run dev
   ```

## Environment variables

- `DATABASE_URL`: Postgres connection string.
- `NEXTAUTH_SECRET`: session signing secret.
- `NEXTAUTH_URL`: app URL.
- `STARTING_CASH`: fake cash grant for new users.
- `ADMIN_EMAIL`: admin gate for import endpoints.
- `NEXT_PUBLIC_POSTHOG_KEY`: optional PostHog key.
- `NEXT_PUBLIC_POSTHOG_HOST`: optional PostHog host.

## Key API endpoints

- `GET /api/artists`
- `POST /api/market/trade` with `{ artistId, side, quantity, idempotencyKey? }`
- `GET /api/portfolio`
- `POST /api/lineups` with `{ artistIds: string[5] }`
- `GET /api/leaderboards/weekly`
- `GET /api/leaderboards/season`
- `POST /api/admin/artists/import` (admin)
- `POST /api/admin/metrics/import` (admin)

## Scoring worker

Run scoring for a week id:
```bash
npx tsx scripts/score-week.ts week-2026-01-05
```

## Phase mapping

- **Phase 1**: project setup, auth wiring, schema, seeds.
- **Phase 2**: AMM trading + portfolio endpoints.
- **Phase 3**: lineup lock and scoring pipeline.
- **Phase 4**: frontend pages + admin import surface.
- **Phase 5**: tests and deployment-ready config baseline.

## Deployment notes

- Deploy on Vercel/Node runtime with managed Postgres.
- Run Prisma migrations during release.
- Schedule scoring worker via cron/queue.
- Use UTC exclusively for all scheduling and computations.
