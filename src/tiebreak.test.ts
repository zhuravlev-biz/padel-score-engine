import { createMatch } from "./match.js";
import { scorePoint, setSuperTieBreak } from "./scoring.js";
import { initTieBreak, scoreTieBreakPoint } from "./tiebreak.js";
import { TEAM } from "./types.js";
import type { MatchState, Team } from "./types.js";

function playPoints(state: MatchState, team: Team, count: number): MatchState {
  let s = state;
  for (let i = 0; i < count; i++) {
    s = scorePoint(s, team);
  }
  return s;
}

function winGame(state: MatchState, team: Team): MatchState {
  return playPoints(state, team, 4);
}

function toTieBreak(state: MatchState): MatchState {
  let s = state;
  for (let i = 0; i < 12; i++) {
    const team: Team = i % 2 === 0 ? "A" : "B";
    s = winGame(s, team);
  }
  return s;
}

function tbToScore(state: MatchState, score: number): MatchState {
  let s = state;
  for (let i = 0; i < score; i++) {
    s = scorePoint(s, TEAM.A);
    s = scorePoint(s, TEAM.B);
  }
  return s;
}

describe("initTieBreak", () => {
  it("creates tie-break with target 7", () => {
    expect(initTieBreak(7, "A")).toEqual({
      A: 0,
      B: 0,
      target: 7,
      initialServer: "A",
    });
  });

  it("creates tie-break with target 10", () => {
    expect(initTieBreak(10, "B")).toEqual({
      A: 0,
      B: 0,
      target: 10,
      initialServer: "B",
    });
  });
});

describe("scoreTieBreakPoint", () => {
  it("increments team score", () => {
    const result = scoreTieBreakPoint({ A: 0, B: 0, target: 7, initialServer: "A" }, "A");
    expect(result.tieBreak.A).toBe(1);
    expect(result.won).toBe(false);
  });

  it("detects win at target with 2-point lead", () => {
    const result = scoreTieBreakPoint({ A: 6, B: 3, target: 7, initialServer: "A" }, "A");
    expect(result.won).toBe(true);
    expect(result.winner).toBe("A");
  });

  it("no win at target without 2-point lead", () => {
    const result = scoreTieBreakPoint({ A: 6, B: 6, target: 7, initialServer: "A" }, "A");
    expect(result.won).toBe(false);
  });

  it("wins extended tie-break", () => {
    const result = scoreTieBreakPoint({ A: 8, B: 7, target: 7, initialServer: "A" }, "A");
    expect(result.won).toBe(true);
    expect(result.winner).toBe("A");
  });
});

describe("tie-break integration", () => {
  const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });

  it("enters tie-break at 6-6", () => {
    const s = toTieBreak(match);
    expect(s.phase).toBe("tieBreak");
    expect(s.tieBreak).not.toBeNull();
    expect(s.tieBreak?.target).toBe(7);
    expect(s.tieBreak?.A).toBe(0);
    expect(s.tieBreak?.B).toBe(0);
  });

  it("wins tie-break 7-0", () => {
    const s = playPoints(toTieBreak(match), "A", 7);
    expect(s.phase).toBe("inProgress");
    expect(s.tieBreak).toBeNull();
    expect(s.score.A.sets).toBe(1);
    expect(s.score.A.games).toBe(0);
    expect(s.score.B.games).toBe(0);
  });

  it("wins tie-break 7-5", () => {
    let s = toTieBreak(match);
    s = tbToScore(s, 5);
    s = playPoints(s, "A", 2);
    expect(s.phase).toBe("inProgress");
    expect(s.tieBreak).toBeNull();
    expect(s.score.A.sets).toBe(1);
  });

  it("7-6 does not win tie-break", () => {
    let s = toTieBreak(match);
    s = tbToScore(s, 6);
    s = scorePoint(s, TEAM.A);
    expect(s.phase).toBe("tieBreak");
    expect(s.tieBreak).not.toBeNull();
  });

  it("extended tie-break 9-7", () => {
    let s = toTieBreak(match);
    s = tbToScore(s, 7);
    s = playPoints(s, "A", 2);
    expect(s.phase).toBe("inProgress");
    expect(s.tieBreak).toBeNull();
    expect(s.score.A.sets).toBe(1);
  });

  it("star point mode ignored in tie-break", () => {
    const starMatch = createMatch({ scoringMode: "starPoint", sets: 3, superTieBreak: true });
    let s = toTieBreak(starMatch);
    expect(s.phase).toBe("tieBreak");
    s = tbToScore(s, 6);
    s = scorePoint(s, TEAM.A);
    expect(s.phase).toBe("tieBreak");
    expect(s.tieBreak).not.toBeNull();
    s = scorePoint(s, TEAM.A);
    expect(s.phase).toBe("inProgress");
    expect(s.tieBreak).toBeNull();
    expect(s.score.A.sets).toBe(1);
  });

  it("non-final set tie-break returns to inProgress", () => {
    const s = playPoints(toTieBreak(match), "A", 7);
    expect(s.phase).toBe("inProgress");
  });

  it("serve rotates correctly through tie-break points", () => {
    let s = toTieBreak(match);
    const tbStarter = s.serving;
    const other: Team = tbStarter === "A" ? "B" : "A";

    // Point 0: tbStarter serves
    expect(s.serving).toBe(tbStarter);
    s = scorePoint(s, TEAM.A);
    // After point 0 (1 point played): other serves
    expect(s.serving).toBe(other);
    s = scorePoint(s, TEAM.A);
    // After point 1 (2 points played): other still serves
    expect(s.serving).toBe(other);
    s = scorePoint(s, TEAM.A);
    // After point 2 (3 points played): tbStarter serves
    expect(s.serving).toBe(tbStarter);
    s = scorePoint(s, TEAM.A);
    // After point 3 (4 points played): tbStarter still serves
    expect(s.serving).toBe(tbStarter);
    s = scorePoint(s, TEAM.A);
    // After point 4 (5 points played): other serves
    expect(s.serving).toBe(other);
    s = scorePoint(s, TEAM.A);
    // After point 5 (6 points played): other still serves
    expect(s.serving).toBe(other);
  });

  it("after tie-break, receiver of first TB point serves next set", () => {
    let s = toTieBreak(match);
    const tbStarter = s.serving;
    const other: Team = tbStarter === "A" ? "B" : "A";
    s = playPoints(s, "A", 7);
    expect(s.phase).toBe("inProgress");
    expect(s.serving).toBe(other);
  });
});

describe("super tie-break", () => {
  function splitSets(state: MatchState): MatchState {
    let s = state;
    for (let i = 0; i < 6; i++) s = winGame(s, "A");
    for (let i = 0; i < 6; i++) s = winGame(s, "B");
    return s;
  }

  it("replaces the final set when superTieBreak is enabled", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    const s = splitSets(match);
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak?.target).toBe(10);
    expect(s.tieBreak?.A).toBe(0);
    expect(s.tieBreak?.B).toBe(0);
    expect(s.announce).toContain("Set");
  });

  it("initial super tie-break server is the team due to serve next", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    const s = splitSets(match);
    expect(s.tieBreak?.initialServer).toBe(s.serving);
  });

  it("starts after a set won in a regular tie-break", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    let s = match;
    for (let i = 0; i < 6; i++) s = winGame(s, "A"); // set 1: A 6-0
    s = toTieBreak(s); // set 2 reaches 6-6
    expect(s.phase).toBe("tieBreak");
    s = playPoints(s, "B", 7); // B wins the tie-break → sets 1-1
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak?.target).toBe(10);
    expect(s.tieBreak?.initialServer).toBe(s.serving);
  });

  it("plays a full final set without superTieBreak", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    const s = splitSets(match);
    expect(s.phase).toBe("inProgress");
    expect(s.tieBreak).toBeNull();
  });

  it("enters regular tie-break at 6-6 in final set without superTieBreak", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    const s = toTieBreak(splitSets(match));
    expect(s.phase).toBe("tieBreak");
    expect(s.tieBreak?.target).toBe(7);
  });

  it("enters super tie-break at 6-6 when enabled mid-decider", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    let s = splitSets(match);
    // players enable the super tie-break after the full final set has started
    s = { ...s, config: { ...s.config, superTieBreak: true } };
    s = toTieBreak(s);
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak?.target).toBe(10);
  });

  it("wins super tie-break 10-8", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    let s = splitSets(match);
    s = tbToScore(s, 8);
    s = playPoints(s, "A", 2);
    expect(s.phase).toBe("finished");
    expect(s.winner).toBe("A");
    expect(s.score.A.sets).toBe(2);
  });

  it("extended super tie-break 12-10", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    let s = splitSets(match);
    s = tbToScore(s, 10);
    s = playPoints(s, "A", 2);
    expect(s.phase).toBe("finished");
    expect(s.winner).toBe("A");
  });

  it("replaces the fifth set in a best-of-5 match", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 5, superTieBreak: true });
    let s = match;
    for (const team of ["A", "B", "A"] as const) {
      for (let i = 0; i < 6; i++) s = winGame(s, team);
    }
    expect(s.phase).toBe("inProgress"); // 2-1: not the decider yet
    for (let i = 0; i < 6; i++) s = winGame(s, "B");
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak?.target).toBe(10);
  });
});

describe("setSuperTieBreak", () => {
  function splitSets(state: MatchState): MatchState {
    let s = state;
    for (let i = 0; i < 6; i++) s = winGame(s, "A");
    for (let i = 0; i < 6; i++) s = winGame(s, "B");
    return s;
  }

  it("returns the same state when the flag already matches", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    expect(setSuperTieBreak(match, false)).toBe(match);
  });

  it("is a no-op on a finished match", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    let s = splitSets(match);
    s = { ...s, phase: "finished", winner: "A" };
    expect(setSuperTieBreak(s, true)).toBe(s);
  });

  it("only flips the flag before the decider", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    let s = winGame(match, "A"); // mid set 1
    const historyLength = s.history.length;
    s = setSuperTieBreak(s, true);
    expect(s.config.superTieBreak).toBe(true);
    expect(s.phase).toBe("inProgress");
    expect(s.tieBreak).toBeNull();
    expect(s.history.length).toBe(historyLength); // not undoable on its own
  });

  it("enabling mid-match makes the upcoming decider a super tie-break", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    let s = winGame(match, "A"); // flag flipped mid set 1
    s = setSuperTieBreak(s, true);
    for (let i = 0; i < 5; i++) s = winGame(s, "A"); // A takes set 1 6-0
    for (let i = 0; i < 6; i++) s = winGame(s, "B"); // B takes set 2 6-0
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak?.target).toBe(10);
  });

  it("enabling on a pristine final set converts it to a super tie-break", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    let s = splitSets(match); // sets 1-1, decider at 0-0
    expect(s.phase).toBe("inProgress");
    const serving = s.serving;
    s = setSuperTieBreak(s, true);
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak).toEqual({ A: 0, B: 0, target: 10, initialServer: serving });
    expect(s.announce).toBeNull();
  });

  it("enabling after the decider has points only flips the flag", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    let s = splitSets(match);
    s = scorePoint(s, TEAM.A); // 15-0 in the decider
    s = setSuperTieBreak(s, true);
    expect(s.phase).toBe("inProgress");
    expect(s.tieBreak).toBeNull();
    expect(s.config.superTieBreak).toBe(true); // 6-6 will enter a super tie-break
  });

  it("enabling on a pristine final-set tie-break upgrades it to a super tie-break", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    let s = toTieBreak(splitSets(match)); // decider at 6-6, regular TB
    expect(s.phase).toBe("tieBreak");
    const initialServer = s.tieBreak?.initialServer;
    s = setSuperTieBreak(s, true);
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak?.target).toBe(10);
    expect(s.tieBreak?.initialServer).toBe(initialServer);
  });

  it("enabling on a non-final-set tie-break only flips the flag", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    let s = toTieBreak(match); // set 1 at 6-6
    s = setSuperTieBreak(s, true);
    expect(s.phase).toBe("tieBreak");
    expect(s.tieBreak?.target).toBe(7);
  });

  it("disabling on a pristine super tie-break reopens the full final set", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    let s = splitSets(match); // super TB replaced the decider
    expect(s.phase).toBe("superTieBreak");
    const serving = s.serving;
    s = setSuperTieBreak(s, false);
    expect(s.phase).toBe("inProgress");
    expect(s.tieBreak).toBeNull();
    expect(s.score.A.games).toBe(0);
    expect(s.score.B.games).toBe(0);
    expect(s.serving).toBe(serving);
  });

  it("disabling a 6-6 super tie-break downgrades it to a regular tie-break", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    let s = toTieBreak(splitSets(match)); // full decider reaches 6-6 → regular TB
    s = setSuperTieBreak(s, true); // upgrade to a pristine super TB
    expect(s.phase).toBe("superTieBreak");
    s = setSuperTieBreak(s, false); // change of heart: back to a regular TB
    expect(s.phase).toBe("tieBreak");
    expect(s.tieBreak?.target).toBe(7);
    expect(s.score.A.games).toBe(6);
    expect(s.score.B.games).toBe(6);
  });

  it("disabling a super tie-break with points played only flips the flag", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    let s = splitSets(match);
    s = scorePoint(s, TEAM.A); // 1-0 in the super TB
    s = setSuperTieBreak(s, false);
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak?.target).toBe(10); // in-flight tie-break keeps its target
    expect(s.config.superTieBreak).toBe(false);
  });

  it("round-trip on a pristine decider is fully reversible", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    const decider = splitSets(match);
    const toggled = setSuperTieBreak(setSuperTieBreak(decider, true), false);
    expect(toggled.phase).toBe("inProgress");
    expect(toggled.tieBreak).toBeNull();
    expect(toggled.score).toEqual(decider.score);
    expect(toggled.serving).toBe(decider.serving);
  });
});
