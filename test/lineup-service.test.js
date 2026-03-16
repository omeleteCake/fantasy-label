import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryDb } from '../src/db.js';
import { LineupService } from '../src/services/LineupService.js';
import { ConflictError, ValidationError } from '../src/errors.js';

const setup = (now = '2026-03-16T12:00:00.000Z') => {
  const db = new InMemoryDb({
    weeks: [
      {
        id: 'week-1',
        startsAt: '2026-03-16T00:00:00.000Z',
        endsAt: '2026-03-23T00:00:00.000Z',
        lockAt: '2026-03-18T00:00:00.000Z',
      },
    ],
    holdings: [
      { userId: 'u1', artistId: 'a1', quantity: 1 },
      { userId: 'u1', artistId: 'a2', quantity: 1 },
      { userId: 'u1', artistId: 'a3', quantity: 1 },
      { userId: 'u1', artistId: 'a4', quantity: 1 },
      { userId: 'u1', artistId: 'a5', quantity: 1 },
    ],
  });
  const svc = new LineupService(db, () => new Date(now));
  return { db, svc };
};

test('save/edit pre-lock and lock with exactly 5 owned artists', () => {
  const { svc } = setup();
  svc.saveLineup('u1', 'week-1', ['a1', 'a2', 'a3']);
  const edited = svc.saveLineup('u1', 'week-1', ['a1', 'a2', 'a3', 'a4', 'a5']);
  assert.equal(edited.artistIds.length, 5);

  const locked = svc.lockLineup('u1', 'week-1');
  assert.ok(locked.lockedAt);
  assert.ok(locked.submittedAt);
});

test('disallow lock if lineup does not have exactly 5 unique artists', () => {
  const { svc } = setup();
  svc.saveLineup('u1', 'week-1', ['a1', 'a2', 'a3', 'a4']);
  assert.throws(() => svc.lockLineup('u1', 'week-1'), ValidationError);
});

test('disallow edits after lock with 409 conflict', () => {
  const { svc } = setup();
  svc.saveLineup('u1', 'week-1', ['a1', 'a2', 'a3', 'a4', 'a5']);
  svc.lockLineup('u1', 'week-1');
  assert.throws(() => svc.saveLineup('u1', 'week-1', ['a1']), ConflictError);
});

test('validate ownership at lock time only', () => {
  const { svc } = setup();
  svc.saveLineup('u1', 'week-1', ['a1', 'a2', 'a3', 'a4', 'not-owned']);
  assert.throws(() => svc.lockLineup('u1', 'week-1'), ValidationError);
});

test('uses UTC timestamps for close-window comparison', () => {
  const { svc } = setup('2026-03-18T00:00:00.000Z');
  assert.throws(() => svc.getUserLineup('u1', 'week-1'), ConflictError);
});
