import {COUNTER_BACKGROUND_COLOR, COUNTER_COLOR, COUNTER_DIGIT_HEIGHT, COUNTER_DIGIT_WIDTH} from "./consts.ts";

export const drawCounterDigit = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    digit?: number,
) => {
    context.save();
    context.translate(x, y);

    context.font = 'bold 32px monospace';

    context.fillStyle = COUNTER_BACKGROUND_COLOR;
    context.fillRect(0, 0, COUNTER_DIGIT_WIDTH, COUNTER_DIGIT_HEIGHT);

    context.globalAlpha = 0.1;

    context.fillStyle = COUNTER_COLOR;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(String(8), COUNTER_DIGIT_WIDTH / 2, COUNTER_DIGIT_HEIGHT / 2 + 3);

    context.globalAlpha = 1;

    if (typeof digit === 'number') {
        context.fillText(String(digit), COUNTER_DIGIT_WIDTH / 2, COUNTER_DIGIT_HEIGHT / 2 + 3);
    }

    context.restore();
};