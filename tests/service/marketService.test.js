import { describe, beforeEach, it, expect } from 'vitest';
import { InMemoryDb } from '../../src/inMemoryDb.js';
import { PricingService } from '../../src/pricingService.js';
import { MarketService } from '../../src/marketService.js';

describe('MarketService + DB integration', () => {
  let db;
  let market;

  beforeEach(() => {
    db = new InMemoryDb({
      wallets: [{ userId: 'u1', cashBalance: 1000 }],
      artists: [{ id: 'a1', basePrice: 10, k: 0.01, circulatingSupply: 20 }]
    });
    const pricing = new PricingService({ buyFeeRate: 0.02, sellFeeRate: 0.02 });
    market = new MarketService({ db, pricingService: pricing });
  });

  it('rejects buy with insufficient cash', () => {
    expect(() => market.buy({ userId: 'u1', artistId: 'a1', quantity: 1000 })).toThrow('INSUFFICIENT_CASH');
  });

  it('rejects oversell requests', () => {
    expect(() => market.sell({ userId: 'u1', artistId: 'a1', quantity: 1 })).toThrow('OVERSELL');
  });

  it('updates avg cost on incremental buys', () => {
    market.buy({ userId: 'u1', artistId: 'a1', quantity: 2 });
    const first = db.holdings.get('u1:a1');
    const firstAvg = first.avgCost;

    market.buy({ userId: 'u1', artistId: 'a1', quantity: 3 });
    const second = db.holdings.get('u1:a1');

    expect(second.quantity).toBe(5);
    expect(second.avgCost).not.toBe(firstAvg);
    expect(second.avgCost).toBeGreaterThan(0);
  });

  it('deletes holding when quantity reaches zero', () => {
    market.buy({ userId: 'u1', artistId: 'a1', quantity: 2 });
    market.sell({ userId: 'u1', artistId: 'a1', quantity: 2 });

    expect(db.holdings.has('u1:a1')).toBe(false);
  });

  it('keeps ledger and trade records consistent', () => {
    market.buy({ userId: 'u1', artistId: 'a1', quantity: 1 });
    market.sell({ userId: 'u1', artistId: 'a1', quantity: 1 });

    expect(db.trades).toHaveLength(2);
    expect(db.ledgerEntries).toHaveLength(2);
    expect(db.trades[0].side).toBe('BUY');
    expect(db.trades[1].side).toBe('SELL');
  });
});
