# padel-score-engine

Zero-dependency, pure TypeScript padel/tennis scoring engine.

## Features

- Padel scoring rules (0, 15, 30, 40, game, set, match)
- **Star Point mode** (FIP 2026) — advantage up to 2×, then sudden-death
- Golden Point mode (default for padel)
- Advantage/Deuce mode (tennis-style)
- Tie-break (7 points, 2-point lead)
- Super tie-break (10 points, 2-point lead, final set)
- Configurable sets (best of 3 or 5)
- Undo with snapshot-based history
- Serve rotation tracking
- Announcement string generation ("Fifteen — Love")
- Immutable state transitions

## Scoring Modes

| Mode | Deuce behaviour |
| --- | --- |
| `goldenPoint` | At 40-40 the next point wins the game (default for padel). |
| `advantage` | Traditional advantage/deuce — can repeat indefinitely (tennis-style). |
| `starPoint` | Up to **two** advantage attempts; if both are lost back to deuce, the next point is a **sudden-death Star Point** that decides the game. |

### Star Point — How it works (FIP 2026)

Approved unanimously by the FIP General Assembly on 28 November 2025, the Star Point rule is applied in **Premier Padel, CUPRA FIP Tour, FIP Promises, and FIP Beyond** starting from the 2026 season.

When a regular game (not a tie-break) reaches deuce (40-40):

1. **First advantage** — Normal advantage rules. Win the next point → win the game. Lose → back to 40-40.
2. **Second advantage** — Same as above. Win → game. Lose → Star Point is armed.
3. **Star Point** — A single decisive point: whoever wins this point wins the game. No advantage is awarded.

This caps the maximum number of points in any deuce game, improving player welfare and broadcast predictability while preserving the spirit of advantage play.

> **Note:** Star Point applies only to regular games. Tie-breaks and super tie-breaks are unaffected and continue to use standard 2-point-lead rules.

## Rules

See [RULES.md](RULES.md) for the full scoring rules implemented by this engine, including links to the official [FIP Rules of Padel (2026)](https://www.padelfip.com/wp-content/uploads/2025/12/FIP_Rules-of-Padel-1.pdf).

## Install

```bash
npm install padel-score-engine
```

## Usage (planned API)

> **Note:** The engine is under active development. The API below shows the target design.

```ts
import { createMatch, scorePoint, undoLastPoint } from 'padel-score-engine';

// Classic padel — golden point
const match = createMatch({
  sets: 3,
  scoringMode: 'goldenPoint',
  superTieBreak: true,
});

// FIP 2026 — star point
const match2026 = createMatch({
  sets: 3,
  scoringMode: 'starPoint',
  superTieBreak: true,
});

const next = scorePoint(match, 'teamA');
// next.score.teamA.points → '15'

const prev = undoLastPoint(next);
```

## Development Plan — Star Point Implementation

### Type changes

1. Extend `ScoringMode` to `'goldenPoint' | 'advantage' | 'starPoint'`.
2. Add an optional `GameDeuceState` to `MatchState` tracking `failedAdvantageResets` (0 | 1 | 2).
3. Stage is derived — no explicit stage enum needed:
   - `failedAdvantageResets < 2` → normal advantage behaviour
   - `failedAdvantageResets === 2` → next deuce point is sudden death

### Scoring logic

- Route by `phase` first: tie-break/super tie-break → tie-break scorer (star point does not apply).
- In regular game scoring at deuce:
  - `goldenPoint` → next point wins immediately.
  - `advantage` → award AD; if AD lost, return to deuce (infinite).
  - `starPoint` → award AD; if AD lost, increment `failedAdvantageResets`. At 2 failed resets + deuce, next point wins immediately.
- `winGame()` must reset `failedAdvantageResets` to 0.

### Tests to write

| # | Scenario |
| --- | --- |
| 1 | Win before deuce — 4 straight points |
| 2 | Advantage converts on first attempt |
| 3 | Star Point triggers after exactly 2 failed advantages |
| 4 | After `failed=2`, no AD is awarded — next point at deuce wins |
| 5 | Counter increments only on AD→deuce transition, not on gaining AD |
| 6 | Tie-break ignores star point mode entirely |
| 7 | Undo correctly reverts `failedAdvantageResets` |

### Implementation order

1. Update `ScoringMode` type + add `GameDeuceState` to `MatchState`
2. Implement regular game scoring with star point logic
3. Ensure tie-break path bypasses star point
4. Write tests (vitest)
5. Update undo/history to include `gameDeuceState`
6. Export updates + changelog entry

## License

MIT
