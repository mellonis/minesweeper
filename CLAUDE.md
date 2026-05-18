# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A vanilla TypeScript + Vite Minesweeper, served as a static site at `mines.mellonis.ru`. Build output (`dist/`) is rsync'd to `/var/web-apps/mines.mellonis.ru/` by `.github/workflows/cd.yml` on push to `master`. Nginx + certbot config for the domain lives in `mellonis/vps`.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — typechecks (`tsc -b`) then builds with Vite. The build fails on type errors.
- `npm run lint` — ESLint over the repo
- `npm test` — Jest with coverage. Run a single test with `npx jest src/minesweeper/cell.spec.ts` or filter by name with `npx jest -t "cell name"`. Jest runs in `node` env and transforms TS via `ts-jest`.

## Architecture

Vanilla TypeScript, no framework. `src/main.ts` mounts a single `Game` instance into `#root`.

### `src/minesweeper/` — pure game engine

Framework-agnostic TypeScript. No DOM, no canvas.

- `Minesweeper` (`minesweeper.ts`) owns the field, mine placement (deferred to first reveal with a 3×3 safe zone for first-click safety), win/lose state, and marks-left counter. Mutating methods are `reveal(...)` and `mark(...)`; both accept either `{col, row}` or `{index}`. `mark()` is a no-op before the first reveal (the field doesn't exist yet) and after game over.
- `Cell` (`cell.ts`) is a private object held by `Minesweeper`. It uses a `NeighbourGeneratorFabric` (a `() => Generator<Cell>`) injected by `Minesweeper` so cells discover neighbours without holding a back-reference to the field. Flood-fill on zero-neighbour reveal is implemented by `Cell.reveal()` recursing through that generator — the engine itself doesn't loop. `setMine()` flips a cell to a mine before counting.
- `getSnapShot()` is the only read interface. Returns a flat row-major `cells` array where each entry is a number (revealed neighbour count) or a symbol from `symbols.ts` (`cell`, `mark`, `mine`, `missMark`, `explosion`). `isGameOver` is `false` while playing or one of the `win` / `lose` symbols.
- Symbols (`Symbol("…")`) are sentinel values — equality is by reference, so always import them from `./minesweeper`.

### `src/canvas-game/` — canvas UI

`Game` (`game.ts`) is a class that takes a container element and a level factory. It owns the canvas, the `Minesweeper` instance, and the RAF loop. On user actions it calls into the engine, refreshes the snapshot, and lets the dirty-flag RAF render the change on the next frame.

- **`lib/widgets.ts`** — `Widget` base + `Panel` / `Canvas` / `Button` subclasses. Buttons carry sprite + overlay + click handlers; cells are mutated each frame to reflect the current snapshot.
- **`lib/widget-manager.ts`** — owns an offscreen pick canvas (color-keyed hit-testing). Routes mouse events, tracks hovered/pressed widgets, fires handlers. `refreshHover()` re-picks at the last mouse position so cursor / hover state self-correct when widgets become disabled without mouse motion.
- **`lib/sprites.ts`** pre-renders every cell/digit/button variant once into an offscreen canvas (`prepareSprite`) and `drawSprite(ctx, index)` blits by index. Sprite indices are positional — the `fieldSpriteProducers` / `counterSpriteProducers` / `startButtonSpriteProducers` arrays define them, and consumers in `game.ts` hard-code those indices (e.g. `13` = mark overlay, `14` = mine, `15` = miss-mark, `4 + n` = digit `n`, `27..29` = start button face, `30..33` = avatars). Reordering a producer array silently breaks rendering — append-only.
- **`lib/seven-segment.ts`** + **`lib/draw-counter-primitives.ts`** — LCD-style 7-segment counter digits with a ghost backdrop and gaps between segments.
- **`lib/draw-field-primitives.ts`** — cell digits 1..8 as 5×7 pixel-bitmap glyphs (colored per `DIGIT_COLORS`); flag and bomb hand-drawn from primitives. No font dependency.
- **`lib/draw-game-primitives.ts`** — start-button avatars (default / waiting / winner / dead) hand-drawn as a yellow circle with eye/mouth/sunglasses/X-eye variants. Replaces system-font emojis so faces render the same on every device.
- **`lib/consts.ts`** is the single source of layout geometry. `game.ts` derives canvas dimensions from these constants plus the snapshot's `cols`/`rows`.

The DPR setup: sprite canvas is sized at `globalThis.devicePixelRatio` at module-load time, and the main canvas also scales by DPR in `Game.setupCanvas()`. Both must agree.

### Render loop

`Game.startRenderLoop()` runs RAF and skips `manager.draw()` when none of `{snapshot, hovered widget, pressed widget, current second (only while timer is running), aim moved, aim visibility flipped}` changed since the last draw. Idle CPU drops to ~0Hz post-game-over with hidden aim, ~1Hz mid-game (timer tick).

### Aim

A reticle Canvas widget that follows the hovered cell or floats freely (continuous position with random direction perturbation on bounce, slow speed drift in `[0.7×, 1.3×]` of base). Hidden after the first reveal, re-emerges after 45 s of inactivity unless the game is over. Resets on a fresh snapshot.

### First-click safety

Mines are placed in the engine on the first `reveal()` call, with a 3×3 exclusion zone around the clicked cell (falls back to 1-cell or no exclusion for pathological levels). `mark()` is rejected before the field is filled, so there is no pre-mark state — `getSnapShot()` returns an all-unrevealed snapshot before the first reveal.

## Deploy

Static site at `mines.mellonis.ru`. CI workflow at `.github/workflows/cd.yml` runs on push to `master`: lint → test → build → rsync `dist/` to `/var/web-apps/mines.mellonis.ru/` on the VPS. Nginx site config and certbot snapshot live in `mellonis/vps` (no container, no dispatcher entry — pure static).
