import type { MatchState } from "./types.js";

function teamLabel(state: Readonly<MatchState>): string {
  const team = state.serving;
  return state.config.teamNames?.[team] ?? `Team ${team}`;
}

export function formatAnnouncement(
  state: Readonly<MatchState>,
  options?: { includeServing?: boolean },
): string | null {
  if (!state.announce) return null;
  if (!options?.includeServing) return state.announce;
  return `${state.announce} (${teamLabel(state)} serving)`;
}
