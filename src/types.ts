export const TEAM = Object.freeze({ A: "A", B: "B" } as const);

export type Team = (typeof TEAM)[keyof typeof TEAM];

export type ScoringMode = "goldenPoint" | "advantage" | "starPoint";

export type GamePoint = "0" | "15" | "30" | "40" | "AD";

export interface MatchConfig {
  sets: 3 | 5;
  scoringMode: ScoringMode;
  superTieBreak: boolean;
  teamNames?: { A: string; B: string };
  firstServer?: Team;
}

export interface TeamScore {
  points: GamePoint;
  games: number;
  sets: number;
  setGames: number[];
}

export interface Score {
  A: TeamScore;
  B: TeamScore;
}

export type MatchPhase = "inProgress" | "tieBreak" | "superTieBreak" | "finished";

export interface TieBreakState {
  A: number;
  B: number;
  target: number; // 7 for tie-break, 10 for super tie-break
  initialServer: Team;
}

export interface GameDeuceState {
  failedAdvantageResets: 0 | 1 | 2;
}

export interface MatchState {
  config: MatchConfig;
  score: Score;
  phase: MatchPhase;
  serving: Team;
  tieBreak: TieBreakState | null;
  gameDeuceState: GameDeuceState | undefined;
  winner: Team | null;
  announce: string | null;
  history: MatchState[];
}
