import {mine, type Snapshot} from "../../minesweeper";
import {Widget, type Bounds, type WidgetParams} from "./widgets.ts";
import {drawSprite} from "./sprites.ts";
import {CELL_SIZE} from "./consts.ts";

const REVEALED_CELL_SPRITE = 3;
const DIGIT_BASE_SPRITE = 4; // 4+n for digit n (1..8)
const MINE_SPRITE = 14;

export interface PreviewRendererParams extends WidgetParams {
    bounds: Bounds;
    snapshot: Snapshot;
}

// Single Canvas-style widget that draws an entire revealed Snapshot, scaling to fit its bounds.
// Replaces the per-cell Button render path while the config panel is open — one widget, one
// draw call per RAF, rather than rebuilding cols*rows Buttons every slider tick.
export class PreviewRenderer extends Widget {
    private snapshot: Snapshot;

    constructor(params: PreviewRendererParams) {
        super(params);
        this.snapshot = params.snapshot;
    }

    setSnapshot(snapshot: Snapshot): void {
        this.snapshot = snapshot;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const {cols, cells} = this.snapshot;
        const fieldW = cols * CELL_SIZE;
        const fieldH = this.snapshot.rows * CELL_SIZE;

        const scale = Math.min(1, this.bounds.w / fieldW, this.bounds.h / fieldH);
        const drawnW = fieldW * scale;
        const drawnH = fieldH * scale;
        const offsetX = (this.bounds.w - drawnW) / 2;
        const offsetY = (this.bounds.h - drawnH) / 2;

        ctx.save();
        ctx.translate(this.bounds.x + offsetX, this.bounds.y + offsetY);
        ctx.scale(scale, scale);

        for (let i = 0; i < cells.length; i++) {
            const col = i % cols;
            const row = (i - col) / cols;
            const cellSym = cells[i];

            ctx.save();
            ctx.translate(col * CELL_SIZE, row * CELL_SIZE);

            drawSprite(ctx, REVEALED_CELL_SPRITE);

            if (cellSym === mine) {
                drawSprite(ctx, MINE_SPRITE);
            } else if (typeof cellSym === 'number' && cellSym > 0) {
                drawSprite(ctx, DIGIT_BASE_SPRITE + cellSym);
            }

            ctx.restore();
        }

        ctx.restore();
    }
}
