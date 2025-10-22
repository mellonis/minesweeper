import {cell, explosion, mark, mine, missMark, Snapshot as MinesweeperSnapshot} from "../../minesweeper";
import {MouseState, MouseStates} from "../types.ts";
import {CELL_SIZE, FIELD_X_POSITION, FIELD_Y_POSITION} from "./consts.ts";
import {drawSprite} from "./sprites.ts";
import {getCoordsForColAndRow, getMouseStateSpriteIndex} from "./utils.ts";

const drawUnrevealed = (
    context: CanvasRenderingContext2D,
    col: number,
    row: number,
    isMarked: boolean,
    {
        x: mouseX,
        y: mouseY,
        state: mouseState
    }: MouseStates
): boolean => {
    const {x, y} = getCoordsForColAndRow(col, row);
    const {x: fieldMouseX, y: fieldMouseY} = {x: mouseX - FIELD_X_POSITION, y: mouseY - FIELD_Y_POSITION};
    const isMouseAboveCurrentCell = x <= fieldMouseX && y <= fieldMouseY && fieldMouseX < x + CELL_SIZE && fieldMouseY < y + CELL_SIZE;

    if (!isMouseAboveCurrentCell) {
        mouseState = MouseState.default;
    }

    mouseState = isMarked ? MouseState.default : mouseState;

    const buttonSpriteIndex = getMouseStateSpriteIndex(mouseState);

    if (buttonSpriteIndex >= 0) {
        context.save();
        context.translate(x, y);

        drawSprite(context, buttonSpriteIndex);

        if (isMarked) {
            drawSprite(context, 13);
        }

        context.restore();
    }

    return mouseState === MouseState.active;
};

const drawRevealed = (
    context: CanvasRenderingContext2D,
    col: number,
    row: number,
    symbol: number | symbol
): void => {
    const {x, y} = getCoordsForColAndRow(col, row);

    context.save();
    context.translate(x, y);

    drawSprite(context, symbol === explosion ? 4 : 3);

    let index = -1;

    if (typeof symbol === 'number') {

        if (symbol > 0) {
            index = 4 + symbol;
        }
    } else {
        switch (symbol) {
            case mine:
            case explosion:
                index = 14;
                break;
            case missMark:
                index = 15;
                break;
        }
    }

    if (index >= 0) {
        drawSprite(context, index);
    }

    context.restore();
};

export const drawField = (
    context: CanvasRenderingContext2D,
    mouseStates: MouseStates,
    {
        cols,
        rows,
        cells,
    }: MinesweeperSnapshot,
): boolean => {
    context.save();
    context.translate(FIELD_X_POSITION, FIELD_Y_POSITION);

    let isAboutToReveal = false;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const symbol = cells[row * cols + col];

            if (typeof symbol === 'number') {
                drawRevealed(context, col, row, symbol)
                continue;
            }

            switch (symbol) {
                case mine:
                case missMark:
                case explosion:
                    drawRevealed(context, col, row, symbol);
                    break;
                case cell:
                case mark:
                    isAboutToReveal ||= drawUnrevealed(context, col, row, symbol === mark, mouseStates);
                    break;
            }
        }
    }

    context.restore();

    return isAboutToReveal;
};