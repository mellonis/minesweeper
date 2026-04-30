# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A standalone React 19 + TypeScript + Vite Minesweeper. This repo is unrelated to the VPS deploys described in the workspace-level `CLAUDE.md` — nothing here ships to `mellonis.ru`.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — typechecks (`tsc -b`) then builds with Vite. The build fails on type errors.
- `npm run lint` — ESLint over the repo
- `npm test` — Jest with coverage. Run a single test with `npx jest src/minesweeper/cell.spec.ts` or filter by name with `npx jest -t "cell name"`. Jest runs in `node` env and transforms TS via `ts-jest`.

## Architecture

The app has two parallel UIs rendering the same game state side-by-side. They are not alternatives — `App.tsx` renders both at once.

### `src/minesweeper/` — pure game engine

Framework-agnostic TypeScript. No React, no DOM, no canvas.

- `Minesweeper` (`minesweeper.ts`) owns the field, mine placement, win/lose state, and marks-left counter. Mutating methods are `reveal(...)` and `mark(...)`; both accept either `{col, row}` or `{index}`.
- `Cell` (`cell.ts`) is a private object held by `Minesweeper`. It uses a `NeighbourGeneratorFabric` (a `() => Generator<Cell>`) injected by `Minesweeper` so cells discover neighbours without holding a back-reference to the field. Flood-fill on zero-neighbour reveal is implemented by `Cell.reveal()` recursing through that generator — the engine itself doesn't loop.
- `getSnapShot()` is the only read interface. It returns a flat row-major `cells` array where each entry is either a number (revealed neighbour count) or one of the symbols from `symbols.ts` (`cell`, `mark`, `mine`, `missMark`, `explosion`). `isGameOver` is `false` while playing or one of the `win` / `lose` symbols. UIs render snapshots; they never read `Cell` or `Minesweeper` directly.
- Symbols (`Symbol("…")`) are used as sentinel values in the snapshot — equality is by reference, so always import them from `./minesweeper` (re-exported via `index.ts`) rather than constructing your own.

### `src/App.tsx` — DOM/CSS UI

Holds the `Minesweeper` instance in state. After each `reveal` / `mark` it calls `getSnapShot()` and stores it. The cell index is derived from `Array.prototype.indexOf` of the clicked DOM element among its siblings, so the field children must stay in row-major order matching `snapshot.cells`. Three difficulties plus a "custom" preset are defined in `levels` at the top of the file, but only `beginner` is wired to the New Game button.

### `src/canvas-game/` — Canvas UI

Same snapshot, rendered to a `<canvas>` via a `requestAnimationFrame` loop in `Game.tsx`. Mouse state is kept in a `useRef` (not React state) so the render loop reads the latest values without re-subscribing.

- `lib/sprites.ts` pre-renders every cell/digit/button variant once into an offscreen canvas (`prepareSprite`) and `drawSprite(ctx, index)` blits by index. Sprite indices are positional — the `fieldSpriteProducers` / `counterSpriteProducers` / `startButtonSpriteProducers` arrays define them, and consumers (`draw-field.ts`, `draw-counter.ts`, `draw-game.ts`) hard-code those indices (e.g. `13` = mark overlay, `14` = mine, `15` = miss-mark, `4 + n` = digit `n`). Reordering a producer array silently breaks rendering — keep them append-only or update every consumer.
- The sprite sheet is sized using `globalThis.devicePixelRatio` at module-load time, and the main canvas also scales by DPR in `Game.tsx`. Both must agree, otherwise sprites blit at the wrong size.
- `lib/consts.ts` is the single source of layout geometry (cell size, panel height, padding). `Game.tsx` derives canvas dimensions from these constants plus the snapshot's `cols`/`rows`.
- `lib/utils.ts` `getFieldColAndRow` converts a mouse event to `{col, row}` and is also what feeds `onReveal` / `onMark`. Out-of-field clicks produce negative or out-of-range coords; `Game.tsx` bounds-checks before forwarding.

### Data flow

`App` owns the engine → on click it mutates the engine and re-snapshots → both UIs receive the new snapshot prop and re-render. The canvas UI's RAF loop always reads the latest snapshot via a ref (`propsRef`), so React re-renders are not what drives canvas redraws — the RAF is.
