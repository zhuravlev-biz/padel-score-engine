import type { GamePoint, MatchState } from "./types.js";

export type ServingSide = "right" | "left";

const POINT_VALUE: Record<GamePoint, number> = {
  "0": 0,
  "15": 1,
  "30": 2,
  "40": 3,
  AD: 4,
};

export function getServingSide({ phase, tieBreak, score }: Readonly<MatchState>): ServingSide {
  if (phase === "finished") return "right";

  if (tieBreak) {
    const total = tieBreak.A + tieBreak.B;
    return total % 2 === 0 ? "right" : "left";
  }

  const {
    A: { points: a },
    B: { points: b },
  } = score;

  if (a === "40" && b === "40") return "right";
  if (a === "AD" || b === "AD") return "left";

  const total = POINT_VALUE[a] + POINT_VALUE[b];
  return total % 2 === 0 ? "right" : "left";
}
