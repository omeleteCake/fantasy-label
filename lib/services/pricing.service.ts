import { BUY_FEE_BPS, SELL_FEE_BPS } from '../config/game-config';

const BPS_DENOMINATOR = 10_000;

type CurveInput = {
  basePrice: number;
  k: number;
  supply: number;
};

export type BuyQuote = {
  grossCost: number;
  fee: number;
  totalCost: number;
  unitPrice: number;
  nextSpotPrice: number;
};

export type SellQuote = {
  grossProceeds: number;
  fee: number;
  netProceeds: number;
  unitPrice: number;
  nextSpotPrice: number;
};

export class PricingService {
  static validateQuantity(quantity: number): void {
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive integer.');
    }
  }

  static getSpotPrice({ basePrice, k, supply }: CurveInput): number {
    return basePrice + k * supply ** 2;
  }

  static getBuyQuote(curve: CurveInput, quantity: number): BuyQuote {
    this.validateQuantity(quantity);

    const { basePrice: b, k, supply: s } = curve;

    // cost = b*q + (k/3) * ((s + q)^3 - s^3)
    const grossCost = b * quantity + (k / 3) * ((s + quantity) ** 3 - s ** 3);
    const fee = (grossCost * BUY_FEE_BPS) / BPS_DENOMINATOR;
    const totalCost = grossCost + fee;

    return {
      grossCost,
      fee,
      totalCost,
      unitPrice: grossCost / quantity,
      nextSpotPrice: this.getSpotPrice({ ...curve, supply: s + quantity }),
    };
  }

  static getSellQuote(curve: CurveInput, quantity: number): SellQuote {
    this.validateQuantity(quantity);

    const { basePrice: b, k, supply: s } = curve;

    if (quantity > s) {
      throw new Error('Cannot sell more than circulating supply.');
    }

    // proceeds = b*q + (k/3) * (s^3 - (s - q)^3)
    const grossProceeds = b * quantity + (k / 3) * (s ** 3 - (s - quantity) ** 3);
    const fee = (grossProceeds * SELL_FEE_BPS) / BPS_DENOMINATOR;
    const netProceeds = grossProceeds - fee;

    return {
      grossProceeds,
      fee,
      netProceeds,
      unitPrice: grossProceeds / quantity,
      nextSpotPrice: this.getSpotPrice({ ...curve, supply: s - quantity }),
    };
  }
}
