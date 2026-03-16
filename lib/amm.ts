export type CurveParams = {
  basePrice: number;
  kFactor: number;
};

const primitive = (s: number, { basePrice, kFactor }: CurveParams) => {
  return basePrice * s + (kFactor * Math.pow(s, 3)) / 3;
};

export const costToBuy = (supply: number, quantity: number, params: CurveParams) => {
  if (quantity <= 0) throw new Error("Quantity must be positive");
  return primitive(supply + quantity, params) - primitive(supply, params);
};

export const proceedsToSell = (supply: number, quantity: number, params: CurveParams) => {
  if (quantity <= 0) throw new Error("Quantity must be positive");
  if (quantity > supply) throw new Error("Cannot sell more than supply");
  return primitive(supply, params) - primitive(supply - quantity, params);
};
