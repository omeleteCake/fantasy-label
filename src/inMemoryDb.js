export class InMemoryDb {
  constructor(seed = {}) {
    this.wallets = new Map();
    this.artists = new Map();
    this.holdings = new Map();
    this.trades = [];
    this.ledgerEntries = [];
    this.lineups = new Map();
    this.weeklyScores = [];
    this.seasonScores = new Map();
    this.metricsByWeek = new Map();

    seed.wallets?.forEach((wallet) => this.wallets.set(wallet.userId, { ...wallet }));
    seed.artists?.forEach((artist) => this.artists.set(artist.id, { ...artist }));
  }

  holdingKey(userId, artistId) {
    return `${userId}:${artistId}`;
  }
}
