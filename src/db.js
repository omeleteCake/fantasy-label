const nowIso = () => new Date().toISOString();

export class InMemoryDb {
  constructor(seed = {}) {
    this.weeks = seed.weeks ?? [];
    this.holdings = seed.holdings ?? [];
    this.weeklyLineups = seed.weeklyLineups ?? [];
    this.weeklyLineupItems = seed.weeklyLineupItems ?? [];
    this.ids = {
      lineup: 1,
      item: 1,
    };
  }

  findCurrentWeek(referenceTimeIso = nowIso()) {
    const ts = Date.parse(referenceTimeIso);
    return this.weeks.find((week) => {
      const start = Date.parse(week.startsAt);
      const end = Date.parse(week.endsAt);
      return Number.isFinite(start) && Number.isFinite(end) && start <= ts && ts < end;
    }) ?? null;
  }

  findWeekById(id) {
    return this.weeks.find((w) => w.id === id) ?? null;
  }

  findLineup(userId, weekId) {
    return this.weeklyLineups.find((lineup) => lineup.userId === userId && lineup.weekId === weekId) ?? null;
  }

  getLineupArtistIds(lineupId) {
    return this.weeklyLineupItems.filter((i) => i.lineupId === lineupId).map((i) => i.artistId);
  }

  upsertLineup(userId, weekId, artistIds) {
    const existing = this.findLineup(userId, weekId);
    if (existing) {
      this.weeklyLineupItems = this.weeklyLineupItems.filter((item) => item.lineupId !== existing.id);
      artistIds.forEach((artistId) => {
        this.weeklyLineupItems.push({ id: this.ids.item++, lineupId: existing.id, artistId });
      });
      return existing;
    }

    const lineup = {
      id: this.ids.lineup++,
      userId,
      weekId,
      submittedAt: null,
      lockedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.weeklyLineups.push(lineup);
    artistIds.forEach((artistId) => {
      this.weeklyLineupItems.push({ id: this.ids.item++, lineupId: lineup.id, artistId });
    });
    return lineup;
  }

  lockLineup(lineupId, timestampIso) {
    const lineup = this.weeklyLineups.find((l) => l.id === lineupId);
    if (!lineup) return null;
    lineup.submittedAt = lineup.submittedAt ?? timestampIso;
    lineup.lockedAt = timestampIso;
    lineup.updatedAt = timestampIso;
    return lineup;
  }

  ownedArtistIds(userId) {
    return new Set(this.holdings.filter((h) => h.userId === userId && h.quantity > 0).map((h) => h.artistId));
  }
}
