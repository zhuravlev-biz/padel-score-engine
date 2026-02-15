# Scoring Rules

This document describes the padel/tennis scoring rules implemented by `padel-score-engine`.

> **Official source:** [FIP Rules of Padel (PDF)](https://www.padelfip.com/wp-content/uploads/2025/12/FIP_Rules-of-Padel-1.pdf)
> published by the [International Padel Federation (FIP)](https://www.padelfip.com/).
>
> Star Point announcement: [Between innovation and tradition: introducing the "Star Point"](https://www.padelfip.com/2025/12/between-innovation-and-tradition-introducing-the-star-point-the-scoring-system-that-appeals-to-everyone/) — padelfip.com, December 2025.

## Point progression

Points within a game follow the traditional sequence:

| Point | Call |
|-------|------|
| 0 | Love |
| 1 | 15 (Fifteen) |
| 2 | 30 (Thirty) |
| 3 | 40 (Forty) |

When a team at 40 wins a point and the opponent is below 40, the team wins the game.
When both teams reach 40, the game is at **deuce** and resolution depends on the scoring mode.

## Scoring modes (deuce resolution)

### Golden Point

At deuce (40-40) the next point wins the game immediately. No advantage is awarded.
This is the default mode for padel.

### Advantage

At deuce the team that wins the next point receives **advantage** (AD).

- If the team with AD wins the following point → they win the game.
- If they lose → the score returns to deuce (40-40).

This cycle repeats indefinitely until one team converts their advantage.

### Star Point (FIP 2026)

Approved unanimously by the FIP General Assembly on 28 November 2025.
Applied in Premier Padel, CUPRA FIP Tour, FIP Promises, and FIP Beyond from the 2026 season.

When a regular game reaches deuce:

1. **First advantage** — normal advantage rules apply. Win the next point → win the game. Lose → back to deuce. (`failedAdvantageResets` goes from 0 to 1.)
2. **Second advantage** — identical to the first. Win → game. Lose → back to deuce. (`failedAdvantageResets` goes from 1 to 2.)
3. **Star Point** — a single decisive sudden-death point. The winner of this point wins the game. No advantage is awarded.

The `failedAdvantageResets` counter:

- Starts at 0 at the beginning of every game.
- Increments **only** when an advantage is lost (AD → deuce transition), not when advantage is gained.
- Resets to 0 when a game is won (`winGame()`).
- **Does not apply** to tie-breaks or super tie-breaks — only regular games.

## Winning a game

When a team wins a game:

1. Winner's game count increments by 1.
2. Both teams' points reset to `"0"`.
3. `gameDeuceState` resets (star point counter back to 0).
4. Serve passes to the other team.
5. Check whether the set has been won.

## Winning a set

A team wins a set when they have **≥ 6 games** and lead by **≥ 2 games** (e.g. 6-4, 7-5).

At **6-6** a tie-break begins — or a super tie-break in the final set if configured.

When a set is won:

1. Winner's set count increments.
2. Final game counts are recorded in `setGames` for both teams; new set entries begin.
3. Both teams' game counts reset to 0.
4. Check whether the match has been won.

## Winning the match

- **Best of 3** — first team to win 2 sets.
- **Best of 5** — first team to win 3 sets.

## Tie-break

Entered when both teams reach 6 games in a set (unless a super tie-break applies in the final set).

- Scored numerically: 0, 1, 2, 3, …
- Target: **7 points** with a **2-point lead** required.
- At 6-6 (or any subsequent equal score) play continues until one team leads by 2.
- Star Point mode does **not** apply — standard 2-point-lead rules always govern tie-breaks.

### Serve rotation in tie-break

- The team due to serve starts the tie-break (serves point 1).
- After point 1 the serve switches. Then it switches every 2 points thereafter.
- After the tie-break ends, the team that **received** the first point of the tie-break serves the first game of the next set.

## Super tie-break

Played instead of a regular tie-break in the **final set** when `superTieBreak` is enabled.

- Target: **10 points** with a **2-point lead** required.
- All other rules are identical to a regular tie-break.
- Winning the super tie-break wins the match.

## Serve rotation (regular games)

The serving team alternates after every game. Team A serves the first game of the match.

## Announcements

Point scores are announced using the server's score first:

| Score | Call |
|-------|------|
| 0-0 | "Love all" |
| 15-0 | "Fifteen — Love" |
| 15-15 | "Fifteen all" |
| 30-30 | "Thirty all" |
| 40-40 | "Deuce" |
| AD (server) | "Advantage in" or "Advantage {server name}" |
| AD (receiver) | "Advantage out" or "Advantage {receiver name}" |
| Game won | "Game {winner}" |
| Set won | "Set {winner}" |
| Match won | "Match {winner}" |

During tie-breaks, scores are announced numerically: `"{server points} — {receiver points}"`.

## Test cases

### Match creation (`match.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 1.1 | Create golden point match | All scores zero, phase `inProgress`, serving `teamA`, no tie-break, no winner, empty history, `gameDeuceState` is `undefined` |
| 1.2 | Create star point match | `gameDeuceState` is `{ failedAdvantageResets: 0 }` |
| 1.3 | Create advantage match | `gameDeuceState` is `undefined` |
| 1.4 | Create best-of-5 match | `config.sets === 5` |
| 1.5 | Preserve team names | `config.teamNames` stored correctly |

### Regular game scoring (`scoring.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 2.1 | Score one point from love | Points go `"0"` → `"15"` |
| 2.2 | Point progression 0→15→30→40 | Three points advance correctly |
| 2.3 | Win game with 4 straight points | Winner's games +1, points reset to `"0"`, serve toggles |
| 2.4 | State immutability | Original state unchanged after `scorePoint` |
| 2.5 | Score on finished match | Throws error |
| 2.6 | History grows by 1 per point | `history.length` increments |

### Golden point deuce (`scoring.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 3.1 | At 40-40 scoring team wins game | No AD, game ends immediately |
| 3.2 | Either team can win at deuce | Both teams produce correct results |

### Advantage deuce (`scoring.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 4.1 | At 40-40 scorer gets AD | Points show `"AD"` / `"40"` |
| 4.2 | AD holder wins next point | Game won |
| 4.3 | Non-AD team wins | Both return to `"40"` |
| 4.4 | Multiple deuce cycles resolve | Infinite loop eventually resolves |

### Star point deuce (`scoring.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 5.1 | Win before deuce (4 straight) | `failedAdvantageResets` stays 0, resets on new game |
| 5.2 | First advantage converts | AD → win, counter was 0, resets to 0 |
| 5.3 | First advantage lost, second converts | AD→deuce (failed=1), AD→win |
| 5.4 | Star Point triggers after 2 failed advantages | AD→deuce (1), AD→deuce (2), next deuce point wins |
| 5.5 | After failed=2 no AD awarded | Scoring team wins game directly at 40-40 |
| 5.6 | Counter increments only on AD→deuce | Gaining AD does not change counter |
| 5.7 | Counter resets on game won | Next game starts with `failedAdvantageResets: 0` |
| 5.8 | Both teams can trigger star point | Either team can cycle and win sudden-death |

### Set scoring (`scoring.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 6.1 | Win set 6-0 | Winner's `sets` +1, games reset, `setGames` updated |
| 6.2 | Win set 7-5 | Set won after 5-5 → 7-5 |
| 6.3 | At 6-6 tie-break starts | `phase` → `"tieBreak"`, target 7 |
| 6.4 | Win match best of 3 | `phase` → `"finished"`, `winner` set |
| 6.5 | `setGames` tracks all sets | Correct game counts after multiple sets |

### Tie-break (`tiebreak.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 7.1 | Tie-break initializes 0-0 target 7 | Correct `TieBreakState` |
| 7.2 | Win tie-break 7-0 | Set won, `tieBreak` reset to `null` |
| 7.3 | Win tie-break 7-5 | 2-point lead required |
| 7.4 | 7-6 does not win | Tie-break continues |
| 7.5 | Extended tie-break (e.g. 9-7) | Correct resolution |
| 7.6 | Star point ignored in tie-break | No `gameDeuceState` interaction |
| 7.7 | Non-final set returns to `inProgress` | Match continues |

### Super tie-break (`tiebreak.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 8.1 | Final set 6-6 with super tie-break | `phase` = `"superTieBreak"`, target 10 |
| 8.2 | Final set 6-6 without super tie-break | `phase` = `"tieBreak"`, target 7 |
| 8.3 | Win super tie-break 10-8 | Match won |
| 8.4 | Extended super tie-break (12-10) | Correct resolution |

### Serve rotation (`serve.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 9.1 | Serve alternates every game | After game 1 (teamA), server is teamB |
| 9.2 | Tie-break serve pattern | Point 0: initial, then switch after 1, every 2 after |
| 9.3 | After tie-break correct server | Receiver of first TB point serves next set |

### Announcements (`scoring.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 10.1 | Love all | `"Love all"` |
| 10.2 | Fifteen — Love | `"Fifteen — Love"` |
| 10.3 | Thirty all | `"Thirty all"` |
| 10.4 | Deuce | `"Deuce"` |
| 10.5 | AD for server | `"Advantage {name}"` |
| 10.6 | AD for receiver | `"Advantage {name}"` |
| 10.7 | Game won | `"Game {team}"` |
| 10.8 | Tie-break numeric | `"1 — 0"` etc. |
| 10.9 | Team names in announcements | Uses provided names |

### Undo (`undo.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 11.1 | Undo returns previous state | Matches pre-`scorePoint` state |
| 11.2 | Undo on empty history throws | Error |
| 11.3 | Undo reverts `failedAdvantageResets` | Counter restored |
| 11.4 | Undo reverts tie-break points | Score decremented |
| 11.5 | Multiple sequential undos | Can undo back to initial state |

### Integration (`scoring.test.ts`)

| # | Scenario | Expected |
|---|----------|----------|
| 12.1 | Complete 6-0 6-0 match | 48 points, match finished |
| 12.2 | Match with final-set super tie-break | 3rd set enters super TB, match resolved |
| 12.3 | Star point game with all three stages | Sudden-death resolves correctly |
