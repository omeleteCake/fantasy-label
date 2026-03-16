import { describe, expect, it } from "vitest";

const applyBuy = (balance: number, cost: number) => {
  if (cost > balance) throw new Error("Insufficient balance");
  return balance - cost;
};

const applySell = (holding: number, qty: number) => {
  if (qty > holding) throw new Error("Cannot oversell holdings");
  return holding - qty;
};

describe("wallet and holdings guards", () => {
  it("prevents negative balance", () => {
    expect(() => applyBuy(10, 11)).toThrow(/Insufficient/);
  });

  it("prevents overselling", () => {
    expect(() => applySell(2, 3)).toThrow(/oversell/);
  });
});
