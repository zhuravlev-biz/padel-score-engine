import { opponent } from "./serve.js";
import type { Team, TieBreakState } from "./types.js";

export function initTieBreak(target: number, initialServer: Team): TieBreakState {
  return { A: 0, B: 0, target, initialServer };
}

export function scoreTieBreakPoint(
  tb: TieBreakState,
  team: Team,
): { tieBreak: TieBreakState; won: boolean; winner: Team | null } {
  const tieBreak: TieBreakState = {
    ...tb,
    [team]: tb[team] + 1,
  };

  const won = tieBreak[team] >= tieBreak.target && tieBreak[team] - tieBreak[opponent(team)] >= 2;

  return { tieBreak, won, winner: won ? team : null };
}
