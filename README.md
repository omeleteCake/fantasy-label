# Music Momentum Market (MMM)

A fake-money fantasy market game where players trade artist cards and compete weekly by predicting music popularity momentum.

Players build portfolios of artists, speculate on cultural trends, and submit weekly fantasy lineups. Artist performance in the real world determines fantasy points, while an automated market maker (AMM) provides continuous liquidity for trading.

This project is designed as a **web application** with a market engine, weekly competition system, and leaderboard structure.

---

# Core Concept

Music Momentum Market combines three systems:

1. **Market Game**
   Players trade artist cards using an automated market maker.

2. **Fantasy Competition**
   Players submit weekly lineups of artists that score based on real-world performance.

3. **Cultural Prediction**
   Successful players anticipate which artists will gain momentum before others.

The game rewards early identification of breakout artists and strategic lineup construction.

---

# Game Mechanics

## Market

Each artist is represented by a tradable card.

Players can:

* buy cards
* sell cards
* hold positions
* build portfolios

Trading uses a bonding curve AMM that guarantees liquidity.

Prices change automatically based on supply.

---

## Weekly Fantasy Contest

Each week players submit a lineup of **5 artists**.

Lineups lock at:

```
Monday 00:00 UTC
```

Artists earn points based on real-world performance metrics during the week.

Weekly leaderboard ranks players by lineup score.

---

## Season Structure

Season length:

```
4 weeks
```

At the end of each season:

* season leaderboard resets
* players keep portfolios
* a new season begins

This creates recurring competition while preserving long-term market strategy.

---

# Market Design

The system uses a quadratic bonding curve AMM.

Spot price for an artist:

```
P(s) = base_price + k * s²
```

Where:

* `s` = circulating supply of the artist card
* `base_price` = minimum starting value
* `k` = curve slope constant

Buying increases supply and price.

Selling decreases supply and price.

---

## Buy Cost Formula

Buying `q` units from supply `s`:

```
cost = b*q + (k/3) * ((s + q)³ − s³)
```

---

## Sell Return Formula

Selling `q` units from supply `s`:

```
proceeds = b*q + (k/3) * (s³ − (s − q)³)
```

---

## Fees

To prevent infinite churn:

```
Buy fee: 2%
Sell fee: 2%
```

Fees are removed from circulation as a currency sink.

---

# Fantasy Scoring

Each artist receives a weekly **Artist Performance Score (APS)**.

Example inputs:

| Metric                 | Weight |
| ---------------------- | ------ |
| Weekly views / streams | 50%    |
| Growth rate            | 35%    |
| Engagement growth      | 15%    |

Weekly lineup score:

```
sum(APS for each artist in lineup)
```

Only lineup artists score points.

---

# Product Structure

## Core Systems

The application contains four primary systems:

1. Artist catalog
2. AMM market engine
3. Weekly lineup competition
4. Leaderboards and seasons

---

# Technology Stack

Recommended stack:

Frontend

* Next.js 15
* TypeScript
* Tailwind CSS

Backend

* Next.js API routes or Node service

Database

* PostgreSQL

ORM

* Prisma

Auth

* NextAuth

Caching

* Redis (optional)

Analytics

* PostHog

Deployment

* Vercel

---

# Project Architecture

```
app/
 ├ market
 ├ artists
 ├ portfolio
 ├ lineup
 ├ leaderboard
 └ dashboard

api/
 ├ auth
 ├ market
 ├ artists
 ├ portfolio
 ├ weekly
 ├ leaderboards
 └ admin

workers/
 ├ weekly_scoring
 └ season_rollover

lib/
 ├ amm
 ├ pricing
 ├ scoring
 ├ validation
 └ utils
```

---

# Database Schema

Core tables:

```
users
wallets
artists
holdings
trades
artist_metrics_weekly
weekly_lineups
weekly_lineup_items
weekly_scores
seasons
season_scores
portfolio_snapshots
```

---

# Key Tables

## users

User accounts.

Fields:

```
id
email
username
created_at
```

---

## wallets

User currency balances.

```
id
user_id
cash_balance
created_at
updated_at
```

---

## artists

Artist market data.

```
id
slug
display_name
image_url
base_price
k
circulating_supply
created_at
updated_at
```

---

## holdings

User positions.

```
id
user_id
artist_id
quantity
avg_cost
created_at
updated_at
```

---

## trades

Trade history.

```
id
user_id
artist_id
side
quantity
price
gross_amount
fee_amount
created_at
```

---

## artist_metrics_weekly

Imported performance metrics.

```
id
artist_id
week_start
normalized_views
normalized_growth
normalized_engagement
final_weekly_score
created_at
```

---

# API Endpoints

## Market

```
GET /api/artists
GET /api/artists/:id
POST /api/market/buy
POST /api/market/sell
```

---

## Portfolio

```
GET /api/portfolio
GET /api/wallet
GET /api/portfolio/history
```

---

## Weekly Lineups

```
GET /api/weekly/current
POST /api/weekly/lineup
POST /api/weekly/lineup/lock
```

---

## Leaderboards

```
GET /api/leaderboards/weekly
GET /api/leaderboards/season
GET /api/leaderboards/portfolio
```

---

## Admin

```
POST /api/admin/artists/import
POST /api/admin/metrics/import-week
POST /api/admin/jobs/run-scoring
POST /api/admin/jobs/run-season-rollover
```

---

# Frontend Pages

Authenticated pages:

```
Dashboard
Market
Artist Detail
Portfolio
Lineup Builder
Weekly Leaderboard
Season Leaderboard
Profile
```

Admin pages:

```
Artist Manager
Weekly Metric Import
Scoring Console
Season Manager
```

---

# Weekly Scoring Worker

Scheduled job performs:

1. detect active week
2. lock all open lineups
3. load artist metrics
4. calculate artist scores
5. calculate lineup scores
6. rank players
7. update weekly leaderboard
8. update season totals
9. snapshot portfolio values

All scoring jobs must be **idempotent**.

---

# Security Constraints

The system must enforce:

* no negative balances
* no overselling assets
* transactional state updates
* server-side pricing validation
* lineup lock enforcement
* immutable historical scores

---

# Initial Game Configuration

Recommended v1 parameters:

```
Artists: 50
Starting cash: 100000
Lineup size: 5
Season length: 4 weeks
Buy fee: 2%
Sell fee: 2%
```

---

# Success Metrics

Primary metric:

```
% of active users submitting weekly lineups
```

Secondary metrics:

* average trades per user
* weekly retention
* season completion rate
* portfolio diversity

---

# Development Phases

## Phase 1

Repository setup
Authentication
Database schema
Seed artists

---

## Phase 2

AMM trading engine
Wallet system
Portfolio tracking

---

## Phase 3

Weekly lineup system
Scoring worker
Leaderboards

---

## Phase 4

Frontend UX
Admin tools
Analytics instrumentation

---

## Phase 5

Testing
Deployment configuration
Performance optimization

---

# Testing Requirements

The system must include tests for:

* AMM pricing math
* wallet balance updates
* holdings updates
* buy/sell transaction validation
* lineup locking
* scoring job idempotency

---

# Development Setup

```
git clone repo
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

---


## Seed Idempotency Strategy

`prisma/seed.ts` is intentionally idempotent and can be run repeatedly.

* Users are seeded with deterministic identities:
  * `admin@mmm.local` / `admin`
  * `test01@mmm.local` ... `test10@mmm.local` / `test_user_01` ... `test_user_10`
* User, wallet, artist, and season records use `upsert` with stable unique keys.
* Starting cash grants are normalized by deleting prior `STARTING_GRANT` ledger rows per user and recreating one canonical row.
* Season weeks are recreated (`deleteMany` + create) to guarantee exactly 4 canonical weeks every run.
* Demo `ArtistMetricWeekly` rows for the active week are regenerated (`deleteMany` + create) and can be disabled with `SEED_DEMO_METRICS=false`.

# Environment Variables

Example:

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
REDIS_URL=
POSTHOG_KEY=
ADMIN_EMAIL=
```

---

# Future Features

Not included in v1 but possible later:

* rarity tiers
* card packs
* private leagues
* artist discovery feeds
* trend analytics
* creator partnerships
* mobile app

---

# Project Goal

The long-term goal is to create a **living cultural prediction market** where music fans compete to identify rising artists earlier than everyone else.

Players who best anticipate cultural momentum dominate both the market and fantasy leaderboards.
