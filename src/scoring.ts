import { opponent, tieBreakServer, toggleServe } from "./serve.js";
import { initTieBreak, scoreTieBreakPoint } from "./tiebreak.js";
import type { GamePoint, MatchState, Score, Team, TeamScore } from "./types.js";

const NEXT_POINT: Record<string, GamePoint> = {
  "0": "15",
  "15": "30",
  "30": "40",
};

const POINT_NAME: Record<GamePoint, string> = {
  "0": "Love",
  "15": "Fifteen",
  "30": "Thirty",
  "40": "Forty",
  AD: "AD",
};

function pointName(p: GamePoint): string {
  return POINT_NAME[p];
}

function teamLabel(state: Readonly<MatchState>, team: Team): string {
  return state.config.teamNames?.[team] ?? `Team ${team}`;
}

function announcePoint(state: Readonly<MatchState>): string {
  const server = state.serving;
  const receiver = opponent(server);
  const serverPoints = state.score[server].points;
  const receiverPoints = state.score[receiver].points;

  if (serverPoints === "AD") return `Advantage ${teamLabel(state, server)}`;
  if (receiverPoints === "AD") return `Advantage ${teamLabel(state, receiver)}`;

  if (serverPoints !== receiverPoints)
    return `${pointName(serverPoints)} — ${pointName(receiverPoints)}`;

  return serverPoints === "40" ? "Deuce" : `${pointName(serverPoints)} all`;
}

function announceTieBreak(state: Readonly<MatchState>): string {
  const tb = state.tieBreak;
  if (!tb) return "";
  const server = state.serving;
  const receiver = opponent(server);
  return `${tb[server]} — ${tb[receiver]}`;
}

function updateTeamScore(score: Score, team: Team, update: Partial<TeamScore>): Score {
  return {
    ...score,
    [team]: { ...score[team], ...update },
  };
}

function initialDeuceState(state: Readonly<MatchState>): MatchState["gameDeuceState"] {
  return state.config.scoringMode === "starPoint" ? { failedAdvantageResets: 0 } : undefined;
}

function isFinalSet(state: Readonly<MatchState>): boolean {
  const required = state.config.sets === 5 ? 3 : 2;
  return state.score.A.sets === required - 1 && state.score.B.sets === required - 1;
}

function winMatch(state: Readonly<MatchState>, team: Team): Readonly<MatchState> {
  return {
    ...state,
    phase: "finished",
    winner: team,
    announce: `Game, set and match ${teamLabel(state, team)}`,
  };
}

function winSet(state: Readonly<MatchState>, team: Team): Readonly<MatchState> {
  const required = state.config.sets === 5 ? 3 : 2;
  const newSets = state.score[team].sets + 1;

  const {
    A: { games: gamesA, setGames: setGamesA, sets: setsA },
    B: { games: gamesB, setGames: setGamesB, sets: setsB },
  } = state.score;

  const newScore: Score = {
    A: {
      points: "0",
      games: 0,
      sets: setsA + (team === "A" ? 1 : 0),
      setGames: [...setGamesA.slice(0, -1), gamesA, 0],
    },
    B: {
      points: "0",
      games: 0,
      sets: setsB + (team === "B" ? 1 : 0),
      setGames: [...setGamesB.slice(0, -1), gamesB, 0],
    },
  };

  const next: MatchState = {
    ...state,
    score: newScore,
    gameDeuceState: initialDeuceState(state),
  };

  if (newSets >= required) {
    return winMatch(next, team);
  }

  return {
    ...next,
    announce: `Set ${teamLabel(state, team)}`,
  };
}

function checkSetWon(state: Readonly<MatchState>, team: Team): Readonly<MatchState> | null {
  const teamGames = state.score[team].games;
  const otherGames = state.score[opponent(team)].games;

  if (teamGames >= 6 && teamGames - otherGames >= 2) {
    return winSet(state, team);
  }

  if (teamGames === 6 && otherGames === 6) {
    const finalSet = isFinalSet(state);
    const isSuperTB = finalSet && state.config.superTieBreak;
    const target = isSuperTB ? 10 : 7;
    const phase = isSuperTB ? "superTieBreak" : "tieBreak";

    return {
      ...state,
      phase,
      tieBreak: initTieBreak(target, state.serving),
      announce: null,
    };
  }

  return null;
}

function winGame(state: MatchState, team: Team): Readonly<MatchState> {
  const other = opponent(team);
  const newGames = state.score[team].games + 1;

  let newScore = updateTeamScore(state.score, team, {
    points: "0",
    games: newGames,
    setGames: [...state.score[team].setGames.slice(0, -1), newGames],
  });
  newScore = updateTeamScore(newScore, other, { points: "0" });

  const afterGame: MatchState = {
    ...state,
    score: newScore,
    serving: toggleServe(state.serving),
    gameDeuceState: initialDeuceState(state),
    announce: `Game ${teamLabel(state, team)}`,
  };

  const setResult = checkSetWon(afterGame, team);
  return setResult ?? afterGame;
}

function isSuddenDeath(state: MatchState): boolean {
  const mode = state.config.scoringMode;
  return (
    mode === "goldenPoint" ||
    (mode === "starPoint" && state.gameDeuceState?.failedAdvantageResets === 2)
  );
}

const NEXT_FAILED: Record<0 | 1 | 2, 0 | 1 | 2> = { 0: 1, 1: 2, 2: 2 };

function bumpFailedResets(state: MatchState): MatchState["gameDeuceState"] {
  if (state.config.scoringMode !== "starPoint") return state.gameDeuceState;
  const cur = state.gameDeuceState?.failedAdvantageResets ?? 0;
  return { failedAdvantageResets: NEXT_FAILED[cur] };
}

function scoreDeuce(state: MatchState, team: Team): Readonly<MatchState> {
  const other = opponent(team);
  const teamPoints = state.score[team].points;
  const otherPoints = state.score[other].points;

  if (teamPoints === "AD") {
    return winGame(state, team);
  }

  if (otherPoints === "AD") {
    let newScore = updateTeamScore(state.score, team, { points: "40" });
    newScore = updateTeamScore(newScore, other, { points: "40" });
    return {
      ...state,
      score: newScore,
      gameDeuceState: bumpFailedResets(state),
      announce: "Deuce",
    };
  }

  if (teamPoints === "40" && otherPoints === "40") {
    if (isSuddenDeath(state)) {
      return winGame(state, team);
    }
    const newScore = updateTeamScore(state.score, team, { points: "AD" });
    return {
      ...state,
      score: newScore,
      announce: announcePoint({ ...state, score: newScore }),
    };
  }

  throw new Error(
    `scoreDeuce called in invalid state: team=${team} teamPoints=${teamPoints} otherPoints=${otherPoints}`,
  );
}

function isDeuce(teamPoints: GamePoint, otherPoints: GamePoint): boolean {
  return (
    teamPoints === "AD" || otherPoints === "AD" || (teamPoints === "40" && otherPoints === "40")
  );
}

function scoreRegularPoint(state: MatchState, team: Team): Readonly<MatchState> {
  const teamPoints = state.score[team].points;
  const otherPoints = state.score[opponent(team)].points;

  if (teamPoints === "40" && otherPoints !== "40" && otherPoints !== "AD") {
    return winGame(state, team);
  }

  if (isDeuce(teamPoints, otherPoints)) {
    return scoreDeuce(state, team);
  }

  const nextPoint = NEXT_POINT[teamPoints];
  if (!nextPoint) return state;

  const newScore = updateTeamScore(state.score, team, { points: nextPoint });
  return {
    ...state,
    score: newScore,
    announce: announcePoint({ ...state, score: newScore }),
  };
}

function scoreTieBreak(state: MatchState, team: Team): Readonly<MatchState> {
  if (!state.tieBreak) return state;

  const tb = state.tieBreak;
  const pointserverPointslayed = tb.A + tb.B + 1;
  const result = scoreTieBreakPoint(tb, team);

  if (result.won && result.winner) {
    const afterTBServer = opponent(tb.initialServer);
    const winner = result.winner;
    const newGames = state.score[winner].games + 1;

    const other = opponent(winner);
    let newScore = updateTeamScore(state.score, winner, {
      points: "0",
      games: newGames,
      setGames: [...state.score[winner].setGames.slice(0, -1), newGames],
    });
    newScore = updateTeamScore(newScore, other, { points: "0" });

    const afterTB: MatchState = {
      ...state,
      score: newScore,
      tieBreak: null,
      phase: "inProgress",
      serving: afterTBServer,
      gameDeuceState: initialDeuceState(state),
    };

    return winSet(afterTB, winner);
  }

  const nextServer = tieBreakServer(tb.initialServer, pointserverPointslayed);
  const nextState: MatchState = {
    ...state,
    tieBreak: result.tieBreak,
    serving: nextServer,
    announce: announceTieBreak({ ...state, tieBreak: result.tieBreak, serving: nextServer }),
  };
  return nextState;
}

export function scorePoint(state: MatchState, team: Team): Readonly<MatchState> {
  if (state.phase === "finished") {
    throw new Error("Match is already finished");
  }

  const withHistory: MatchState = {
    ...state,
    history: [...state.history, state],
  };

  if (withHistory.phase === "tieBreak" || withHistory.phase === "superTieBreak") {
    return scoreTieBreak(withHistory, team);
  }

  return scoreRegularPoint(withHistory, team);
}
