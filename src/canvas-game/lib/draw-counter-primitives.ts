import {COUNTER_BACKGROUND_COLOR, COUNTER_COLOR, COUNTER_DIGIT_HEIGHT, COUNTER_DIGIT_WIDTH} from "./consts.ts";
import {drawSevenSegment, SEVEN_SEGMENT_ALL, SEVEN_SEGMENT_PATTERNS} from "./seven-segment.ts";

const DIGIT_MARGIN_X = 5;
const DIGIT_MARGIN_Y = 4;
const DIGIT_THICKNESS = 4;
const DIGIT_GAP = 1.5;
const GHOST_ALPHA = 0.12;

export const drawCounterDigit = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    digit?: number,
) => {
    context.save();
    context.translate(x, y);

    // Background
    context.fillStyle = COUNTER_BACKGROUND_COLOR;
    context.fillRect(0, 0, COUNTER_DIGIT_WIDTH, COUNTER_DIGIT_HEIGHT);

    // Digit area (inside margin)
    context.translate(DIGIT_MARGIN_X, DIGIT_MARGIN_Y);
    const w = COUNTER_DIGIT_WIDTH - DIGIT_MARGIN_X * 2;
    const h = COUNTER_DIGIT_HEIGHT - DIGIT_MARGIN_Y * 2;

    context.fillStyle = COUNTER_COLOR;

    // Ghost (all segments dim) so unlit segments are faintly visible like a real LCD.
    context.globalAlpha = GHOST_ALPHA;
    drawSevenSegment(context, w, h, DIGIT_THICKNESS, SEVEN_SEGMENT_ALL, DIGIT_GAP);
    context.globalAlpha = 1;

    if (typeof digit === 'number' && digit in SEVEN_SEGMENT_PATTERNS) {
        drawSevenSegment(context, w, h, DIGIT_THICKNESS, SEVEN_SEGMENT_PATTERNS[digit], DIGIT_GAP);
    }

    context.restore();
};
