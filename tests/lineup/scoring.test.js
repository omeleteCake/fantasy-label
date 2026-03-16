import { describe, beforeEach, it, expect } from 'vitest';
import { InMemoryDb } from '../../src/inMemoryDb.js';
import { LineupService } from '../../src/lineupService.js';
import { ScoringService } from '../../src/scoringService.js';

describe('Lineup validation and scoring', () => {
  let db;
  let lineup;
  let scoring;

  beforeEach(() => {
    db = new InMemoryDb();
    lineup = new LineupService({ db, lineupSize: 5 });
    scoring = new ScoringService({ db });
    db.metricsByWeek.set('2026-W01', new Map([
      ['a1', 10], ['a2', 8], ['a3', 7], ['a4', 6], ['a5', 5], ['a6', 4]
    ]));
    db.metricsByWeek.set('2026-W02', new Map([
      ['a1', 6], ['a2', 6], ['a3', 6], ['a4', 6], ['a5', 6], ['a6', 20]
    ]));
  });

  it('enforces lineup size and lock deadline', () => {
    expect(() => lineup.submitLineup({
      userId: 'u1',
      weekStart: '2026-W01',
      artistIds: ['a1', 'a2'],
      now: new Date('2026-01-04T23:00:00Z')
    })).toThrow('INVALID_LINEUP_SIZE');

    expect(() => lineup.submitLineup({
      userId: 'u1',
      weekStart: '2026-W01',
      artistIds: ['a1', 'a2', 'a3', 'a4', 'a5'],
      now: new Date('2026-01-05T00:00:00Z')
    })).toThrow('LINEUP_LOCKED');
  });

  it('scoring is idempotent with persisted state', () => {
    lineup.submitLineup({
      userId: 'u1', weekStart: '2026-W01', artistIds: ['a1', 'a2', 'a3', 'a4', 'a5'], now: new Date('2026-01-04T10:00:00Z')
    });

    const first = scoring.runWeeklyScoring({ weekStart: '2026-W01', seasonId: 'S1' });
    const second = scoring.runWeeklyScoring({ weekStart: '2026-W01', seasonId: 'S1' });

    expect(first).toEqual(second);
    expect(db.weeklyScores).toHaveLength(1);
  });

  it('computes weekly rank ordering', () => {
    lineup.submitLineup({
      userId: 'u1', weekStart: '2026-W01', artistIds: ['a1', 'a2', 'a3', 'a4', 'a5'], now: new Date('2026-01-04T10:00:00Z')
    });
    lineup.submitLineup({
      userId: 'u2', weekStart: '2026-W01', artistIds: ['a2', 'a3', 'a4', 'a5', 'a6'], now: new Date('2026-01-04T10:00:00Z')
    });

    const scores = scoring.runWeeklyScoring({ weekStart: '2026-W01', seasonId: 'S1' });
    expect(scores[0].points).toBeGreaterThanOrEqual(scores[1].points);
    expect(scores[0].rank).toBe(1);
    expect(scores[1].rank).toBe(2);
  });

  it('updates cumulative season totals correctly', () => {
    lineup.submitLineup({
      userId: 'u1', weekStart: '2026-W01', artistIds: ['a1', 'a2', 'a3', 'a4', 'a5'], now: new Date('2026-01-04T10:00:00Z')
    });
    lineup.submitLineup({
      userId: 'u1', weekStart: '2026-W02', artistIds: ['a1', 'a2', 'a3', 'a4', 'a6'], now: new Date('2026-01-11T10:00:00Z')
    });

    scoring.runWeeklyScoring({ weekStart: '2026-W01', seasonId: 'S1' });
    scoring.runWeeklyScoring({ weekStart: '2026-W02', seasonId: 'S1' });

    const season = db.seasonScores.get('S1:u1');
    expect(season.totalPoints).toBe(36 + 44);
  });
});
