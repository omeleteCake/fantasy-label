import { describe, expect, it } from "vitest";

const canEditLineup = (now: Date, lock: Date) => now < lock;

describe("lineup lock", () => {
  it("disallows lineup edits after monday 00:00 utc", () => {
    const lock = new Date("2026-01-05T00:00:00.000Z");
    expect(canEditLineup(new Date("2026-01-04T23:59:59.000Z"), lock)).toBe(true);
    expect(canEditLineup(new Date("2026-01-05T00:00:00.000Z"), lock)).toBe(false);
  });
});
