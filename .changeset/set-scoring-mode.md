---
"@zhuravlev-biz/padel-score-engine": minor
---

New export: `setScoringMode(state, mode)` — flips `config.scoringMode` on a live match. The new rules apply from the next point and the current points stand; `gameDeuceState` is reset to the shape `createMatch` produces for the new mode (star point restarts its failed-advantage counter at zero). Same contract as `setSuperTieBreak`: no history snapshot, no-op on a finished match or when the mode already matches.
