import { describe, expect, it } from "vitest";
import { costToBuy, proceedsToSell } from "../lib/amm";

describe("bonding curve integral pricing", () => {
  const params = { basePrice: 10, kFactor: 0.001 };

  it("computes buy cost using integral", () => {
    const cost = costToBuy(100, 5, params);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeCloseTo(113.8416666, 4);
  });

  it("computes sell proceeds using integral", () => {
    const proceeds = proceedsToSell(100, 5, params);
    expect(proceeds).toBeCloseTo(108.8416666, 4);
  });
});
