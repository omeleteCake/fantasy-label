export class ScoringService {
  constructor({ db }) {
    this.db = db;
  }

  runWeeklyScoring({ weekStart, seasonId }) {
    // idempotency: overwrite existing week entries
    this.db.weeklyScores = this.db.weeklyScores.filter((score) => score.weekStart !== weekStart);

    const metrics = this.db.metricsByWeek.get(weekStart) || new Map();

    const newScores = [];
    for (const lineup of this.db.lineups.values()) {
      if (lineup.weekStart !== weekStart) continue;
      const total = lineup.artistIds.reduce((sum, artistId) => sum + (metrics.get(artistId) || 0), 0);
      newScores.push({
        userId: lineup.userId,
        weekStart,
        points: total
      });
    }

    newScores.sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId));
    newScores.forEach((score, i) => {
      score.rank = i + 1;
      this.db.weeklyScores.push(score);

      const seasonKey = `${seasonId}:${score.userId}`;
      const current = this.db.seasonScores.get(seasonKey) || { seasonId, userId: score.userId, totalPoints: 0 };
      // idempotent recompute: recalc from weekly scores for this season user
      const userTotal = this.db.weeklyScores
        .filter((row) => row.userId === score.userId)
        .reduce((sum, row) => sum + row.points, 0);
      current.totalPoints = userTotal;
      this.db.seasonScores.set(seasonKey, current);
    });

    return newScores;
  }
}
