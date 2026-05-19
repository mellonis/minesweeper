# Minesweeper

💣 Yet another Minesweeper. Vanilla TypeScript, no framework. Live at [mines.mellonis.ru](https://mines.mellonis.ru).


https://github.com/user-attachments/assets/372e787e-d5b0-429a-82aa-4c2f1049783d


## Run

- `npm run dev` — Vite dev server with HMR
- `npm run build` — typecheck (`tsc -b`) and build
- `npm test` — Jest with coverage

## Architecture

### Core (`src/minesweeper/`)

Framework-agnostic game engine. No DOM, no canvas — just `Minesweeper` and `Cell`. The field owns mine placement, win/lose state, and the marks-left counter; `Cell` handles flood-fill on zero-neighbour reveal via a neighbour-generator injected by the field, so cells never hold a back-reference to it. Mines are placed on the first `reveal()` with a 3×3 safe zone for first-click safety; marks placed before that are replayed when the field is filled.

The only read interface is `getSnapShot()`, which returns a flat row-major array of revealed digits or sentinel symbols (`cell`, `mark`, `mine`, `missMark`, `explosion`). Symbol equality is by reference — always import them from `./minesweeper`.

### Sprite system (`src/canvas-game/lib/sprites.ts`)

Every cell, digit, and button variant is pre-rendered once into an offscreen canvas (`prepareSprite`). Render-time work collapses to a single `drawSprite(ctx, index)` blit per widget. Sprites are sized at `devicePixelRatio` at module load, so the main canvas must scale by DPR to match.

Sprite indices are positional — they're defined by the order of producers in `fieldSpriteProducers` / `counterSpriteProducers` / `startButtonSpriteProducers`, and consumers in `game.ts` hard-code those indices. Appending to a producer array is safe; reordering silently breaks rendering.

### Widget manager (`src/canvas-game/lib/widget-manager.ts`)

Hit-testing without geometry math. Each widget gets a unique numeric id mapped to a CSS color (`#RRGGBB`). The manager keeps an offscreen "pick" canvas and asks every widget to draw its mask there in its assigned color; on a mouse event it reads one pixel under the cursor and looks up the widget by color. Exact, resolution-independent, works for any shape a widget can draw.

It also tracks hovered / pressed widgets and re-picks at the last mouse position when widgets become disabled, so cursor and hover state self-correct without requiring mouse motion.

## License

[GPL-3.0](LICENSE)
