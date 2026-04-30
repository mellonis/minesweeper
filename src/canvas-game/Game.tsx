import {FC, useEffect, useRef} from "react";
import {Snapshot as MinesweeperSnapshot} from "../minesweeper";
import {GetCellParams} from "../minesweeper/minesweeper.ts";
import {
    CELL_SIZE,
    drawGame,
    GAME_PANEL_HEIGHT,
    getCanvasCoords,
    getFieldColAndRow,
    prepareSprite,
    render as renderGame
} from "./lib";
import {MouseState, MouseStates} from "./types.ts";
import {GAME_HEIGHT_WITHOUT_FIELD_AND_PANEL, GAME_WIDTH_WITHOUT_FIELD} from "./lib/consts.ts";
import {useUpdatedOnRenderRef} from "../useUpdatedOnRenderRef.ts";

type Props = {
    snapshot: MinesweeperSnapshot;
    onReveal: (params: GetCellParams) => void;
    onMark: (params: GetCellParams) => void;
    onFieldMouseDown: VoidFunction;
    onFieldMouseUp: VoidFunction;
}

export const Game: FC<Props> = (props) => {
    const canvasElementRef = useRef<HTMLCanvasElement>(null);
    const propsRef = useUpdatedOnRenderRef(props);
    const canvasProps = {
        height: props.snapshot.rows * CELL_SIZE + GAME_HEIGHT_WITHOUT_FIELD_AND_PANEL + GAME_PANEL_HEIGHT,
        width: props.snapshot.cols * CELL_SIZE + GAME_WIDTH_WITHOUT_FIELD,
    };
    const mouseStateRef = useRef<MouseStates>({state: MouseState.default, x: 0, y: 0});

    useEffect(() => {
        prepareSprite();
    }, [])

    useEffect(() => {
        const {current: canvasElement} = canvasElementRef;

        if (!canvasElement) {
            return;
        }

        const context = canvasElement.getContext('2d', {
            alpha: false,
        });

        if (!context) {
            return;
        }

        const ratio = globalThis.devicePixelRatio;
        canvasElement.width = canvasProps.width * ratio;
        canvasElement.height = canvasProps.height * ratio;
        canvasElement.style.width = canvasProps.width + 'px';
        canvasElement.style.height = canvasProps.height + "px";
        context.scale(ratio, ratio);
        drawGame(context, propsRef.current.snapshot.cols, propsRef.current.snapshot.rows);
    }, [canvasProps.height, canvasProps.width, propsRef]);

    useEffect(() => {
        const {current: canvasElement} = canvasElementRef;

        if (!canvasElement) {
            return;
        }

        const context = canvasElement.getContext('2d');

        if (!context) {
            return;
        }

        let animationFrameId: number;

        const render = (time: number) => {
            renderGame(context, mouseStateRef.current, propsRef.current.snapshot, Math.trunc(time / 1000));
            animationFrameId = globalThis.requestAnimationFrame(render);
        }

        render(0);

        return () => {
            globalThis.cancelAnimationFrame(animationFrameId);
        }
    }, [canvasProps.height, canvasProps.width, propsRef]);

    useEffect(() => {
        const {current: canvasElement} = canvasElementRef;

        if (!canvasElement) {
            return;
        }

        const handleMouseMove = (event: MouseEvent) => {
            Object.assign(mouseStateRef.current, getCanvasCoords(canvasElement, event));
        };
        const handleMouseEnter = () => {
            Object.assign(mouseStateRef.current, {state: MouseState.hover})
        };
        const handleMouseLeave = () => {
            Object.assign(mouseStateRef.current, {state: MouseState.default, x: 0, y: 0})
        };
        const handleMouseDown = (event: MouseEvent) => {
            const colAndRow = getFieldColAndRow(canvasElement, event);

            if (
                colAndRow.col >= 0 && colAndRow.col < propsRef.current.snapshot.cols &&
                colAndRow.row >= 0 && colAndRow.row < propsRef.current.snapshot.rows
            ) {
                propsRef.current.onFieldMouseDown()
            }

            Object.assign(mouseStateRef.current, {state: MouseState.active});
        };
        const handleMouseUp = () => {
            propsRef.current.onFieldMouseUp();
            Object.assign(mouseStateRef.current, {state: MouseState.hover});
        };
        const handleMouseClick = (event: MouseEvent) => {
            const colAndRow = getFieldColAndRow(canvasElement, event);

            if (
                colAndRow.col >= 0 && colAndRow.col < propsRef.current.snapshot.cols &&
                colAndRow.row >= 0 && colAndRow.row < propsRef.current.snapshot.rows
            ) {
                propsRef.current.onReveal(colAndRow);
            }
        };
        const handleContextMenu = (event: MouseEvent) => {
            event.preventDefault();

            const colAndRow = getFieldColAndRow(canvasElement, event);

            if (
                colAndRow.col >= 0 && colAndRow.col < propsRef.current.snapshot.cols &&
                colAndRow.row >= 0 && colAndRow.row < propsRef.current.snapshot.rows
            ) {
                propsRef.current.onMark(getFieldColAndRow(canvasElement, event));
            }

        };

        const abortController = new AbortController();

        canvasElement.addEventListener('mouseenter', handleMouseEnter, {
            signal: abortController.signal,
        });
        canvasElement.addEventListener('mouseleave', handleMouseLeave, {
            signal: abortController.signal,
        });
        canvasElement.addEventListener('mousemove', handleMouseMove, {
            signal: abortController.signal,
        });
        canvasElement.addEventListener('mousedown', handleMouseDown, {
            signal: abortController.signal,
        });
        canvasElement.addEventListener('mouseup', handleMouseUp, {
            signal: abortController.signal,
        });
        canvasElement.addEventListener('click', handleMouseClick, {
            signal: abortController.signal,
        });
        canvasElement.addEventListener('contextmenu', handleContextMenu, {
            signal: abortController.signal,
        });

        return () => {
            abortController.abort();
        }
    }, [canvasProps.height, canvasProps.width, propsRef]);

    return <canvas key={`${props.snapshot.cols}x${props.snapshot.rows}`} ref={canvasElementRef} {...canvasProps}/>;
};