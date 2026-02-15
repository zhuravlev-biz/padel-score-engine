import { createMatch } from "./match.js";
import { scorePoint } from "./scoring.js";
import { TEAM } from "./types.js";
import { undoLastPoint } from "./undo.js";

describe("undoLastPoint", () => {
  it("returns previous state", () => {
    const match = createMatch({ sets: 3, scoringMode: "goldenPoint", superTieBreak: true });
    const s1 = scorePoint(match, TEAM.A);
    const s0 = undoLastPoint(s1);

    expect(s0.score).toEqual(match.score);
    expect(s0.serving).toBe(match.serving);
    expect(s0.history.length).toBe(0);
  });

  it("throws on empty history", () => {
    const match = createMatch({ sets: 3, scoringMode: "goldenPoint", superTieBreak: true });

    expect(() => undoLastPoint(match)).toThrow("No history to undo");
  });

  it("reverts failedAdvantageResets in star point mode", () => {
    let state = createMatch({ sets: 3, scoringMode: "starPoint", superTieBreak: true });

    // Play to 40-40 (alternating points)
    state = scorePoint(state, TEAM.A);
    state = scorePoint(state, TEAM.B);
    state = scorePoint(state, TEAM.A);
    state = scorePoint(state, TEAM.B);
    state = scorePoint(state, TEAM.A);
    state = scorePoint(state, TEAM.B);

    // A gets AD
    state = scorePoint(state, TEAM.A);
    expect(state.score.A.points).toBe("AD");
    expect(state.gameDeuceState?.failedAdvantageResets).toBe(0);

    // B breaks AD → deuce, failedAdvantageResets becomes 1
    state = scorePoint(state, TEAM.B);
    expect(state.gameDeuceState?.failedAdvantageResets).toBe(1);

    // Undo → back to AD state with failedAdvantageResets === 0
    const undone = undoLastPoint(state);
    expect(undone.score.A.points).toBe("AD");
    expect(undone.gameDeuceState?.failedAdvantageResets).toBe(0);
  });

  it("multiple sequential undos back to initial", () => {
    const match = createMatch({ sets: 3, scoringMode: "goldenPoint", superTieBreak: true });

    let state = scorePoint(match, TEAM.A);
    state = scorePoint(state, TEAM.A);
    state = scorePoint(state, TEAM.A);

    state = undoLastPoint(state);
    state = undoLastPoint(state);
    state = undoLastPoint(state);

    expect(state.score).toEqual(match.score);
  });
});
