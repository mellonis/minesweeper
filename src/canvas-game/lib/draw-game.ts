import {drawRect} from "./draw-primitives.ts";
import {
    BACKGROUND_COLOR,
    BORDER_DARKEN_COLOR,
    BORDER_LIGHTEN_COLOR,
    CELL_SIZE,
    FIELD_X_POSITION,
    FIELD_Y_POSITION,
    GAME_HEIGHT_WITHOUT_FIELD_AND_PANEL,
    GAME_PANEL_HEIGHT,
    GAME_WIDTH_WITHOUT_FIELD,
    INTERFACE_BORDER_WIDTH,
    START_BUTTON_SIZE,
    START_BUTTON_Y_POSITION,
} from "./consts.ts";
import {drawSprite} from "./sprites.ts";
import {MouseState, MouseStates} from "../types.ts";
import {getMouseStateSpriteIndex} from "./utils.ts";
import {Snapshot as MinesweeperSnapshot, win as winSymbol} from "../../minesweeper";

export const drawGame = (context: CanvasRenderingContext2D, cols: number, rows: number): void => {
    const fieldWidth = cols * CELL_SIZE;
    const fieldHeight = rows * CELL_SIZE;
    const gameWidth = GAME_WIDTH_WITHOUT_FIELD + fieldWidth;
    const gameHeight = GAME_HEIGHT_WITHOUT_FIELD_AND_PANEL + GAME_PANEL_HEIGHT + fieldHeight;

    // draw game
    drawRect(
        context,
        0,
        0,
        gameWidth,
        gameHeight,
        INTERFACE_BORDER_WIDTH,
        BORDER_LIGHTEN_COLOR,
        BORDER_DARKEN_COLOR,
        BACKGROUND_COLOR
    );

    // draw panel border
    drawRect(
        context,
        FIELD_X_POSITION - INTERFACE_BORDER_WIDTH,
        FIELD_X_POSITION - INTERFACE_BORDER_WIDTH,
        fieldWidth + INTERFACE_BORDER_WIDTH * 2,
        GAME_PANEL_HEIGHT + INTERFACE_BORDER_WIDTH * 2,
        INTERFACE_BORDER_WIDTH,
        BORDER_DARKEN_COLOR,
        BORDER_LIGHTEN_COLOR
    );

    // draw field border
    drawRect(
        context,
        FIELD_X_POSITION - INTERFACE_BORDER_WIDTH,
        FIELD_Y_POSITION - INTERFACE_BORDER_WIDTH,
        fieldWidth + INTERFACE_BORDER_WIDTH * 2,
        fieldHeight + INTERFACE_BORDER_WIDTH * 2,
        INTERFACE_BORDER_WIDTH,
        BORDER_DARKEN_COLOR,
        BORDER_LIGHTEN_COLOR,
        'red',
    );
};

export const drawStartButton = (
    context: CanvasRenderingContext2D,
    isAboutToReveal: boolean,
    snapshot: MinesweeperSnapshot,
    {
        x: mouseX, y: mouseY, state: mouseState
    }: MouseStates,
) => {
    const fieldWidth = snapshot.cols * CELL_SIZE;
    const gameWidth = GAME_WIDTH_WITHOUT_FIELD + fieldWidth;
    const {x, y} = {x: Math.floor(gameWidth / 2 - START_BUTTON_SIZE / 2), y: START_BUTTON_Y_POSITION};
    const {x: startButtonX, y: startButtonY} = {x: mouseX - x, y: mouseY - y};
    const isMouseAboveStartButton = 0 <= startButtonX && 0 <= startButtonY && startButtonX < START_BUTTON_SIZE && startButtonY < START_BUTTON_SIZE;

    if (!isMouseAboveStartButton) {
        mouseState = MouseState.default;
    }

    const buttonSpriteIndex = getMouseStateSpriteIndex(mouseState, 27);
    const avatarSpriteIndex = (() => {
        const baseAvatarSpriteIndex = 30;

        if (snapshot.isGameOver === false) {
            //TODO: consider mouse down above field state
            return baseAvatarSpriteIndex + (isAboutToReveal ? 1 : 0);
        }

        return baseAvatarSpriteIndex + (snapshot.isGameOver === winSymbol ? 2 : 3);
    })();



    context.save();
    context.translate(Math.floor(gameWidth / 2 - START_BUTTON_SIZE / 2), START_BUTTON_Y_POSITION);

    drawSprite(context, buttonSpriteIndex)
    drawSprite(context, avatarSpriteIndex);

    context.restore();
};