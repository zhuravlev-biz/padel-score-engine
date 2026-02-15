import { createMatch } from "./match.js";
import { scorePoint } from "./scoring.js";
import { opponent, tieBreakServer, toggleServe } from "./serve.js";
import { TEAM } from "./types.js";

describe("opponent", () => {
  it("returns B for A", () => {
    expect(opponent("A")).toBe("B");
  });

  it("returns A for B", () => {
    expect(opponent("B")).toBe("A");
  });
});

describe("toggleServe", () => {
  it("toggles A to B", () => {
    expect(toggleServe("A")).toBe("B");
  });

  it("toggles B to A", () => {
    expect(toggleServe("B")).toBe("A");
  });
});

describe("tieBreakServer", () => {
  it("initial server serves point 0", () => {
    expect(tieBreakServer("A", 0)).toBe("A");
  });

  it("switches after first point", () => {
    expect(tieBreakServer("A", 1)).toBe("B");
  });

  it("same server for second point of pair", () => {
    expect(tieBreakServer("A", 2)).toBe("B");
  });

  it("switches back at point 3", () => {
    expect(tieBreakServer("A", 3)).toBe("A");
  });

  it("point 4 same as point 3", () => {
    expect(tieBreakServer("A", 4)).toBe("A");
  });

  it("switches at point 5", () => {
    expect(tieBreakServer("A", 5)).toBe("B");
  });

  it("works with B as initial", () => {
    expect(tieBreakServer("B", 0)).toBe("B");
    expect(tieBreakServer("B", 1)).toBe("A");
  });
});

describe("serve alternation through scoring", () => {
  it("serve alternates every game", () => {
    let state = createMatch({
      sets: 3,
      scoringMode: "goldenPoint",
      superTieBreak: true,
    });

    for (let i = 0; i < 4; i++) {
      state = scorePoint(state, TEAM.A);
    }
    expect(state.serving).toBe("B");

    for (let i = 0; i < 4; i++) {
      state = scorePoint(state, TEAM.B);
    }
    expect(state.serving).toBe("A");
  });
});
