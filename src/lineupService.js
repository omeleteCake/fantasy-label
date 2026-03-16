const MONDAY_UTC_DAY = 1;

export class LineupService {
  constructor({ db, lineupSize = 5 }) {
    this.db = db;
    this.lineupSize = lineupSize;
  }

  submitLineup({ userId, weekStart, artistIds, now }) {
    if (artistIds.length !== this.lineupSize) {
      throw new Error('INVALID_LINEUP_SIZE');
    }
    const unique = new Set(artistIds);
    if (unique.size !== artistIds.length) {
      throw new Error('DUPLICATE_ARTIST');
    }
    if (this.isLocked(now)) {
      throw new Error('LINEUP_LOCKED');
    }

    this.db.lineups.set(`${userId}:${weekStart}`, {
      userId,
      weekStart,
      artistIds: [...artistIds],
      locked: false
    });
  }

  lockLineups(weekStart) {
    for (const [key, lineup] of this.db.lineups.entries()) {
      if (lineup.weekStart === weekStart) {
        this.db.lineups.set(key, { ...lineup, locked: true });
      }
    }
  }

  isLocked(now) {
    const utcDay = now.getUTCDay();
    const hour = now.getUTCHours();
    return utcDay > MONDAY_UTC_DAY || (utcDay === MONDAY_UTC_DAY && hour >= 0);
  }
}
