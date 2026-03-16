export class InMemoryStore {
  constructor(seed = {}) {
    this.jobRuns = new Map((seed.jobRuns || []).map((r) => [r.idempotencyKey, { ...r }]));
    this.weeks = new Map((seed.weeks || []).map((w) => [w.id, { ...w }]));
    this.seasons = new Map((seed.seasons || []).map((s) => [s.id, { ...s }]));
    this.artists = new Map((seed.artists || []).map((a) => [a.id, { ...a }]));
    this.lineups = new Map((seed.lineups || []).map((l) => [l.id, { ...l }]));
    this.metrics = new Map((seed.metrics || []).map((m) => [`${m.weekId}:${m.artistId}`, { ...m }]));
    this.weeklyScores = new Map((seed.weeklyScores || []).map((s) => [`${s.weekId}:${s.userId}`, { ...s }]));
    this.seasonScores = new Map((seed.seasonScores || []).map((s) => [`${s.seasonId}:${s.userId}`, { ...s }]));
    this.portfolioSnapshots = [...(seed.portfolioSnapshots || [])];
  }

  getJobRun(idempotencyKey) {
    return this.jobRuns.get(idempotencyKey) || null;
  }

  saveJobRun(jobRun) {
    this.jobRuns.set(jobRun.idempotencyKey, { ...jobRun });
    return this.jobRuns.get(jobRun.idempotencyKey);
  }

  getWeek(weekId) {
    return this.weeks.get(weekId) || null;
  }

  saveWeek(week) {
    this.weeks.set(week.id, { ...week });
    return this.weeks.get(week.id);
  }

  getSeason(seasonId) {
    return this.seasons.get(seasonId) || null;
  }

  saveSeason(season) {
    this.seasons.set(season.id, { ...season });
    return this.seasons.get(season.id);
  }

  listSeasons() {
    return [...this.seasons.values()];
  }

  listArtists({ activeOnly = false } = {}) {
    const all = [...this.artists.values()];
    return activeOnly ? all.filter((artist) => artist.active) : all;
  }

  getMetric(weekId, artistId) {
    return this.metrics.get(`${weekId}:${artistId}`) || null;
  }

  saveMetric(metric) {
    this.metrics.set(`${metric.weekId}:${metric.artistId}`, { ...metric });
  }

  listLineupsByWeek(weekId) {
    return [...this.lineups.values()].filter((lineup) => lineup.weekId === weekId);
  }

  saveLineup(lineup) {
    this.lineups.set(lineup.id, { ...lineup });
    return this.lineups.get(lineup.id);
  }

  upsertWeeklyScore(score) {
    this.weeklyScores.set(`${score.weekId}:${score.userId}`, { ...score });
  }

  deleteWeeklyScoresForWeek(weekId) {
    for (const key of this.weeklyScores.keys()) {
      if (key.startsWith(`${weekId}:`)) {
        this.weeklyScores.delete(key);
      }
    }
  }

  listWeeklyScoresForWeek(weekId) {
    return [...this.weeklyScores.values()].filter((score) => score.weekId === weekId);
  }

  listWeeklyScoresForSeason(seasonId) {
    const weekIds = [...this.weeks.values()].filter((w) => w.seasonId === seasonId).map((w) => w.id);
    const weekIdSet = new Set(weekIds);
    return [...this.weeklyScores.values()].filter((score) => weekIdSet.has(score.weekId));
  }

  replaceSeasonScores(seasonId, scores) {
    for (const key of this.seasonScores.keys()) {
      if (key.startsWith(`${seasonId}:`)) {
        this.seasonScores.delete(key);
      }
    }
    for (const score of scores) {
      this.seasonScores.set(`${score.seasonId}:${score.userId}`, { ...score });
    }
  }

  listSeasonScores(seasonId) {
    return [...this.seasonScores.values()].filter((s) => s.seasonId === seasonId);
  }

  appendPortfolioSnapshot(snapshot) {
    this.portfolioSnapshots.push({ ...snapshot });
  }

  listPortfolioSnapshots() {
    return [...this.portfolioSnapshots];
  }
}
