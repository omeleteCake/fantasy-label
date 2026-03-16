import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryStore } from '../lib/scoring/in-memory-store.js';
import { ScoringService } from '../lib/scoring/scoring-service.js';

function buildWeeklyFixture() {
  return new InMemoryStore({
    artists: [
      { id: 'a1', active: true },
      { id: 'a2', active: true },
      { id: 'a3', active: true },
    ],
    seasons: [{ id: 's1', status: 'ACTIVE', active: true, ordinal: 1 }],
    weeks: [{ id: 'w1', seasonId: 's1', status: 'OPEN' }],
    lineups: [
      { id: 'l1', weekId: 'w1', userId: 'u1', artistIds: ['a1', 'a2'], locked: false, eligible: true },
      { id: 'l2', weekId: 'w1', userId: 'u2', artistIds: ['a2', 'a3'], locked: true, eligible: true },
    ],
    metrics: [
      { weekId: 'w1', artistId: 'a1', normalizedViews: 10, normalizedGrowth: 2, normalizedEngagement: 1 },
      { weekId: 'w1', artistId: 'a2', normalizedViews: 8, normalizedGrowth: 2, normalizedEngagement: 2 },
      { weekId: 'w1', artistId: 'a3', normalizedViews: 5, normalizedGrowth: 1, normalizedEngagement: 1 },
    ],
  });
}

test('weekly scoring orchestrates full flow and is idempotent', () => {
  const store = buildWeeklyFixture();
  const service = new ScoringService(store, () => '2025-01-01T00:00:00.000Z');

  const first = service.runWeeklyScore({ weekId: 'w1' });
  const second = service.runWeeklyScore({ weekId: 'w1' });

  assert.equal(first.noop, false);
  assert.equal(second.noop, true);
  assert.equal(store.getWeek('w1').status, 'SCORED');
  assert.equal(store.getJobRun('WEEKLY_SCORE:w1').status, 'COMPLETED');

  const lineups = store.listLineupsByWeek('w1');
  assert.equal(lineups.find((l) => l.id === 'l1').locked, true);

  const weekly = store.listWeeklyScoresForWeek('w1');
  assert.deepEqual(
    weekly.map((score) => ({ userId: score.userId, rank: score.rank })),
    [
      { userId: 'u1', rank: 1 },
      { userId: 'u2', rank: 2 },
    ],
  );

  const seasonScores = store.listSeasonScores('s1');
  assert.equal(seasonScores.length, 2);
  assert.equal(store.listPortfolioSnapshots().length, 2);
});

test('weekly scoring fails when metrics are incomplete', () => {
  const store = buildWeeklyFixture();
  store.metrics.delete('w1:a3');
  const service = new ScoringService(store);

  assert.throws(() => service.runWeeklyScore({ weekId: 'w1' }), /Metrics incomplete/);
});

test('season rollover closes season, creates next season, and is idempotent', () => {
  const store = new InMemoryStore({
    seasons: [{ id: 's1', status: 'ACTIVE', active: true, ordinal: 1, nextSeasonId: 's2' }],
  });
  const service = new ScoringService(store, () => '2025-01-01T00:00:00.000Z');

  const first = service.runSeasonRollover({ seasonId: 's1' });
  const second = service.runSeasonRollover({ seasonId: 's1' });

  assert.equal(first.noop, false);
  assert.equal(second.noop, true);
  assert.equal(store.getSeason('s1').status, 'COMPLETED');
  assert.equal(store.getSeason('s2').status, 'ACTIVE');
  assert.equal(store.getSeason('s2').weeks, 4);
});
