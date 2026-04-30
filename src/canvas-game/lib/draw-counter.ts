import {drawSprite} from "./sprites.ts";
import {
    BORDER_DARKEN_COLOR,
    BORDER_LIGHTEN_COLOR,
    COUNTER_BORDER_WIDTH,
    COUNTER_DIGIT_HEIGHT,
    COUNTER_DIGIT_WIDTH,
} from "./consts.ts";
import {drawRect} from "./draw-primitives.ts";

export const drawCommonCounter = (context: CanvasRenderingContext2D, value: number): void => {
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
