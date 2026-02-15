import { formatAnnouncement } from "./announce.js";
import { createMatch } from "./match.js";
import { scorePoint } from "./scoring.js";
import { TEAM } from "./types.js";
import type { MatchConfig } from "./types.js";

const config: MatchConfig = {
  sets: 3,
  scoringMode: "goldenPoint",
  superTieBreak: false,
  teamNames: { A: "Alpha", B: "Beta" },
};

describe("formatAnnouncement", () => {
  it("returns null when announce is null", () => {
    const m = createMatch(config);
    expect(formatAnnouncement(m)).toBeNull();
    expect(formatAnnouncement(m, { includeServing: true })).toBeNull();
  });

  it("returns bare announce without option", () => {
    const s = scorePoint(createMatch(config), TEAM.A);
    expect(formatAnnouncement(s)).toBe("Fifteen — Love");
  });

  it("appends serving info when includeServing is true", () => {
    const s = scorePoint(createMatch(config), TEAM.A);
    expect(formatAnnouncement(s, { includeServing: true })).toBe("Fifteen — Love (Alpha serving)");
  });

  it("uses correct server after serve toggle", () => {
    let s = createMatch(config);
    for (let i = 0; i < 4; i++) s = scorePoint(s, TEAM.A); // win game, serve toggles to B
    const next = scorePoint(s, TEAM.B);
    expect(formatAnnouncement(next, { includeServing: true })).toBe(
      "Fifteen — Love (Beta serving)",
    );
  });

  it("falls back to Team X without teamNames", () => {
    const plain: MatchConfig = { sets: 3, scoringMode: "goldenPoint", superTieBreak: false };
    const s = scorePoint(createMatch(plain), TEAM.A);
    expect(formatAnnouncement(s, { includeServing: true })).toBe("Fifteen — Love (Team A serving)");
  });
});
