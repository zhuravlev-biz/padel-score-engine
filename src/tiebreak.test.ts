import { createMatch } from "./match.js";
import { scorePoint } from "./scoring.js";
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
  function toSuperTieBreak(state: MatchState): MatchState {
    let s = state;
    for (let i = 0; i < 6; i++) s = winGame(s, "A");
    for (let i = 0; i < 6; i++) s = winGame(s, "B");
    s = toTieBreak(s);
    return s;
  }

  it("enters super tie-break in final set with superTieBreak enabled", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    const s = toSuperTieBreak(match);
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak?.target).toBe(10);
  });

  it("enters regular tie-break in final set without superTieBreak", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: false });
    const s = toSuperTieBreak(match);
    expect(s.phase).toBe("tieBreak");
    expect(s.tieBreak?.target).toBe(7);
  });

  it("wins super tie-break 10-8", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    let s = toSuperTieBreak(match);
    s = tbToScore(s, 8);
    s = playPoints(s, "A", 2);
    expect(s.phase).toBe("finished");
    expect(s.winner).toBe("A");
  });

  it("extended super tie-break 12-10", () => {
    const match = createMatch({ scoringMode: "goldenPoint", sets: 3, superTieBreak: true });
    let s = toSuperTieBreak(match);
    s = tbToScore(s, 10);
    s = playPoints(s, "A", 2);
    expect(s.phase).toBe("finished");
    expect(s.winner).toBe("A");
  });
});
