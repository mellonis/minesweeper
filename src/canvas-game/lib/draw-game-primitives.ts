import {HALF_START_BUTTON_SIZE} from "./consts.ts";
import {deadEmoji, defaultEmoji, waitingEmoji, winnerEmoji} from "./symbols.ts";

const FACE_RADIUS = 13;
const FACE_FILL = '#ffd000';
const FACE_STROKE = 'black';

const drawFaceCircle = (ctx: CanvasRenderingContext2D, cx: number, cy: number): void => {
    ctx.fillStyle = FACE_FILL;
    ctx.strokeStyle = FACE_STROKE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, FACE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
};

const drawNormalEyes = (ctx: CanvasRenderingContext2D, cx: number, cy: number): void => {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 3, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
};

const drawSmile = (ctx: CanvasRenderingContext2D, cx: number, cy: number): void => {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 5.5, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
};

export const drawEmoji = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: symbol
): void => {
    context.save();
    context.translate(x, y);

    const cx = HALF_START_BUTTON_SIZE;
    const cy = HALF_START_BUTTON_SIZE;

    drawFaceCircle(context, cx, cy);

    switch (symbol) {
        case defaultEmoji:
            drawNormalEyes(context, cx, cy);
            drawSmile(context, cx, cy);
            break;

        case waitingEmoji:
            drawNormalEyes(context, cx, cy);
            // Surprised "O" mouth
            context.strokeStyle = 'black';
            context.lineWidth = 1.3;
            context.beginPath();
            context.arc(cx, cy + 4, 2, 0, Math.PI * 2);
            context.stroke();
            break;

        case winnerEmoji:
            // Sunglasses — two elliptical lenses with a bridge between them
            context.fillStyle = 'black';
            context.beginPath();
            context.ellipse(cx - 5, cy - 3, 4, 3, 0, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.ellipse(cx + 5, cy - 3, 4, 3, 0, 0, Math.PI * 2);
            context.fill();
            // Bridge
            context.strokeStyle = 'black';
            context.lineWidth = 1.5;
            context.beginPath();
            context.moveTo(cx - 1, cy - 3);
            context.lineTo(cx + 1, cy - 3);
            context.stroke();
            drawSmile(context, cx, cy);
            break;

        case deadEmoji: {
            // X eyes
            context.strokeStyle = 'black';
            context.lineWidth = 1.3;
            context.beginPath();
            context.moveTo(cx - 6, cy - 5);
            context.lineTo(cx - 3, cy - 2);
            context.moveTo(cx - 6, cy - 2);
            context.lineTo(cx - 3, cy - 5);
            context.moveTo(cx + 3, cy - 5);
            context.lineTo(cx + 6, cy - 2);
            context.moveTo(cx + 3, cy - 2);
            context.lineTo(cx + 6, cy - 5);
            context.stroke();
            // Frown
            context.beginPath();
            context.arc(cx, cy + 6, 5, Math.PI * 1.2, Math.PI * 1.8);
            context.stroke();
            break;
        }
    }

    context.restore();
};
