import {drawSprite} from "./sprites.ts";
import {
    BORDER_DARKEN_COLOR,
    BORDER_LIGHTEN_COLOR,
    CELL_SIZE,
    COUNTER_BORDER_WIDTH,
    COUNTER_DIGIT_HEIGHT,
    COUNTER_DIGIT_WIDTH,
    GAME_WIDTH_WITHOUT_FIELD,
    MARKS_COUNTER_X_POSITION,
    MARKS_COUNTER_Y_POSITION,
    TIMER_Y_POSITION
} from "./consts.ts";
import {drawRect} from "./draw-primitives.ts";

const drawCommonCounter = (context: CanvasRenderingContext2D, value: number): void => {
    const counterLength = 3;

    value = Math.min(999, Math.trunc(value));

    let isSignificantDigitMet = false;

    drawRect(context, -COUNTER_BORDER_WIDTH, -COUNTER_BORDER_WIDTH, COUNTER_DIGIT_WIDTH * 3 + 2 * COUNTER_BORDER_WIDTH, COUNTER_DIGIT_HEIGHT + COUNTER_BORDER_WIDTH * 2, COUNTER_BORDER_WIDTH, BORDER_DARKEN_COLOR, BORDER_LIGHTEN_COLOR);

    String(value).padStart(counterLength, '0').split('').forEach((digitString, index) => {
        const digit = Number(digitString);

        isSignificantDigitMet = isSignificantDigitMet || digit > 0 || index === counterLength - 1;

        if (!isSignificantDigitMet && digit === 0) {
            drawSprite(context, 16);
        } else {
            drawSprite(context, 17 + Number(digit));
        }

        context.translate(COUNTER_DIGIT_WIDTH, 0);
    });
};

export const drawCounter = (context: CanvasRenderingContext2D, marksLeft: number): void => {
    context.save();
    context.translate(MARKS_COUNTER_X_POSITION, MARKS_COUNTER_Y_POSITION);

    drawCommonCounter(context, marksLeft);

    context.restore();
}

export const drawTimer = (context: CanvasRenderingContext2D, cols: number, timer: number): void => {
    const fieldWidth = cols * CELL_SIZE;
    const gameWidth = GAME_WIDTH_WITHOUT_FIELD + fieldWidth;

    context.save();
    context.translate(gameWidth - COUNTER_DIGIT_WIDTH * 3 - MARKS_COUNTER_X_POSITION, TIMER_Y_POSITION);

    drawCommonCounter(context, timer);

    context.restore();
};