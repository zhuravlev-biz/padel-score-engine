import { createMatch } from "./match.js";
import { scorePoint } from "./scoring.js";
import { getServingSide } from "./serve-side.js";
import { TEAM } from "./types.js";
import type { MatchConfig, MatchState, Team } from "./types.js";

function playPoints(state: MatchState, team: Team, count: number): MatchState {
  let s = state;
  for (let i = 0; i < count; i++) s = scorePoint(s, team);
  return s;
}

function winGame(state: MatchState, team: Team): MatchState {
  return playPoints(state, team, 4);
}

function toDeuce(state: MatchState): MatchState {
  let s = state;
  s = playPoints(s, TEAM.A, 3);
  s = playPoints(s, TEAM.B, 3);
  return s;
}

function alternateGames(state: MatchState, count: number): MatchState {
  let s = state;
  for (let i = 0; i < count; i++) {
    s = winGame(s, i % 2 === 0 ? "A" : "B");
  }
  return s;
}

const goldenPoint: MatchConfig = { sets: 3, scoringMode: "goldenPoint", superTieBreak: false };
const advantage: MatchConfig = { sets: 3, scoringMode: "advantage", superTieBreak: false };

describe("getServingSide", () => {
  it("right at 0-0", () => {
    expect(getServingSide(createMatch(goldenPoint))).toBe("right");
  });

  it("left at 15-0", () => {
    const s = scorePoint(createMatch(goldenPoint), TEAM.A);
    expect(getServingSide(s)).toBe("left");
  });

  it("right at 15-15", () => {
    let s = scorePoint(createMatch(goldenPoint), TEAM.A);
    s = scorePoint(s, TEAM.B);
    expect(getServingSide(s)).toBe("right");
  });

  it("left at 30-15", () => {
    let s = playPoints(createMatch(goldenPoint), TEAM.A, 2);
    s = scorePoint(s, TEAM.B);
    expect(getServingSide(s)).toBe("left");
  });

  it("left at 40-0", () => {
    const s = playPoints(createMatch(goldenPoint), TEAM.A, 3);
    expect(getServingSide(s)).toBe("left");
  });

  it("right at 40-15", () => {
    let s = playPoints(createMatch(goldenPoint), TEAM.A, 3);
    s = scorePoint(s, TEAM.B);
    expect(getServingSide(s)).toBe("right");
  });

  it("right at deuce (40-40)", () => {
    const s = toDeuce(createMatch(advantage));
    expect(getServingSide(s)).toBe("right");
  });

  it("left at advantage", () => {
    const s = scorePoint(toDeuce(createMatch(advantage)), TEAM.A);
    expect(s.score.A.points).toBe("AD");
    expect(getServingSide(s)).toBe("left");
  });

  it("right after AD lost (back to deuce)", () => {
    let s = scorePoint(toDeuce(createMatch(advantage)), TEAM.A); // AD A
    s = scorePoint(s, TEAM.B); // deuce
    expect(getServingSide(s)).toBe("right");
  });

  it("left after second AD", () => {
    let s = scorePoint(toDeuce(createMatch(advantage)), TEAM.A); // AD A
    s = scorePoint(s, TEAM.B); // deuce
    s = scorePoint(s, TEAM.B); // AD B
    expect(getServingSide(s)).toBe("left");
  });

  it("right at start of new game", () => {
    const s = winGame(createMatch(goldenPoint), TEAM.A);
    expect(getServingSide(s)).toBe("right");
  });

  it("right for finished match", () => {
    let s = createMatch(goldenPoint);
    for (let i = 0; i < 12; i++) s = winGame(s, TEAM.A);
    expect(s.phase).toBe("finished");
    expect(getServingSide(s)).toBe("right");
  });
});

describe("getServingSide tie-break", () => {
  it("right at 0-0 in tie-break", () => {
    const s = alternateGames(createMatch(goldenPoint), 12); // 6-6
    expect(s.phase).toBe("tieBreak");
    expect(getServingSide(s)).toBe("right");
  });

  it("left after 1 point in tie-break", () => {
    let s = alternateGames(createMatch(goldenPoint), 12);
    s = scorePoint(s, TEAM.A);
    expect(getServingSide(s)).toBe("left");
  });

  it("right after 2 points in tie-break", () => {
    let s = alternateGames(createMatch(goldenPoint), 12);
    s = scorePoint(s, TEAM.A);
    s = scorePoint(s, TEAM.B);
    expect(getServingSide(s)).toBe("right");
  });
});
