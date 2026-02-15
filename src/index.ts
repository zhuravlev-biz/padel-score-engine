export { TEAM } from "./types.js";
export type {
  Team,
  ScoringMode,
  GamePoint,
  MatchConfig,
  TeamScore,
  Score,
  MatchPhase,
  TieBreakState,
  GameDeuceState,
  MatchState,
} from "./types.js";

export { createMatch } from "./match.js";
export { scorePoint } from "./scoring.js";
export { undoLastPoint } from "./undo.js";
export { formatAnnouncement } from "./announce.js";
export { getServingSide } from "./serve-side.js";
export type { ServingSide } from "./serve-side.js";
