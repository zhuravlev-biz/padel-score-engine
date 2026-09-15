# padel-score-engine

## 1.2.0

### Minor Changes

- 7189386: New export: `setScoringMode(state, mode)` — flips `config.scoringMode` on a live match. The new rules apply from the next point and the current points stand; `gameDeuceState` is reset to the shape `createMatch` produces for the new mode (star point restarts its failed-advantage counter at zero). Same contract as `setSuperTieBreak`: no history snapshot, no-op on a finished match or when the mode already matches.

## 1.1.0

### Minor Changes

- effcf7f: Super tie-break now replaces the final set. When `superTieBreak` is enabled and the set score becomes level going into the decider (1-1 in best of 3, 2-2 in best of 5), a 10-point super tie-break starts immediately instead of a full final set. If the flag is enabled mid-match after the final set has already started as a full set, that set continues and a super tie-break is played at 6-6 in place of a regular tie-break.

  New export: `setSuperTieBreak(state, enabled)` — flips the option on a live match, converting a pristine decider (or pristine decider tie-break) between full-set and super tie-break form in both directions.

## Changelog
