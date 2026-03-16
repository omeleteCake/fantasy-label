import { describe, expect, it } from "vitest";

type State = { done: boolean; runCount: number };
const run = (state: State) => {
  if (state.done) return state;
  return { done: true, runCount: state.runCount + 1 };
};

describe("scoring idempotency", () => {
  it("runs once even if retried", () => {
    let state = { done: false, runCount: 0 };
    state = run(state);
    state = run(state);
    expect(state.done).toBe(true);
    expect(state.runCount).toBe(1);
  });
});
