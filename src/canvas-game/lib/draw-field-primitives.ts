import {
    BACKGROUND_COLOR,
    BORDER_COLOR,
    CELL_SIZE,
    CROSS_COLOR,
    DIGIT_COLORS,
    EXPLODED_BACKGROUND_COLOR,
    HALF_CELL_SIZE
} from "./consts.ts";
import {
    explosion as explosionSymbol,
    mark as markSymbol,
    mine as mineSymbol,
    missMark as missMarkSymbol
} from "../../minesweeper";
import {ButtonType, drawButton} from "./draw-primitives.ts";
import {UnrevealedCellBackgroundState} from "./types.ts";

// 5x7 pixel-bitmap glyphs for cell digits 1..8. Each row is 5 chars wide; 'X' = lit.
const CELL_DIGIT_BITMAPS: Record<number, readonly string[]> = {
    1: [
        '..X..',
        '.XX..',
        '..X..',
        '..X..',
        '..X..',
        '..X..',
        '.XXX.',
    ],
    2: [
        '.XXX.',
        'X...X',
        '....X',
        '...X.',
        '..X..',
        '.X...',
        'XXXXX',
    ],
    3: [
        'XXXX.',
        '....X',
        '....X',
        '..XX.',
        '....X',
        '....X',
        'XXXX.',
    ],
    4: [
        '...X.',
        '..XX.',
        '.X.X.',
        'X..X.',
        'XXXXX',
        '...X.',
        '...X.',
    ],
    5: [
        'XXXXX',
        'X....',
        'XXXX.',
        '....X',
        '....X',
        'X...X',
        '.XXX.',
    ],
    6: [
        '.XXX.',
        'X....',
        'X....',
        'XXXX.',
        'X...X',
        'X...X',
        '.XXX.',
    ],
    7: [
        'XXXXX',
        '....X',
        '...X.',
        '..X..',
        '..X..',
        '..X..',
        '..X..',
    ],
    8: [
        '.XXX.',
        'X...X',
        'X...X',
        '.XXX.',
        'X...X',
        'X...X',
        '.XXX.',
    ],
};

const CELL_DIGIT_PIXEL = 2;
const CELL_DIGIT_W = 5 * CELL_DIGIT_PIXEL;
const CELL_DIGIT_H = 7 * CELL_DIGIT_PIXEL;

export const drawEmptyCellBackground = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    isExploded: boolean = false
) => {
    context.save();
    context.translate(x, y);
    context.beginPath();

    context.rect(0, 0, CELL_SIZE, CELL_SIZE);
    context.fillStyle = isExploded ? EXPLODED_BACKGROUND_COLOR : BACKGROUND_COLOR;
    context.fill();
    context.strokeStyle = BORDER_COLOR;
    context.moveTo(0, 0);
    context.lineTo(CELL_SIZE, 0);
    context.lineTo(CELL_SIZE, CELL_SIZE);
    context.lineTo(0, CELL_SIZE);
    context.lineTo(0, 0);
    context.stroke();

    context.restore();
};

export const drawUnrevealedCellBackground = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    state = UnrevealedCellBackgroundState.default
): void => {
    drawButton(context, x, y, ButtonType.Cell, state);
};

const drawCellDigit = (ctx: CanvasRenderingContext2D, n: number): void => {
    const bitmap = CELL_DIGIT_BITMAPS[n];
    if (!bitmap) return;
    const fillStyle = DIGIT_COLORS[n];
    if (fillStyle) ctx.fillStyle = fillStyle;
    const startX = Math.floor((CELL_SIZE - CELL_DIGIT_W) / 2);
    const startY = Math.floor((CELL_SIZE - CELL_DIGIT_H) / 2);
    // Each lit cell renders 1px larger than the grid step so neighbours overlap and strokes thicken.
    const pixelRender = CELL_DIGIT_PIXEL + 1;
    for (let row = 0; row < bitmap.length; row++) {
        const line = bitmap[row];
        for (let col = 0; col < line.length; col++) {
            if (line[col] === 'X') {
                ctx.fillRect(
                    startX + col * CELL_DIGIT_PIXEL,
                    startY + row * CELL_DIGIT_PIXEL,
                    pixelRender,
                    pixelRender,
                );
            }
        }
    }
};

const drawFlag = (ctx: CanvasRenderingContext2D): void => {
    // Pole
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(HALF_CELL_SIZE, 7);
    ctx.lineTo(HALF_CELL_SIZE, 22);
    ctx.stroke();

    // Flag triangle
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(HALF_CELL_SIZE, 7);
    ctx.lineTo(HALF_CELL_SIZE - 7, 12);
    ctx.lineTo(HALF_CELL_SIZE, 16);
    ctx.closePath();
    ctx.fill();

    // Base block
    ctx.fillStyle = 'black';
    ctx.fillRect(HALF_CELL_SIZE - 5, 22, 10, 2);
    ctx.fillRect(HALF_CELL_SIZE - 4, 20, 8, 2);
};

const drawBomb = (ctx: CanvasRenderingContext2D): void => {
    const cx = HALF_CELL_SIZE;
    const cy = HALF_CELL_SIZE;
    const r = 6;

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    // Spikes — 8 short lines radiating outward
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3));
    }
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'white';
    ctx.fillRect(cx - 3, cy - 3, 2, 2);
};

export const drawSymbol = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: number | symbol
): void => {
    context.save();
    context.translate(x, y);

    if (typeof symbol === 'number') {
        drawCellDigit(context, symbol);
    } else {
        switch (symbol) {
            case markSymbol:
                drawFlag(context);
                break;
            case mineSymbol:
            case missMarkSymbol:
            case explosionSymbol:
                drawBomb(context);
                break;
        }

        if (symbol === missMarkSymbol) {
            context.strokeStyle = CROSS_COLOR;
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(4, 4);
            context.lineTo(CELL_SIZE - 4, CELL_SIZE - 4);
            context.moveTo(CELL_SIZE - 4, 4);
            context.lineTo(4, CELL_SIZE - 4);
            context.stroke();
            context.closePath();
        }
    }

    context.restore();
};
