import type { Team } from "./types.js";

export function opponent(team: Team): Team {
  return team === "A" ? "B" : "A";
}

export function toggleServe(serving: Team): Team {
  return opponent(serving);
}

export function tieBreakServer(initialServer: Team, totalPoints: number): Team {
  if (totalPoints === 0) return initialServer;
  return Math.floor((totalPoints - 1) / 2) % 2 === 0 ? opponent(initialServer) : initialServer;
}
