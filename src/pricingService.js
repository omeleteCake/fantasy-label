export class PricingService {
  constructor({ buyFeeRate = 0.02, sellFeeRate = 0.02 } = {}) {
    this.buyFeeRate = buyFeeRate;
    this.sellFeeRate = sellFeeRate;
  }

  spotPrice(artist) {
    return artist.basePrice + artist.k * artist.circulatingSupply ** 2;
  }

  buyGrossQuote(artist, quantity) {
    const s = artist.circulatingSupply;
    const q = quantity;
    return artist.basePrice * q + (artist.k / 3) * ((s + q) ** 3 - s ** 3);
  }

  sellGrossQuote(artist, quantity) {
    const s = artist.circulatingSupply;
    const q = quantity;
    return artist.basePrice * q + (artist.k / 3) * (s ** 3 - (s - q) ** 3);
  }

  applyBuyFee(grossAmount) {
    return {
      fee: grossAmount * this.buyFeeRate,
      total: grossAmount * (1 + this.buyFeeRate)
    };
  }

  applySellFee(grossAmount) {
    return {
      fee: grossAmount * this.sellFeeRate,
      net: grossAmount * (1 - this.sellFeeRate)
    };
  }
}
