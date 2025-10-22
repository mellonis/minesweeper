import {CELL_SIZE, FIELD_X_POSITION, FIELD_Y_POSITION} from "./consts.ts";
import {MouseState} from "../types.ts";

export const getCanvasCoords = (
    element: HTMLElement,
    {clientX, clientY}: Pick<MouseEvent, 'clientX' | 'clientY'>,
): { x: number; y: number; } => {
    const rect = element.getBoundingClientRect();

    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
    };
}

export const getFieldColAndRow = (
    element: HTMLElement, event: Pick<MouseEvent, 'clientX' | 'clientY'>,
): { col: number; row: number; } => {
    const {x, y} = getCanvasCoords(element, event);

    return {
        col: Math.floor((x - FIELD_X_POSITION) / CELL_SIZE),
        row: Math.floor((y - FIELD_Y_POSITION) / CELL_SIZE),
    };
}

export const getCoordsForColAndRow = (col: number, row: number): { x: number; y: number; } => ({
    x: col * CELL_SIZE,
    y: row * CELL_SIZE
});

export const getMouseStateSpriteIndex = (mouseState: MouseState, spriteIndex = 0): number =>
{
    switch (mouseState) {
        case MouseState.default:
            spriteIndex += 0;
            break;
        case MouseState.hover:
            spriteIndex += 1;
            break;
        case MouseState.active:
            spriteIndex += 2;
            break;
    }

    return spriteIndex;
}