import {drawField} from "./draw-field.ts";
import {MouseStates} from "../types.ts";
import {Snapshot as MinesweeperSnapshot} from "../../minesweeper";
import {drawCounter, drawTimer} from "./draw-counter.ts";
import {drawStartButton} from "./draw-game.ts";

export {CELL_SIZE, INTERFACE_BORDER_WIDTH, GAME_PANEL_HEIGHT} from "./consts.ts";

export {getCanvasCoords, getFieldColAndRow} from "./utils.ts";
export {prepareSprite} from "./sprites.ts";
export {drawGame} from "./draw-game.ts";

export const render = (
    context: CanvasRenderingContext2D,
    mouseStates: MouseStates,
    snapshot: MinesweeperSnapshot,
    time: number
) => {
    drawCounter(context, snapshot.marksLeft);
    drawTimer(context, snapshot.cols, time);

    const isAboutToReveal = drawField(context, mouseStates, snapshot);

    drawStartButton(context, isAboutToReveal, snapshot, mouseStates);
}