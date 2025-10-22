import {CELL_SIZE, COUNTER_DIGIT_HEIGHT, COUNTER_DIGIT_WIDTH, START_BUTTON_SIZE} from "./consts.ts";
import {mark, mine, missMark} from "../../minesweeper";
import {drawEmptyCellBackground, drawSymbol as drawCellSymbol, drawUnrevealedCellBackground,} from "./draw-field-primitives.ts";
import {drawCounterDigit} from "./draw-counter-primitives.ts";
import {UnrevealedCellBackgroundState} from "./types.ts";
import {ButtonType, drawButton} from "./draw-primitives.ts";
import {deadEmoji, defaultEmoji, waitingEmoji, winnerEmoji} from "./symbols.ts";
import {drawEmoji as drawStartButtonSymbol} from "./draw-game-primitives.ts";

let spriteCanvas: HTMLCanvasElement;

const fieldSpriteProducers = [
    [drawUnrevealedCellBackground, [UnrevealedCellBackgroundState.default]],
    [drawUnrevealedCellBackground, [UnrevealedCellBackgroundState.hover]],
    [drawUnrevealedCellBackground, [UnrevealedCellBackgroundState.active]],
    [drawEmptyCellBackground, [false]],
    [drawEmptyCellBackground, [true]],
    ...Array.from({length: 8}).map((_, index) => index + 1).map((digit) => [drawCellSymbol, [digit]]),
    [drawCellSymbol, [mark]],
    [drawCellSymbol, [mine]],
    [drawCellSymbol, [missMark]],
];
const counterSpriteProducers = [
    [drawCounterDigit, []],
    ...Array.from({length: 10}).map((_, index) => index).map((digit) => [drawCounterDigit, [digit]]),
];
const startButtonSpriteProducers = [
    [drawButton, [ButtonType.Default, UnrevealedCellBackgroundState.default]],
    [drawButton, [ButtonType.Default, UnrevealedCellBackgroundState.hover]],
    [drawButton, [ButtonType.Default, UnrevealedCellBackgroundState.active]],
    ...[defaultEmoji, waitingEmoji, winnerEmoji, deadEmoji].map((emoji) => [drawStartButtonSymbol, [emoji]])
];
const devicePixelRatio = globalThis.devicePixelRatio;
const SPRITE_CELL_SIZE = CELL_SIZE * devicePixelRatio;
const SPRITE_START_BUTTON_SIZE = START_BUTTON_SIZE * devicePixelRatio;
const SPRITE_COUNTER_DIGIT_WIDTH = COUNTER_DIGIT_WIDTH * devicePixelRatio;
const SPRITE_COUNTER_DIGIT_HEIGHT = COUNTER_DIGIT_HEIGHT * devicePixelRatio;
const spriteDrawArguments = [
    ...Array.from({length: fieldSpriteProducers.length}).map((_, index) => [index * SPRITE_CELL_SIZE, 0, SPRITE_CELL_SIZE, SPRITE_CELL_SIZE, 0, 0, CELL_SIZE, CELL_SIZE] as const),
    ...Array.from({length: counterSpriteProducers.length}).map((_, index) => [index * SPRITE_COUNTER_DIGIT_WIDTH, SPRITE_CELL_SIZE, SPRITE_COUNTER_DIGIT_WIDTH, SPRITE_COUNTER_DIGIT_HEIGHT, 0, 0, COUNTER_DIGIT_WIDTH, COUNTER_DIGIT_HEIGHT] as const),
    ...Array.from({length: startButtonSpriteProducers.length}).map((_, index) => [index * SPRITE_START_BUTTON_SIZE, SPRITE_CELL_SIZE + SPRITE_COUNTER_DIGIT_HEIGHT, SPRITE_START_BUTTON_SIZE, SPRITE_START_BUTTON_SIZE, 0, 0, START_BUTTON_SIZE, START_BUTTON_SIZE] as const)
];

export const drawSprite = (context: CanvasRenderingContext2D, index: number): void => {
    context.drawImage(spriteCanvas, ...spriteDrawArguments[index]);
}

export const prepareSprite = (): void => {
    if (spriteCanvas) {
        return;
    }

    spriteCanvas = document.createElement('canvas');

    spriteCanvas.width = Math.max(CELL_SIZE * fieldSpriteProducers.length, COUNTER_DIGIT_WIDTH * counterSpriteProducers.length) * devicePixelRatio;
    spriteCanvas.height = (CELL_SIZE + COUNTER_DIGIT_HEIGHT + START_BUTTON_SIZE) * devicePixelRatio;

    const context = spriteCanvas.getContext('2d');

    if (!context) {
        throw new Error("Can't prepare sprite");
    }

    context.scale(devicePixelRatio, devicePixelRatio);
    context.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);

    fieldSpriteProducers.forEach((tuple, index) => {
        // todo: fix error
        // @ts-expect-error Don't know hox to fix ts error
        tuple[0](context, CELL_SIZE * index, 0, ...(tuple[1]));
    });

    counterSpriteProducers.forEach((tuple, index) => {
        // todo: fix error
        // @ts-expect-error Don't know hox to fix ts error
        tuple[0](context, COUNTER_DIGIT_WIDTH * index, CELL_SIZE, ...(tuple[1]));
    });

    startButtonSpriteProducers.forEach((tuple, index) => {
        // todo: fix error
        // @ts-expect-error Don't know hox to fix ts error
        tuple[0](context, START_BUTTON_SIZE * index, CELL_SIZE + COUNTER_DIGIT_HEIGHT, ...(tuple[1]));
    });

}