import { createMatch } from "./match.js";
import { scorePoint, setScoringMode } from "./scoring.js";
import { TEAM } from "./types.js";
import type { MatchConfig, MatchState, Team } from "./types.js";

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

function winSet(state: MatchState, team: Team): MatchState {
  let s = state;
  for (let i = 0; i < 6; i++) {
    s = winGame(s, team);
  }
  return s;
}

function toDeuce(state: MatchState): MatchState {
  let s = state;
  s = scorePoint(s, TEAM.A);
  s = scorePoint(s, TEAM.B);
  s = scorePoint(s, TEAM.A);
  s = scorePoint(s, TEAM.B);
  s = scorePoint(s, TEAM.A);
  s = scorePoint(s, TEAM.B);
  return s;
}

function alternateGames(state: MatchState, count: number): MatchState {
  let s = state;
  for (let i = 0; i < count; i++) {
    const team: Team = i % 2 === 0 ? "A" : "B";
    s = winGame(s, team);
  }
  return s;
}

const goldenPointConfig: MatchConfig = {
  sets: 3,
  scoringMode: "goldenPoint",
  superTieBreak: false,
};

const advantageConfig: MatchConfig = {
  sets: 3,
  scoringMode: "advantage",
  superTieBreak: false,
};

const starPointConfig: MatchConfig = {
  sets: 3,
  scoringMode: "starPoint",
  superTieBreak: false,
};

describe("regular game scoring", () => {
  it("advances point 0 to 15", () => {
    const m = createMatch(goldenPointConfig);
    const s = scorePoint(m, TEAM.A);
    expect(s.score.A.points).toBe("15");
  });

  it("point progression 0→15→30→40", () => {
    const m = createMatch(goldenPointConfig);
    const s = playPoints(m, "A", 3);
    expect(s.score.A.points).toBe("40");
  });

  it("wins game with 4 straight points", () => {
    const m = createMatch(goldenPointConfig);
    const s = winGame(m, "A");
    expect(s.score.A.games).toBe(1);
    expect(s.score.A.points).toBe("0");
    expect(s.score.B.points).toBe("0");
  });

  it("toggles serve on game won", () => {
    const m = createMatch(goldenPointConfig);
    expect(m.serving).toBe("A");
    const s = winGame(m, "A");
    expect(s.serving).toBe("B");
  });

  it("does not mutate original state", () => {
    const m = createMatch(goldenPointConfig);
    scorePoint(m, TEAM.A);
    expect(m.score.A.points).toBe("0");
  });

  it("throws on finished match", () => {
    const m = createMatch(goldenPointConfig);
    const finished = winSet(winSet(m, "A"), "A");
    expect(finished.phase).toBe("finished");
    expect(() => scorePoint(finished, TEAM.A)).toThrow();
  });

  it("history grows by 1 per point", () => {
    const m = createMatch(goldenPointConfig);
    const s1 = scorePoint(m, TEAM.A);
    const s2 = scorePoint(s1, TEAM.B);
    const s3 = scorePoint(s2, TEAM.A);
    expect(s3.history.length).toBe(3);
  });
});

describe("golden point deuce", () => {
  it("at 40-40 scoring team wins game immediately", () => {
    const m = createMatch(goldenPointConfig);
    const deuce = toDeuce(m);
    expect(deuce.score.A.points).toBe("40");
    expect(deuce.score.B.points).toBe("40");
    const s = scorePoint(deuce, TEAM.A);
    expect(s.score.A.games).toBe(1);
    expect(s.score.A.points).toBe("0");
    expect(s.score.B.points).toBe("0");
  });

  it("either team can win at deuce", () => {
    const m = createMatch(goldenPointConfig);
    const deuce = toDeuce(m);
    const s = scorePoint(deuce, TEAM.B);
    expect(s.score.B.games).toBe(1);
  });
});

describe("advantage deuce", () => {
  it("at 40-40 scorer gets AD", () => {
    const m = createMatch(advantageConfig);
    const deuce = toDeuce(m);
    const s = scorePoint(deuce, TEAM.A);
    expect(s.score.A.points).toBe("AD");
    expect(s.score.B.points).toBe("40");
  });

  it("AD holder wins next point wins game", () => {
    const m = createMatch(advantageConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.A);
    s = scorePoint(s, TEAM.A);
    expect(s.score.A.games).toBe(1);
  });

  it("non-AD team wins returns to deuce", () => {
    const m = createMatch(advantageConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.A);
    expect(s.score.A.points).toBe("AD");
    s = scorePoint(s, TEAM.B);
    expect(s.score.A.points).toBe("40");
    expect(s.score.B.points).toBe("40");
  });

  it("multiple deuce cycles", () => {
    const m = createMatch(advantageConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.A); // AD A
    s = scorePoint(s, TEAM.B); // deuce
    s = scorePoint(s, TEAM.B); // AD B
    s = scorePoint(s, TEAM.A); // deuce
    s = scorePoint(s, TEAM.A); // AD A
    s = scorePoint(s, TEAM.A); // win
    expect(s.score.A.games).toBe(1);
  });
});

describe("star point deuce", () => {
  it("win before deuce", () => {
    const m = createMatch(starPointConfig);
    const s = winGame(m, "A");
    expect(s.score.A.games).toBe(1);
    expect(s.gameDeuceState?.failedAdvantageResets).toBe(0);
  });

  it("first advantage converts", () => {
    const m = createMatch(starPointConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.A); // AD
    s = scorePoint(s, TEAM.A); // win
    expect(s.score.A.games).toBe(1);
    expect(s.gameDeuceState?.failedAdvantageResets).toBe(0);
  });

  it("first advantage lost second converts", () => {
    const m = createMatch(starPointConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.A); // AD A
    s = scorePoint(s, TEAM.B); // deuce, failed=1
    expect(s.gameDeuceState?.failedAdvantageResets).toBe(1);
    s = scorePoint(s, TEAM.A); // AD A
    s = scorePoint(s, TEAM.A); // win
    expect(s.score.A.games).toBe(1);
  });

  it("star point triggers after 2 failed advantages", () => {
    const m = createMatch(starPointConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.A); // AD A
    s = scorePoint(s, TEAM.B); // deuce, failed=1
    s = scorePoint(s, TEAM.B); // AD B
    s = scorePoint(s, TEAM.A); // deuce, failed=2
    expect(s.gameDeuceState?.failedAdvantageResets).toBe(2);
    s = scorePoint(s, TEAM.A); // 40-40, sudden death → wins game
    expect(s.score.A.games).toBe(1);
    expect(s.score.A.points).toBe("0");
  });

  it("after failed=2 no AD awarded", () => {
    const m = createMatch(starPointConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.A); // AD A
    s = scorePoint(s, TEAM.B); // deuce, failed=1
    s = scorePoint(s, TEAM.B); // AD B
    s = scorePoint(s, TEAM.A); // deuce, failed=2
    s = scorePoint(s, TEAM.A); // sudden death → game won, no AD
    expect(s.score.A.points).not.toBe("AD");
    expect(s.score.A.games).toBe(1);
  });

  it("counter increments only on AD→deuce", () => {
    const m = createMatch(starPointConfig);
    const deuce = toDeuce(m);
    const withAD = scorePoint(deuce, TEAM.A); // AD A
    expect(withAD.gameDeuceState?.failedAdvantageResets).toBe(0);
    const backToDeuce = scorePoint(withAD, TEAM.B); // deuce
    expect(backToDeuce.gameDeuceState?.failedAdvantageResets).toBe(1);
  });

  it("counter resets when game won", () => {
    const m = createMatch(starPointConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.A); // AD
    s = scorePoint(s, TEAM.B); // deuce, failed=1
    s = scorePoint(s, TEAM.A); // AD
    s = scorePoint(s, TEAM.A); // win
    expect(s.gameDeuceState?.failedAdvantageResets).toBe(0);
  });

  it("both teams can trigger star point", () => {
    const m = createMatch(starPointConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.B); // AD B
    s = scorePoint(s, TEAM.A); // deuce, failed=1
    s = scorePoint(s, TEAM.A); // AD A
    s = scorePoint(s, TEAM.B); // deuce, failed=2
    s = scorePoint(s, TEAM.B); // sudden death → B wins
    expect(s.score.B.games).toBe(1);
  });
});

describe("set scoring", () => {
  it("wins set at 6-0", () => {
    const m = createMatch(goldenPointConfig);
    const s = winSet(m, "A");
    expect(s.score.A.sets).toBe(1);
    expect(s.score.A.games).toBe(0);
    expect(s.score.B.games).toBe(0);
  });

  it("wins set 7-5", () => {
    const m = createMatch(goldenPointConfig);
    let s = alternateGames(m, 10); // 5-5
    s = winGame(s, "A"); // 6-5
    s = winGame(s, "A"); // 7-5
    expect(s.score.A.sets).toBe(1);
    expect(s.score.A.games).toBe(0);
    expect(s.score.B.games).toBe(0);
  });

  it("at 6-6 tie-break starts", () => {
    const m = createMatch(goldenPointConfig);
    const s = alternateGames(m, 12); // 6-6
    expect(s.phase).toBe("tieBreak");
    expect(s.tieBreak?.target).toBe(7);
  });

  it("win match best of 3", () => {
    const m = createMatch(goldenPointConfig);
    let s = winSet(m, "A");
    s = winSet(s, "A");
    expect(s.phase).toBe("finished");
    expect(s.winner).toBe("A");
  });

  it("setGames tracks all sets", () => {
    const m = createMatch(goldenPointConfig);
    const s = winSet(m, "A");
    expect(s.score.A.setGames).toContain(6);
    expect(s.score.B.setGames).toContain(0);
  });
});

describe("announcements", () => {
  it("announce is null at start", () => {
    const m = createMatch(goldenPointConfig);
    expect(m.announce).toBeNull();
  });

  it("Fifteen — Love", () => {
    const m = createMatch(goldenPointConfig);
    const s = scorePoint(m, TEAM.A);
    expect(s.announce).toBe("Fifteen — Love");
  });

  it("Thirty all", () => {
    const m = createMatch(goldenPointConfig);
    let s = scorePoint(m, TEAM.A);
    s = scorePoint(s, TEAM.B);
    s = scorePoint(s, TEAM.A);
    s = scorePoint(s, TEAM.B);
    expect(s.announce).toBe("Thirty all");
  });

  it("Deuce at 40-40", () => {
    const m = createMatch(advantageConfig);
    const deuce = toDeuce(m);
    expect(deuce.announce).toBe("Deuce");
  });

  it("Advantage for server", () => {
    const config: MatchConfig = {
      ...advantageConfig,
      teamNames: { A: "Alpha", B: "Beta" },
    };
    const m = createMatch(config);
    const deuce = toDeuce(m);
    const s = scorePoint(deuce, TEAM.A);
    expect(s.announce).toBe("Advantage Alpha");
  });

  it("Advantage for receiver", () => {
    const config: MatchConfig = {
      ...advantageConfig,
      teamNames: { A: "Alpha", B: "Beta" },
    };
    const m = createMatch(config);
    const deuce = toDeuce(m);
    const s = scorePoint(deuce, TEAM.B);
    expect(s.announce).toBe("Advantage Beta");
  });

  it("Game announcement", () => {
    const m = createMatch(goldenPointConfig);
    const s = winGame(m, "A");
    expect(s.announce).toContain("Game");
  });

  it("tie-break numeric announcement", () => {
    const m = createMatch(goldenPointConfig);
    const atTB = alternateGames(m, 12); // 6-6 tiebreak
    const s = scorePoint(atTB, TEAM.A);
    expect(s.announce).toContain("—");
  });

  it("uses team names", () => {
    const config: MatchConfig = {
      ...goldenPointConfig,
      teamNames: { A: "Alpha", B: "Beta" },
    };
    const m = createMatch(config);
    const s = winGame(m, "A");
    expect(s.announce).toContain("Alpha");
  });
});

describe("integration", () => {
  it("complete 6-0 6-0 match", () => {
    const m = createMatch(goldenPointConfig);
    let s = winSet(m, "A");
    s = winSet(s, "A");
    expect(s.phase).toBe("finished");
    expect(s.winner).toBe("A");
    expect(s.score.A.sets).toBe(2);
  });

  it("match going to final-set super tie-break", () => {
    const config: MatchConfig = {
      sets: 3,
      scoringMode: "goldenPoint",
      superTieBreak: true,
    };
    const m = createMatch(config);
    let s = winSet(m, "A"); // set 1: A 6-0
    s = winSet(s, "B"); // set 2: B 6-0 → super tie-break replaces the final set
    expect(s.phase).toBe("superTieBreak");
    expect(s.tieBreak?.target).toBe(10);
    s = playPoints(s, "A", 10); // win super tie-break 10-0
    expect(s.phase).toBe("finished");
    expect(s.winner).toBe("A");
  });

  it("star point game with all three stages", () => {
    const m = createMatch(starPointConfig);
    const deuce = toDeuce(m);
    let s = scorePoint(deuce, TEAM.A); // AD A (stage 1)
    s = scorePoint(s, TEAM.B); // deuce, failed=1
    s = scorePoint(s, TEAM.B); // AD B (stage 2)
    s = scorePoint(s, TEAM.A); // deuce, failed=2
    expect(s.gameDeuceState?.failedAdvantageResets).toBe(2);
    s = scorePoint(s, TEAM.B); // sudden death (stage 3) → B wins
    expect(s.score.B.games).toBe(1);
  });
});

describe("setScoringMode", () => {
  it("returns the same state when the mode already matches", () => {
    const m = createMatch(goldenPointConfig);
    expect(setScoringMode(m, "goldenPoint")).toBe(m);
  });

  it("is a no-op on a finished match", () => {
    let s = createMatch(goldenPointConfig);
    s = winSet(s, "A");
    s = winSet(s, "A");
    expect(s.phase).toBe("finished");
    expect(setScoringMode(s, "advantage")).toBe(s);
  });

  it("rewrites only the scoring mode, keeping score, phase, serve and history", () => {
    const m = scorePoint(scorePoint(createMatch(goldenPointConfig), TEAM.A), TEAM.B);
    const s = setScoringMode(m, "advantage");
    expect(s.config).toEqual({ ...goldenPointConfig, scoringMode: "advantage" });
    expect(s.score).toBe(m.score);
    expect(s.phase).toBe(m.phase);
    expect(s.serving).toBe(m.serving);
    expect(s.history).toBe(m.history); // not undoable on its own
  });

  it("applies the new mode from the next point: golden point → advantage at deuce", () => {
    const deuce = toDeuce(createMatch(goldenPointConfig));
    expect(deuce.score.A.points).toBe("40");
    expect(deuce.score.B.points).toBe("40");

    // Still golden point: the next point wins the game outright.
    expect(scorePoint(deuce, TEAM.A).score.A.games).toBe(1);

    // Switched to advantage: the same point only earns AD.
    const asAdvantage = setScoringMode(deuce, "advantage");
    const afterPoint = scorePoint(asAdvantage, TEAM.A);
    expect(afterPoint.score.A.points).toBe("AD");
    expect(afterPoint.score.A.games).toBe(0);
  });

  it("seeds the star-point deuce counter when switching to star point, and drops it when leaving", () => {
    const m = createMatch(goldenPointConfig);
    expect(m.gameDeuceState).toBeUndefined();

    const star = setScoringMode(m, "starPoint");
    expect(star.gameDeuceState).toEqual({ failedAdvantageResets: 0 });
    expect(star.gameDeuceState).toEqual(createMatch(starPointConfig).gameDeuceState);

    const back = setScoringMode(star, "goldenPoint");
    expect(back.gameDeuceState).toBeUndefined();
  });

  it("resets the deuce counter when the mode is re-entered mid-game", () => {
    let s = toDeuce(createMatch(starPointConfig));
    s = scorePoint(s, TEAM.A); // AD A
    s = scorePoint(s, TEAM.B); // deuce, failed=1
    expect(s.gameDeuceState?.failedAdvantageResets).toBe(1);
    // Leaving and re-entering star point behaves like a fresh game under it.
    s = setScoringMode(setScoringMode(s, "advantage"), "starPoint");
    expect(s.gameDeuceState).toEqual({ failedAdvantageResets: 0 });
  });

  it("star point switched on mid-game reaches sudden death after two failed advantages", () => {
    const deuce = toDeuce(createMatch(advantageConfig));
    let s = setScoringMode(deuce, "starPoint");
    s = scorePoint(s, TEAM.A); // AD A
    s = scorePoint(s, TEAM.B); // deuce, failed=1
    s = scorePoint(s, TEAM.B); // AD B
    s = scorePoint(s, TEAM.A); // deuce, failed=2
    expect(s.gameDeuceState?.failedAdvantageResets).toBe(2);
    s = scorePoint(s, TEAM.A); // sudden death
    expect(s.score.A.games).toBe(1);
  });
});
