import type { MatchState } from "./types.js";

export function undoLastPoint({ history }: Readonly<MatchState>): Readonly<MatchState> {
  const previous = history[history.length - 1];
  if (!previous) {
    throw new Error("No history to undo");
  }
  return previous;
}
