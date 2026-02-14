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
