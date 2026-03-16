import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const STARTING_CASH = new Prisma.Decimal(100_000);
const STARTING_GRANT_REASON = 'STARTING_GRANT';
const TOTAL_TEST_USERS = 10;
const TOTAL_ARTISTS = 50;
const TOTAL_WEEKS = 4;

const INCLUDE_DEMO_WEEKLY_METRICS =
  process.env.SEED_DEMO_METRICS !== 'false' && process.env.SEED_DEMO_METRICS !== '0';

const TOP_TIER_COUNT = 8;
const MID_TIER_COUNT = 17;
const LONG_TAIL_COUNT = TOTAL_ARTISTS - TOP_TIER_COUNT - MID_TIER_COUNT;

type ArtistTier = 'TOP' | 'MID' | 'LONG_TAIL';

function deterministicPasswordHash(username: string): string {
  // Deterministic seed-only placeholder hash string for local/demo environments.
  return `seed_hash_${username}_change_me`;
}

function getArtistTier(index: number): ArtistTier {
  if (index < TOP_TIER_COUNT) return 'TOP';
  if (index < TOP_TIER_COUNT + MID_TIER_COUNT) return 'MID';
  return 'LONG_TAIL';
}

function tierPricing(tier: ArtistTier): { basePrice: Prisma.Decimal; k: Prisma.Decimal } {
  switch (tier) {
    case 'TOP':
      return {
        basePrice: new Prisma.Decimal(2_500),
        k: new Prisma.Decimal(0.0008),
      };
    case 'MID':
      return {
        basePrice: new Prisma.Decimal(1_200),
        k: new Prisma.Decimal(0.0005),
      };
    default:
      return {
        basePrice: new Prisma.Decimal(400),
        k: new Prisma.Decimal(0.0002),
      };
  }
}

function nextMondayUtc(date: Date): Date {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysToAdd = day === 1 ? 0 : (8 - day) % 7;
  utc.setUTCDate(utc.getUTCDate() + daysToAdd);
  utc.setUTCHours(0, 0, 0, 0);
  return utc;
}

function addDaysUtc(date: Date, days: number): Date {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

async function upsertUserWithWalletAndGrant(params: {
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
}) {
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      username: params.username,
      role: params.role,
      passwordHash: deterministicPasswordHash(params.username),
    },
    create: {
      email: params.email,
      username: params.username,
      role: params.role,
      passwordHash: deterministicPasswordHash(params.username),
    },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: { cashBalance: STARTING_CASH },
    create: {
      userId: user.id,
      cashBalance: STARTING_CASH,
    },
  });

  // Keep exactly one starting grant ledger row per user for idempotency.
  await prisma.ledgerEntry.deleteMany({
    where: {
      userId: user.id,
      reason: STARTING_GRANT_REASON,
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      userId: user.id,
      amount: STARTING_CASH,
      reason: STARTING_GRANT_REASON,
      note: 'Initial balance seeded for local development',
    },
  });

  return user;
}

async function seedUsers() {
  await upsertUserWithWalletAndGrant({
    email: 'admin@mmm.local',
    username: 'admin',
    role: 'ADMIN',
  });

  for (let i = 1; i <= TOTAL_TEST_USERS; i += 1) {
    const suffix = String(i).padStart(2, '0');
    await upsertUserWithWalletAndGrant({
      email: `test${suffix}@mmm.local`,
      username: `test_user_${suffix}`,
      role: 'USER',
    });
  }
}

async function seedArtists() {
  for (let i = 1; i <= TOTAL_ARTISTS; i += 1) {
    const tier = getArtistTier(i - 1);
    const pricing = tierPricing(tier);
    const n = String(i).padStart(2, '0');

    await prisma.artist.upsert({
      where: { slug: `artist-${n}` },
      update: {
        displayName: `Seed Artist ${n}`,
        pricingTier: tier,
        basePrice: pricing.basePrice,
        k: pricing.k,
      },
      create: {
        slug: `artist-${n}`,
        displayName: `Seed Artist ${n}`,
        pricingTier: tier,
        basePrice: pricing.basePrice,
        k: pricing.k,
        circulatingSupply: new Prisma.Decimal(0),
      },
    });
  }
}

async function seedSeasonAndWeeks() {
  const seasonStart = nextMondayUtc(new Date());
  const seasonEnd = addDaysUtc(seasonStart, TOTAL_WEEKS * 7);

  const activeSeason = await prisma.season.upsert({
    where: { slug: 'season-active-seed' },
    update: {
      name: 'Seed Active Season',
      status: 'ACTIVE',
      startAt: seasonStart,
      endAt: seasonEnd,
    },
    create: {
      slug: 'season-active-seed',
      name: 'Seed Active Season',
      status: 'ACTIVE',
      startAt: seasonStart,
      endAt: seasonEnd,
    },
  });

  // Clear and recreate to guarantee exactly 4 canonical weeks on every run.
  await prisma.seasonWeek.deleteMany({ where: { seasonId: activeSeason.id } });

  for (let w = 0; w < TOTAL_WEEKS; w += 1) {
    const weekStart = addDaysUtc(seasonStart, w * 7);
    const weekEnd = addDaysUtc(weekStart, 7);
    const lockAt = weekStart;

    await prisma.seasonWeek.create({
      data: {
        seasonId: activeSeason.id,
        weekNumber: w + 1,
        weekStart,
        weekEnd,
        lockAt,
        status: w === 0 ? 'ACTIVE' : 'SCHEDULED',
      },
    });
  }

  return prisma.seasonWeek.findFirstOrThrow({
    where: { seasonId: activeSeason.id, weekNumber: 1 },
  });
}

async function seedDemoMetrics(activeWeekStart: Date) {
  if (!INCLUDE_DEMO_WEEKLY_METRICS) return;

  const artists = await prisma.artist.findMany({
    where: { slug: { startsWith: 'artist-' } },
    orderBy: { slug: 'asc' },
  });

  await prisma.artistMetricWeekly.deleteMany({
    where: { weekStart: activeWeekStart },
  });

  for (let i = 0; i < artists.length; i += 1) {
    // Deterministic pseudo metrics by artist index.
    const normalizedViews = Number((0.2 + (i % 10) * 0.08).toFixed(4));
    const normalizedGrowth = Number((0.1 + (i % 7) * 0.09).toFixed(4));
    const normalizedEngagement = Number((0.15 + (i % 5) * 0.12).toFixed(4));
    const finalWeeklyScore = Number(
      (normalizedViews * 0.5 + normalizedGrowth * 0.35 + normalizedEngagement * 0.15).toFixed(4),
    );

    await prisma.artistMetricWeekly.create({
      data: {
        artistId: artists[i].id,
        weekStart: activeWeekStart,
        normalizedViews,
        normalizedGrowth,
        normalizedEngagement,
        finalWeeklyScore,
      },
    });
  }
}

async function main() {
  await seedUsers();
  await seedArtists();
  const activeWeek = await seedSeasonAndWeeks();
  await seedDemoMetrics(activeWeek.weekStart);

  console.log('✅ Seed complete');
  console.log(`Users: 1 admin + ${TOTAL_TEST_USERS} test users`);
  console.log(
    `Artists: ${TOTAL_ARTISTS} (${TOP_TIER_COUNT} top / ${MID_TIER_COUNT} mid / ${LONG_TAIL_COUNT} long-tail)`,
  );
  console.log(`Season: ACTIVE with ${TOTAL_WEEKS} weeks`);
  console.log(`Demo weekly metrics: ${INCLUDE_DEMO_WEEKLY_METRICS ? 'enabled' : 'disabled'}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
