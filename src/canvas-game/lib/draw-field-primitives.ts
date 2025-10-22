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


export const drawSymbol = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: number | symbol
): void => {
    context.save();
    context.translate(x, y);

    context.textBaseline = 'middle'
    context.textAlign = 'center'

    let text: string = '';

    if (typeof symbol === 'number') {
        context.font = 'bold 16px monospace';

        const fillStyle = DIGIT_COLORS[symbol];

        if (fillStyle) {
            context.fillStyle = fillStyle;
        }

        text = String(symbol);
    } else {
        context.font = 'bold 13px monospace';

        switch (symbol) {
            case markSymbol:
                text = '🚩'
                break;
            case mineSymbol:
            case missMarkSymbol:
            case explosionSymbol:
                text = '💣'
                break;
        }
    }

    if (text) {
        context.fillText(text, HALF_CELL_SIZE + 1, HALF_CELL_SIZE + 1);
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

    context.restore();
};