import {
    cell as cellSymbol,
    explosion as explosionSymbol,
    mark as markSymbol,
    mine as mineSymbol,
    missMark as missMarkSymbol,
    type Snapshot,
} from "../../minesweeper";
import {Widget, type Bounds, type WidgetParams} from "./widgets.ts";
import {drawSprite} from "./sprites.ts";
import {CELL_SIZE} from "./consts.ts";

// Cell sprite indices — duplicated from updateCellWidget in game.ts. Keep in sync.
const UNREVEALED_SPRITE = 0;
const REVEALED_SPRITE = 3;
const EXPLODED_SPRITE = 4;
const DIGIT_BASE_SPRITE = 4; // 4+n for digit n (1..8)
const FLAG_OVERLAY_SPRITE = 13;
const MINE_OVERLAY_SPRITE = 14;
const MISS_MARK_OVERLAY_SPRITE = 15;

const CELL_DURATION_MS = 150;
const TOTAL_DURATION_MS = 500;

interface CellVisual {
    base: number;
    overlay: number | null;
}

function visualForCell(cellSym: number | symbol): CellVisual {
    if (cellSym === cellSymbol) return {base: UNREVEALED_SPRITE, overlay: null};
    if (cellSym === markSymbol) return {base: UNREVEALED_SPRITE, overlay: FLAG_OVERLAY_SPRITE};
    if (cellSym === mineSymbol) return {base: REVEALED_SPRITE, overlay: MINE_OVERLAY_SPRITE};
    if (cellSym === explosionSymbol) return {base: EXPLODED_SPRITE, overlay: MINE_OVERLAY_SPRITE};
    if (cellSym === missMarkSymbol) return {base: REVEALED_SPRITE, overlay: MISS_MARK_OVERLAY_SPRITE};
    if (typeof cellSym === 'number') {
        return {base: REVEALED_SPRITE, overlay: cellSym > 0 ? DIGIT_BASE_SPRITE + cellSym : null};
    }
    return {base: UNREVEALED_SPRITE, overlay: null};
}

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(x: number): number {
    return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function flipDuration(cols: number, rows: number): number {
    const span = Math.max(1, cols + rows - 2);
    const stagger = Math.max(0, TOTAL_DURATION_MS - CELL_DURATION_MS) / span;
    return stagger * span + CELL_DURATION_MS;
}

export interface FlipAnimationParams extends WidgetParams {
    bounds: Bounds;
    fromSnapshot: Snapshot;
    toSnapshot: Snapshot;
    startTime: number;
    onComplete: () => void;
}

// Draws a per-cell scaleY squish that morphs cells from one snapshot to another in a diagonal
// cascade from top-left to bottom-right. Both snapshots must share dims.
export class FlipAnimation extends Widget {
    private readonly fromSnapshot: Snapshot;
    private readonly toSnapshot: Snapshot;
    private readonly startTime: number;
    private readonly onComplete: () => void;
    private completed = false;

    constructor(params: FlipAnimationParams) {
        super(params);
        this.fromSnapshot = params.fromSnapshot;
        this.toSnapshot = params.toSnapshot;
        this.startTime = params.startTime;
        this.onComplete = params.onComplete;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const {cols, rows} = this.fromSnapshot;
        const fieldW = cols * CELL_SIZE;
        const fieldH = rows * CELL_SIZE;
        const scale = Math.min(1, this.bounds.w / fieldW, this.bounds.h / fieldH);
        const drawnW = fieldW * scale;
        const drawnH = fieldH * scale;
        const offsetX = (this.bounds.w - drawnW) / 2;
        const offsetY = (this.bounds.h - drawnH) / 2;

        const now = performance.now();
        const span = Math.max(1, cols + rows - 2);
        const stagger = Math.max(0, TOTAL_DURATION_MS - CELL_DURATION_MS) / span;

        ctx.save();
        ctx.translate(this.bounds.x + offsetX, this.bounds.y + offsetY);
        ctx.scale(scale, scale);

        let allDone = true;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cellStart = this.startTime + (col + row) * stagger;
                const progress = clamp01((now - cellStart) / CELL_DURATION_MS);
                if (progress < 1) allDone = false;

                const eased = easeInOutCubic(progress);
                const scaleY = Math.abs(1 - 2 * eased);

                const cellSym = eased < 0.5
                    ? this.fromSnapshot.cells[row * cols + col]
                    : this.toSnapshot.cells[row * cols + col];

                const visual = visualForCell(cellSym);

                ctx.save();
                const cx = col * CELL_SIZE + CELL_SIZE / 2;
                const cy = row * CELL_SIZE + CELL_SIZE / 2;
                ctx.translate(cx, cy);
                ctx.scale(1, scaleY);
                ctx.translate(-CELL_SIZE / 2, -CELL_SIZE / 2);
                drawSprite(ctx, visual.base);
                if (visual.overlay !== null) drawSprite(ctx, visual.overlay);
                ctx.restore();
            }
        }

        ctx.restore();

        if (allDone && !this.completed) {
            this.completed = true;
            queueMicrotask(this.onComplete);
        }
    }
}
