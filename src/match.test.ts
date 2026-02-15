import { createMatch } from "./match.js";

describe("createMatch", () => {
  it("creates golden point match with correct defaults", () => {
    const match = createMatch({ sets: 3, scoringMode: "goldenPoint", superTieBreak: true });

    expect(match.score.A.points).toBe("0");
    expect(match.score.A.games).toBe(0);
    expect(match.score.A.sets).toBe(0);
    expect(match.score.A.setGames).toEqual([0]);

    expect(match.score.B.points).toBe("0");
    expect(match.score.B.games).toBe(0);
    expect(match.score.B.sets).toBe(0);
    expect(match.score.B.setGames).toEqual([0]);

    expect(match.phase).toBe("inProgress");
    expect(match.serving).toBe("A");
    expect(match.tieBreak).toBeNull();
    expect(match.gameDeuceState).toBeUndefined();
    expect(match.winner).toBeNull();
    expect(match.announce).toBeNull();
    expect(match.history.length).toBe(0);
  });

  it("creates star point match with gameDeuceState", () => {
    const match = createMatch({ sets: 3, scoringMode: "starPoint", superTieBreak: true });

    expect(match.gameDeuceState).toEqual({ failedAdvantageResets: 0 });
  });

  it("creates advantage match without gameDeuceState", () => {
    const match = createMatch({ sets: 3, scoringMode: "advantage", superTieBreak: true });

    expect(match.gameDeuceState).toBeUndefined();
  });

  it("creates best-of-5 match", () => {
    const match = createMatch({ sets: 5, scoringMode: "goldenPoint", superTieBreak: true });

    expect(match.config.sets).toBe(5);
  });

  it("preserves team names", () => {
    const match = createMatch({
      sets: 3,
      scoringMode: "goldenPoint",
      superTieBreak: true,
      teamNames: { A: "Alpha", B: "Beta" },
    });

    expect(match.config.teamNames).toEqual({ A: "Alpha", B: "Beta" });
  });

  it("defaults first server to A", () => {
    const match = createMatch({ sets: 3, scoringMode: "goldenPoint", superTieBreak: false });
    expect(match.serving).toBe("A");
  });

  it("respects firstServer option", () => {
    const match = createMatch({
      sets: 3,
      scoringMode: "goldenPoint",
      superTieBreak: false,
      firstServer: "B",
    });
    expect(match.serving).toBe("B");
  });
});
