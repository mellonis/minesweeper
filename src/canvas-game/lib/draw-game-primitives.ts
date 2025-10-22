import {HALF_START_BUTTON_SIZE} from "./consts.ts";
import {deadEmoji, defaultEmoji, waitingEmoji, winnerEmoji} from "./symbols.ts";

export const drawEmoji = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: symbol
): void => {
    context.save();
    context.translate(x, y);

    context.textBaseline = 'middle'
    context.textAlign = 'center'

    let text: string = '';

    context.font = 'bold 20px monospace';

    switch (symbol) {
        case defaultEmoji:
            text = '🙂';
            break;
        case waitingEmoji:
            text = '😮';
            break;
        case winnerEmoji:
            text = '😎';
            break;
        case deadEmoji:
            text = '😵';
            break;
    }

    if (text) {
        context.fillText(text, HALF_START_BUTTON_SIZE + 1, HALF_START_BUTTON_SIZE + 2);
    }

    context.restore();
};