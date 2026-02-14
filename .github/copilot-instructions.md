# Copilot Instructions — padel-score-engine

## Project overview

Zero-dependency, pure TypeScript padel/tennis scoring engine published as a dual-format (ESM + CJS) npm package.
Repository: https://github.com/zhuravlev-biz/padel-score-engine

## Architecture

- **Single-package library** (not a monorepo)
- Source lives in `src/`, built output in `dist/`
- Entry point: `src/index.ts` — re-exports public API only
- Key modules: `types.ts`, `scoring.ts`, `match.ts`, `serve.ts`, `tiebreak.ts`, `undo.ts`
- Immutable state transitions — every function returns a new `MatchState`, never mutates

## Scoring modes

The engine supports three deuce-resolution modes:

| Mode | Behaviour |
|------|-----------|
| `goldenPoint` | At 40-40 the next point wins (default for padel) |
| `advantage` | Traditional advantage/deuce, repeats indefinitely |
| `starPoint` | Up to 2 advantage attempts; if both lost, next deuce point is sudden-death (FIP 2026) |

Star Point tracks `failedAdvantageResets` (0–2) in `GameDeuceState`. It applies only to regular games, never to tie-breaks.

## Tech stack & tooling

- **Runtime dependencies**: none (zero-dependency)
- **TypeScript** with strict mode (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **tsup** for building (ESM `.js` + CJS `.cjs` + declarations)
- **Vitest** for testing
- **Biome** for linting and formatting
- **Changesets** for versioning and changelog management
- **Node >=18** required

## Conventions

### Code style
- Use Biome for formatting (2-space indent, 100 char line width)
- Run `npm run lint` (biome check) and `npm run typecheck` (tsc --noEmit) before committing
- No comments unless logic is non-obvious
- Prefer `type` over `interface` for simple shapes; use `interface` for extendable contracts
- Use `.js` extensions in relative imports (`import { foo } from './bar.js'`)

### Testing
- Test files are **co-located** with source: `src/scoring.test.ts` next to `src/scoring.ts`
- Use Vitest with `globals: true`
- Run tests: `npm test` (single run) or `npm run test:watch`
- Name test files `*.test.ts`

### State management
- All state is immutable — return new objects, never mutate
- `MatchState.history` holds previous snapshots for undo
- Always reset per-game state (points, `gameDeuceState`) in `winGame()`

### Types
- `Team` is always `'teamA' | 'teamB'`
- `GamePoint` is `'0' | '15' | '30' | '40' | 'AD'`
- `ScoringMode` is `'goldenPoint' | 'advantage' | 'starPoint'`
- Keep types in `types.ts`, export them from `index.ts`

## Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run build` | Build with tsup |
| `npm run check` | Full check (typecheck + lint + test) |
| `npm run changeset` | Create a changeset for the next release |

## Do NOT

- Add runtime dependencies — this library must remain zero-dependency
- Use `any` or `as` type assertions — prefer type narrowing
- Put test files in a separate `__tests__/` directory — co-locate them in `src/`
- Add Node.js or browser-specific APIs — this must work in any JS environment
- Skip resetting `gameDeuceState` when a game ends
