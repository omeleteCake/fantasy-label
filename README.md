Build a production-ready v1 web app for a fake-money music fantasy market game.

Tech stack:
- Next.js 15
- TypeScript
- Tailwind
- PostgreSQL
- Prisma
- NextAuth
- Redis optional
- PostHog analytics

Core product rules:
- Users get equal starting fake cash
- Users buy and sell artist cards in a fake-money AMM market
- Each artist has one card type in v1
- Price uses a quadratic bonding curve:
  P(s) = base_price + k*s^2
- Buy/sell execution must use integral pricing, not naive spot price
- Users can hold any number of cards they can afford
- Each week, users lock a lineup of exactly 5 owned artist cards
- Weekly lineup lock is Monday 00:00 UTC
- Weekly scoring window is Monday 00:00 UTC to Sunday 23:59 UTC
- Artist weekly score is ingested from admin-managed metrics table
- User weekly score is the sum of weekly scores for the 5 selected cards
- Track weekly leaderboard, season leaderboard, and portfolio leaderboard separately
- Season length is 4 weeks
- No real money, no crypto, no packs, no rarity tiers, no private leagues in v1

Implement:
1. full database schema
2. auth
3. wallet and holdings ledger
4. AMM buy/sell engine
5. artist list/detail endpoints
6. portfolio endpoints
7. weekly lineup submission and lock
8. scoring worker
9. weekly and seasonal leaderboards
10. admin UI for importing artists and weekly metrics
11. frontend pages:
   - dashboard
   - market
   - artist detail
   - portfolio
   - lineup builder
   - weekly leaderboard
   - season leaderboard
12. analytics instrumentation
13. seed scripts with 50 sample artists
14. test coverage for pricing, wallet updates, lineup locking, and scoring idempotency

Non-negotiable constraints:
- all financial state changes must be transactional
- no negative balances
- no overselling
- no lineup edits after lock
- all scoring jobs idempotent
- all times stored and computed in UTC
- code should be modular and documented
- include README with local setup, env vars, seed steps, and architecture summary

Deliver in phases:
Phase 1: repo, auth, db, seeds
Phase 2: AMM trading and portfolio
Phase 3: weekly lineup and scoring
Phase 4: frontend polish and admin tools
Phase 5: tests and deployment config
