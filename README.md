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

## Quick Start

```ts
import { createMatch, scorePoint, undoLastPoint } from 'padel-score-engine';

// Create a match (golden point is the default padel mode)
const match = createMatch({
  sets: 3,
  scoringMode: 'goldenPoint',
  superTieBreak: true,
});

// Score points — each call returns a new immutable state
let state = scorePoint(match, 'A');
console.log(state.score.A.points); // '15'
console.log(state.announce);       // 'Fifteen — Love'

state = scorePoint(state, 'A');
console.log(state.score.A.points); // '30'

// Undo the last point
const previous = undoLastPoint(state);
console.log(previous.score.A.points); // '15'
```

## Examples

### Golden Point (default padel)

At 40-40 the next point wins the game — no advantage.

```ts
const match = createMatch({ sets: 3, scoringMode: 'goldenPoint', superTieBreak: true });

// Score to 40-40
let s = match;
for (const team of ['A', 'A', 'A', 'B', 'B', 'B'] as const) {
  s = scorePoint(s, team);
}
console.log(s.score.A.points, s.score.B.points); // '40' '40'
console.log(s.announce); // 'Deuce'

// Next point decides the game
s = scorePoint(s, 'B');
console.log(s.score.B.games); // 1
console.log(s.announce);      // 'Game B'
```

### Star Point (FIP 2026)

Up to two advantage attempts; if both are lost, the next deuce point is sudden-death.

```ts
const match = createMatch({ sets: 3, scoringMode: 'starPoint', superTieBreak: true });

// Score to 40-40
let s = match;
for (const team of ['A', 'A', 'A', 'B', 'B', 'B'] as const) {
  s = scorePoint(s, team);
}

// 1st advantage attempt — A gets AD, then B breaks it back to deuce
s = scorePoint(s, 'A'); // AD A
s = scorePoint(s, 'B'); // Deuce (failedAdvantageResets → 1)

// 2nd advantage attempt — B gets AD, then A breaks it back to deuce
s = scorePoint(s, 'B'); // AD B
s = scorePoint(s, 'A'); // Deuce (failedAdvantageResets → 2)

// Star Point — next point at deuce wins immediately (no AD awarded)
s = scorePoint(s, 'A');
console.log(s.score.A.games); // 1
console.log(s.announce);      // 'Game A'
```

### Advantage Mode (tennis-style)

Traditional advantage/deuce that can repeat indefinitely.

```ts
const match = createMatch({ sets: 3, scoringMode: 'advantage', superTieBreak: true });

let s = match;
for (const team of ['A', 'A', 'A', 'B', 'B', 'B'] as const) {
  s = scorePoint(s, team);
}

s = scorePoint(s, 'A'); // Advantage A
console.log(s.score.A.points); // 'AD'

s = scorePoint(s, 'B'); // Back to deuce
console.log(s.announce); // 'Deuce'

// Can repeat indefinitely...
s = scorePoint(s, 'B'); // Advantage B
s = scorePoint(s, 'B'); // Game B
console.log(s.score.B.games); // 1
```

### Custom Team Names

```ts
const match = createMatch({
  sets: 3,
  scoringMode: 'goldenPoint',
  superTieBreak: true,
  teamNames: { A: 'Lebron & Galan', B: 'Coello & Tapia' },
});

let s = scorePoint(match, 'A');
console.log(s.announce); // 'Fifteen — Love'

// Win a game
for (let i = 0; i < 3; i++) s = scorePoint(s, 'A');
console.log(s.announce); // 'Game Lebron & Galan'
```

### Undo / History

Every `scorePoint` call stores the previous state in `history`, enabling unlimited undo.

```ts
const match = createMatch({ sets: 3, scoringMode: 'goldenPoint', superTieBreak: true });

const s1 = scorePoint(match, 'A');  // 15-0
const s2 = scorePoint(s1, 'B');     // 15-15
const s3 = scorePoint(s2, 'A');     // 30-15

// Undo back through history
const back1 = undoLastPoint(s3);    // → 15-15
const back2 = undoLastPoint(back1); // → 15-0
console.log(back2.score.A.points, back2.score.B.points); // '15' '0'
```

### Match State

The `MatchState` object gives you everything you need to render a scoreboard:

```ts
const match = createMatch({ sets: 3, scoringMode: 'goldenPoint', superTieBreak: true });
let s = scorePoint(match, 'A');

s.score.A.points;   // '15'       — current game points
s.score.A.games;     // 0          — games in current set
s.score.A.sets;      // 0          — sets won
s.score.A.setGames;  // [0]        — games won per set (array)
s.phase;             // 'inProgress' | 'tieBreak' | 'superTieBreak' | 'finished'
s.serving;           // 'A'        — which team is serving
s.winner;            // null       — set when phase is 'finished'
s.announce;          // 'Fifteen — Love' — human-readable announcement
```

## API

### `createMatch(config: MatchConfig): MatchState`

Creates a new match with the given configuration.

| Config field | Type | Description |
|---|---|---|
| `sets` | `3 \| 5` | Best of 3 or 5 sets |
| `scoringMode` | `'goldenPoint' \| 'advantage' \| 'starPoint'` | Deuce resolution mode |
| `superTieBreak` | `boolean` | Use 10-point super tie-break in final set |
| `teamNames` | `{ A: string; B: string }` | Optional display names |

### `scorePoint(state: MatchState, team: Team): MatchState`

Scores a point for the given team. Returns a new `MatchState` (never mutates). Throws if the match is already finished.

### `undoLastPoint(state: MatchState): MatchState`

Returns the previous state from history. Throws if there is no history.

### Types

All types are exported: `Team`, `ScoringMode`, `GamePoint`, `MatchConfig`, `TeamScore`, `Score`, `MatchPhase`, `TieBreakState`, `GameDeuceState`, `MatchState`.

`Team` is `'A' | 'B'`.

## License

MIT
