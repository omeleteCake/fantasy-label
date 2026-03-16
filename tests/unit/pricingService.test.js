import { describe, it, expect } from 'vitest';
import { PricingService } from '../../src/pricingService.js';

describe('PricingService unit tests', () => {
  const service = new PricingService({ buyFeeRate: 0.02, sellFeeRate: 0.02 });
  const artist = { basePrice: 100, k: 0.05, circulatingSupply: 10 };

  it('computes spot price', () => {
    expect(service.spotPrice(artist)).toBe(105);
  });

  it('computes buy quote using integral math', () => {
    const gross = service.buyGrossQuote(artist, 3);
    const expected = 100 * 3 + (0.05 / 3) * (13 ** 3 - 10 ** 3);
    expect(gross).toBeCloseTo(expected, 10);
  });

  it('computes sell quote using integral math', () => {
    const gross = service.sellGrossQuote(artist, 3);
    const expected = 100 * 3 + (0.05 / 3) * (10 ** 3 - 7 ** 3);
    expect(gross).toBeCloseTo(expected, 10);
  });

  it('applies buy/sell fees correctly', () => {
    const buy = service.applyBuyFee(1000);
    expect(buy.fee).toBe(20);
    expect(buy.total).toBe(1020);

    const sell = service.applySellFee(1000);
    expect(sell.fee).toBe(20);
    expect(sell.net).toBe(980);
  });
});
