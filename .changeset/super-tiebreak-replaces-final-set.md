---
"@zhuravlev-biz/padel-score-engine": minor
---

Super tie-break now replaces the final set. When `superTieBreak` is enabled and the set score becomes level going into the decider (1-1 in best of 3, 2-2 in best of 5), a 10-point super tie-break starts immediately instead of a full final set. If the flag is enabled mid-match after the final set has already started as a full set, that set continues and a super tie-break is played at 6-6 in place of a regular tie-break.
