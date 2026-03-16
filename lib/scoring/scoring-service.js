import { InMemoryStore } from './in-memory-store.js';

const WEIGHTS = {
  normalizedViews: 0.5,
  normalizedGrowth: 0.35,
  normalizedEngagement: 0.15,
};

function deterministicRank(items, scoreField) {
  return [...items]
    .sort((a, b) => {
      if (b[scoreField] !== a[scoreField]) {
        return b[scoreField] - a[scoreField];
      }
      return String(a.userId).localeCompare(String(b.userId));
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export class ScoringService {
  constructor(store = new InMemoryStore(), now = () => new Date().toISOString()) {
    this.store = store;
    this.now = now;
  }

  runWeeklyScore({ weekId }) {
    const idempotencyKey = `WEEKLY_SCORE:${weekId}`;
    const existing = this.store.getJobRun(idempotencyKey);

    if (existing?.status === 'COMPLETED') {
      return { idempotencyKey, status: 'COMPLETED', noop: true };
    }

    const week = this.store.getWeek(weekId);
    if (!week) {
      throw new Error(`Week ${weekId} not found`);
    }

    this.store.saveJobRun({
      idempotencyKey,
      jobType: 'WEEKLY_SCORE',
      targetId: weekId,
      status: 'STARTED',
      startedAt: existing?.startedAt || this.now(),
      completedAt: null,
    });

    const lineups = this.store.listLineupsByWeek(weekId);
    for (const lineup of lineups) {
      if (!lineup.locked && lineup.eligible) {
        this.store.saveLineup({ ...lineup, locked: true, lockedAt: this.now() });
      }
    }

    const activeArtists = this.store.listArtists({ activeOnly: true });
    const missingMetrics = activeArtists
      .filter((artist) => !this.store.getMetric(weekId, artist.id))
      .map((artist) => artist.id);

    if (missingMetrics.length > 0) {
      throw new Error(`Metrics incomplete for week ${weekId}. Missing artists: ${missingMetrics.join(',')}`);
    }

    const artistScoreById = new Map(
      activeArtists.map((artist) => {
        const metric = this.store.getMetric(weekId, artist.id);
        const score =
          metric.normalizedViews * WEIGHTS.normalizedViews +
          metric.normalizedGrowth * WEIGHTS.normalizedGrowth +
          metric.normalizedEngagement * WEIGHTS.normalizedEngagement;
        this.store.saveMetric({ ...metric, finalWeeklyScore: score });
        return [artist.id, score];
      }),
    );

    this.store.deleteWeeklyScoresForWeek(weekId);

    const lockedLineups = this.store.listLineupsByWeek(weekId).filter((lineup) => lineup.locked);
    const weeklyScores = lockedLineups.map((lineup) => ({
      weekId,
      userId: lineup.userId,
      score: lineup.artistIds.reduce((sum, artistId) => sum + (artistScoreById.get(artistId) || 0), 0),
    }));

    const rankedWeeklyScores = deterministicRank(weeklyScores, 'score');
    for (const score of rankedWeeklyScores) {
      this.store.upsertWeeklyScore(score);
    }

    const seasonWeeklyScores = this.store.listWeeklyScoresForSeason(week.seasonId);
    const seasonTotalsByUser = new Map();
    for (const score of seasonWeeklyScores) {
      seasonTotalsByUser.set(score.userId, (seasonTotalsByUser.get(score.userId) || 0) + score.score);
    }

    const seasonScores = deterministicRank(
      [...seasonTotalsByUser.entries()].map(([userId, total]) => ({ seasonId: week.seasonId, userId, total })),
      'total',
    );
    this.store.replaceSeasonScores(week.seasonId, seasonScores);

    for (const seasonScore of seasonScores) {
      this.store.appendPortfolioSnapshot({
        seasonId: week.seasonId,
        weekId,
        userId: seasonScore.userId,
        totalScore: seasonScore.total,
        rank: seasonScore.rank,
        capturedAt: this.now(),
      });
    }

    this.store.saveWeek({ ...week, status: 'SCORED' });
    this.store.saveJobRun({
      idempotencyKey,
      jobType: 'WEEKLY_SCORE',
      targetId: weekId,
      status: 'COMPLETED',
      startedAt: existing?.startedAt || this.now(),
      completedAt: this.now(),
    });

    return {
      idempotencyKey,
      status: 'COMPLETED',
      weekStatus: 'SCORED',
      weeklyScores: rankedWeeklyScores,
      seasonScores,
      noop: false,
    };
  }

  runSeasonRollover({ seasonId }) {
    const idempotencyKey = `SEASON_ROLLOVER:${seasonId}`;
    const existing = this.store.getJobRun(idempotencyKey);

    if (existing?.status === 'COMPLETED') {
      return { idempotencyKey, status: 'COMPLETED', noop: true };
    }

    const season = this.store.getSeason(seasonId);
    if (!season) {
      throw new Error(`Season ${seasonId} not found`);
    }

    this.store.saveJobRun({
      idempotencyKey,
      jobType: 'SEASON_ROLLOVER',
      targetId: seasonId,
      status: 'STARTED',
      startedAt: existing?.startedAt || this.now(),
      completedAt: null,
    });

    this.store.saveSeason({ ...season, status: 'COMPLETED', active: false, closedAt: this.now() });

    const nextSeasonId = season.nextSeasonId || `${season.id}-next`;
    const existingSeasons = this.store.listSeasons();
    const maxOrdinal = existingSeasons.reduce((max, s) => Math.max(max, s.ordinal || 0), 0);

    for (const s of existingSeasons) {
      if (s.id !== season.id && s.active) {
        this.store.saveSeason({ ...s, active: false });
      }
    }

    this.store.saveSeason({
      id: nextSeasonId,
      status: 'ACTIVE',
      active: true,
      weeks: 4,
      ordinal: maxOrdinal + 1,
      createdAt: this.now(),
    });

    this.store.saveJobRun({
      idempotencyKey,
      jobType: 'SEASON_ROLLOVER',
      targetId: seasonId,
      status: 'COMPLETED',
      startedAt: existing?.startedAt || this.now(),
      completedAt: this.now(),
    });

    return { idempotencyKey, status: 'COMPLETED', noop: false, nextSeasonId };
  }
}

const globalStore = new InMemoryStore();
export const scoringService = new ScoringService(globalStore);
