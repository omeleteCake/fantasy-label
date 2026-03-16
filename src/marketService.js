export class MarketService {
  constructor({ db, pricingService }) {
    this.db = db;
    this.pricingService = pricingService;
  }

  buy({ userId, artistId, quantity }) {
    const wallet = this.db.wallets.get(userId);
    const artist = this.db.artists.get(artistId);

    const gross = this.pricingService.buyGrossQuote(artist, quantity);
    const { fee, total } = this.pricingService.applyBuyFee(gross);

    if (wallet.cashBalance < total) {
      throw new Error('INSUFFICIENT_CASH');
    }

    wallet.cashBalance -= total;
    artist.circulatingSupply += quantity;

    const key = this.db.holdingKey(userId, artistId);
    const current = this.db.holdings.get(key) || { userId, artistId, quantity: 0, avgCost: 0 };
    const existingCostBasis = current.quantity * current.avgCost;
    current.quantity += quantity;
    current.avgCost = (existingCostBasis + gross) / current.quantity;
    this.db.holdings.set(key, current);

    this.recordTrade({ userId, artistId, side: 'BUY', quantity, grossAmount: gross, feeAmount: fee });
    this.recordLedger(userId, -total, 'BUY');

    return { gross, fee, total };
  }

  sell({ userId, artistId, quantity }) {
    const wallet = this.db.wallets.get(userId);
    const artist = this.db.artists.get(artistId);
    const key = this.db.holdingKey(userId, artistId);
    const current = this.db.holdings.get(key);

    if (!current || current.quantity < quantity) {
      throw new Error('OVERSELL');
    }

    const gross = this.pricingService.sellGrossQuote(artist, quantity);
    const { fee, net } = this.pricingService.applySellFee(gross);

    wallet.cashBalance += net;
    artist.circulatingSupply -= quantity;
    current.quantity -= quantity;

    if (current.quantity === 0) {
      this.db.holdings.delete(key);
    } else {
      this.db.holdings.set(key, current);
    }

    this.recordTrade({ userId, artistId, side: 'SELL', quantity, grossAmount: gross, feeAmount: fee });
    this.recordLedger(userId, net, 'SELL');

    return { gross, fee, net };
  }

  recordTrade(trade) {
    this.db.trades.push({ ...trade, id: this.db.trades.length + 1 });
  }

  recordLedger(userId, amount, source) {
    this.db.ledgerEntries.push({ id: this.db.ledgerEntries.length + 1, userId, amount, source });
  }
}
