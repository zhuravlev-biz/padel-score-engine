export type Team = "teamA" | "teamB";

export type ScoringMode = "goldenPoint" | "advantage";

export type GamePoint = "0" | "15" | "30" | "40" | "AD";

export interface MatchConfig {
  sets: 3 | 5;
  scoringMode: ScoringMode;
  superTieBreak: boolean;
  teamNames?: { teamA: string; teamB: string };
}

export interface TeamScore {
  points: GamePoint;
  games: number;
  sets: number;
  setGames: number[];
}

export interface Score {
  teamA: TeamScore;
  teamB: TeamScore;
}

export type MatchPhase = "inProgress" | "tieBreak" | "superTieBreak" | "finished";

export interface TieBreakState {
  teamA: number;
  teamB: number;
  target: number; // 7 for tie-break, 10 for super tie-break
}

export interface MatchState {
  config: MatchConfig;
  score: Score;
  phase: MatchPhase;
  serving: Team;
  tieBreak: TieBreakState | null;
  winner: Team | null;
  announce: string | null;
  history: MatchState[];
}
