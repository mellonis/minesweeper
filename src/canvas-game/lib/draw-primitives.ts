import {
    BACKGROUND_COLOR,
    CELL_BORDER_WIDTH,
    CELL_SIZE, COUNTER_BORDER_WIDTH,
    START_BUTTON_SIZE,
    unrevealedCellColorsTuples
} from "./consts.ts";
import {UnrevealedCellBackgroundState} from "./types.ts";

export const drawRect = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    borderWidth: number,
    borderTopColor: string,
    borderBottomColor: string,
    backgroundColor?: string,
): void => {
    context.save();
    context.translate(x, y);

    if (backgroundColor) {
        context.beginPath();
        context.fillStyle = backgroundColor;
        context.rect(0, 0, width, height);
        context.fill();
        context.closePath();
    }

    borderWidth *= 2;

    const clipBorderSize = Math.min(borderWidth, width / 2, height / 2);

    context.save();
    context.beginPath();
    context.lineWidth = 1;
    context.moveTo(0, 0);
    context.lineTo(width, 0);
    context.lineTo(width - clipBorderSize, clipBorderSize);
    context.lineTo(clipBorderSize, height - clipBorderSize);
    context.lineTo(0, height);
    context.lineTo(0, 0);
    context.clip();
    context.lineWidth = borderWidth;
    context.beginPath();
    context.moveTo(0, height);
    context.lineTo(0, 0);
    context.lineTo(width, 0);
    context.strokeStyle = borderTopColor;
    context.stroke();
    context.closePath();
    context.restore();

    context.save();
    context.beginPath();
    context.moveTo(width, 0);
    context.lineTo(width, height);
    context.lineTo(0, height);
    context.lineTo(clipBorderSize, height - clipBorderSize);
    context.lineTo(width - clipBorderSize, clipBorderSize);
    context.lineTo(width, 0);
    context.clip();
    context.lineWidth = borderWidth;
    context.beginPath();
    context.moveTo(width, 0);
    context.lineTo(width, height);
    context.lineTo(0, height);
    context.strokeStyle = borderBottomColor;
    context.stroke();
    context.closePath();
    context.restore();

    context.restore();
};

export const enum ButtonType {
    Default,
    Cell
}

const buttonTypeToButtonSizesMap: Record<ButtonType, [number, number, number]> = {
    [ButtonType.Default]: [START_BUTTON_SIZE, START_BUTTON_SIZE, COUNTER_BORDER_WIDTH],
    [ButtonType.Cell]: [CELL_SIZE, CELL_SIZE, CELL_BORDER_WIDTH],
};

export const drawButton = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: ButtonType,
    state = UnrevealedCellBackgroundState.default
): void => {
    const [borderTopColor, borderBottomColor] = unrevealedCellColorsTuples[state];

    drawRect(context, x, y, ...buttonTypeToButtonSizesMap[type], borderTopColor, borderBottomColor, BACKGROUND_COLOR);
};
