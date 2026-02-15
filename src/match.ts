import type { MatchConfig, MatchState } from "./types.js";

export function createMatch(config: MatchConfig): MatchState {
  return {
    config,
    score: {
      A: { points: "0", games: 0, sets: 0, setGames: [0] },
      B: { points: "0", games: 0, sets: 0, setGames: [0] },
    },
    phase: "inProgress",
    serving: config.firstServer ?? "A",
    tieBreak: null,
    gameDeuceState: config.scoringMode === "starPoint" ? { failedAdvantageResets: 0 } : undefined,
    winner: null,
    announce: null,
    history: [],
  };
}
