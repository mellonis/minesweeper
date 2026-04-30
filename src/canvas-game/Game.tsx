import {FC, useEffect, useRef} from "react";
import {
    cell as cellSymbol,
    explosion as explosionSymbol,
    mark as markSymbol,
    mine as mineSymbol,
    missMark as missMarkSymbol,
    Snapshot as MinesweeperSnapshot,
    win as winSymbol,
} from "../minesweeper";
import {GetCellParams} from "../minesweeper/minesweeper.ts";
import {
    BACKGROUND_COLOR,
    Button,
    Canvas,
    CELL_SIZE,
    COUNTER_DIGIT_HEIGHT,
    COUNTER_DIGIT_WIDTH,
    drawCommonCounter,
    FIELD_X_POSITION,
    FIELD_Y_POSITION,
    GAME_HEIGHT_WITHOUT_FIELD_AND_PANEL,
    GAME_PANEL_HEIGHT,
    GAME_WIDTH_WITHOUT_FIELD,
    getCanvasCoords,
    INTERFACE_BORDER_WIDTH,
    MARKS_COUNTER_X_POSITION,
    MARKS_COUNTER_Y_POSITION,
    Panel,
    prepareSprite,
    START_BUTTON_SIZE,
    START_BUTTON_Y_POSITION,
    TIMER_Y_POSITION,
    Widget,
    WidgetManager,
} from "./lib";
import {useUpdatedOnRenderRef} from "../useUpdatedOnRenderRef.ts";

type Props = {
    snapshot: MinesweeperSnapshot;
    onReveal: (params: GetCellParams) => void;
    onMark: (params: GetCellParams) => void;
    onFieldMouseDown: VoidFunction;
    onFieldMouseUp: VoidFunction;
    onStart: VoidFunction;
};

const AIM_SPEED = 200; // px/sec
const AIM_MAX_DT = 0.1; // seconds — clamp huge gaps after tab return / first frame
const AIM_IDLE_MS = 45000; // show aim after this much inactivity post-first-shot

type AimState = { x: number; y: number; vx: number; vy: number };

const initAim = (fieldW: number, fieldH: number): AimState => {
    const angle = Math.random() * Math.PI * 2;
    return {
        x: fieldW / 2,
        y: fieldH / 2,
        vx: Math.cos(angle) * AIM_SPEED,
        vy: Math.sin(angle) * AIM_SPEED,
    };
};

const advanceAim = (aim: AimState, dt: number, fieldW: number, fieldH: number): void => {
    aim.x += aim.vx * dt;
    aim.y += aim.vy * dt;

    let bounced = false;
    if (aim.x < 0) {
        aim.x = -aim.x;
        aim.vx = -aim.vx;
        bounced = true;
    } else if (aim.x > fieldW) {
        aim.x = 2 * fieldW - aim.x;
        aim.vx = -aim.vx;
        bounced = true;
    }
    if (aim.y < 0) {
        aim.y = -aim.y;
        aim.vy = -aim.vy;
        bounced = true;
    } else if (aim.y > fieldH) {
        aim.y = 2 * fieldH - aim.y;
        aim.vy = -aim.vy;
        bounced = true;
    }

    // Continuous small angle jitter, plus a bigger kick on bounce.
    let angle = (Math.random() - 0.5) * 0.03;
    if (bounced) angle += (Math.random() - 0.5) * 0.6;
    const cs = Math.cos(angle);
    const sn = Math.sin(angle);
    const nvx = aim.vx * cs - aim.vy * sn;
    const nvy = aim.vx * sn + aim.vy * cs;

    // Speed slowly drifts toward a random target in [70%, 130%] of base.
    const sp = Math.hypot(nvx, nvy) || 1;
    const targetSp = AIM_SPEED * (0.7 + Math.random() * 0.6);
    const newSp = sp + (targetSp - sp) * 0.02;
    aim.vx = nvx * newSp / sp;
    aim.vy = nvy * newSp / sp;
};

const updateCellWidget = (button: Button, symbol: number | symbol, isGameOver: boolean): void => {
    if (symbol === cellSymbol) {
        button.sprite = {base: 0, hoverOffset: 1, pressedOffset: 2};
        button.overlay = null;
        button.disabled = isGameOver;
        return;
    }
    if (symbol === markSymbol) {
        button.sprite = {base: 0, hoverOffset: 1, pressedOffset: 2};
        button.overlay = () => 13;
        button.disabled = isGameOver;
        return;
    }
    if (typeof symbol === 'number') {
        button.sprite = {base: 3};
        button.overlay = symbol > 0 ? () => 4 + symbol : null;
        button.disabled = true;
        return;
    }
    if (symbol === mineSymbol) {
        button.sprite = {base: 3};
        button.overlay = () => 14;
        button.disabled = true;
        return;
    }
    if (symbol === explosionSymbol) {
        button.sprite = {base: 4};
        button.overlay = () => 14;
        button.disabled = true;
        return;
    }
    if (symbol === missMarkSymbol) {
        button.sprite = {base: 3};
        button.overlay = () => 15;
        button.disabled = true;
        return;
    }
};

export const Game: FC<Props> = (props) => {
    const canvasElementRef = useRef<HTMLCanvasElement>(null);
    const propsRef = useUpdatedOnRenderRef(props);

    const canvasProps = {
        height: props.snapshot.rows * CELL_SIZE + GAME_HEIGHT_WITHOUT_FIELD_AND_PANEL + GAME_PANEL_HEIGHT,
        width: props.snapshot.cols * CELL_SIZE + GAME_WIDTH_WITHOUT_FIELD,
    };

    const managerRef = useRef<WidgetManager | null>(null);
    const cellsRef = useRef<Button[]>([]);
    const aimRef = useRef<AimState>({x: 0, y: 0, vx: 0, vy: 0});
    const aimVisibleRef = useRef(true);
    const lastActivityRef = useRef(-1);
    const timerStartRef = useRef<number | null>(null);
    const timerEndRef = useRef<number | null>(null);

    useEffect(() => {
        prepareSprite();
    }, []);

    // Build canvas + widgets when dimensions change
    useEffect(() => {
        const {current: canvas} = canvasElementRef;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', {alpha: false});
        if (!ctx) return;

        const dpr = globalThis.devicePixelRatio;
        canvas.width = canvasProps.width * dpr;
        canvas.height = canvasProps.height * dpr;
        canvas.style.width = canvasProps.width + 'px';
        canvas.style.height = canvasProps.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (!managerRef.current) managerRef.current = new WidgetManager();
        const mgr = managerRef.current;
        mgr.clear();
        mgr.resize(canvasProps.width, canvasProps.height);

        aimRef.current = initAim(propsRef.current.snapshot.cols * CELL_SIZE, propsRef.current.snapshot.rows * CELL_SIZE);

        const {cols, rows} = propsRef.current.snapshot;
        const fieldWidth = cols * CELL_SIZE;
        const fieldHeight = rows * CELL_SIZE;
        const gameWidth = canvasProps.width;
        const gameHeight = canvasProps.height;

        // Outer game frame (raised)
        mgr.add(new Panel({
            bounds: {x: 0, y: 0, w: gameWidth, h: gameHeight},
            borderWidth: INTERFACE_BORDER_WIDTH,
            borderStyle: 'raised',
            background: BACKGROUND_COLOR,
        }));

        // Panel border (sunken)
        mgr.add(new Panel({
            bounds: {
                x: FIELD_X_POSITION - INTERFACE_BORDER_WIDTH,
                y: FIELD_X_POSITION - INTERFACE_BORDER_WIDTH,
                w: fieldWidth + INTERFACE_BORDER_WIDTH * 2,
                h: GAME_PANEL_HEIGHT + INTERFACE_BORDER_WIDTH * 2,
            },
            borderWidth: INTERFACE_BORDER_WIDTH,
            borderStyle: 'sunken',
        }));

        // Field border (sunken, red bg shows on explosion)
        mgr.add(new Panel({
            bounds: {
                x: FIELD_X_POSITION - INTERFACE_BORDER_WIDTH,
                y: FIELD_Y_POSITION - INTERFACE_BORDER_WIDTH,
                w: fieldWidth + INTERFACE_BORDER_WIDTH * 2,
                h: fieldHeight + INTERFACE_BORDER_WIDTH * 2,
            },
            borderWidth: INTERFACE_BORDER_WIDTH,
            borderStyle: 'sunken',
            background: 'red',
        }));

        // Marks-left counter
        mgr.add(new Canvas({
            bounds: {
                x: MARKS_COUNTER_X_POSITION,
                y: MARKS_COUNTER_Y_POSITION,
                w: COUNTER_DIGIT_WIDTH * 3,
                h: COUNTER_DIGIT_HEIGHT,
            },
            render: (c) => drawCommonCounter(c, timerStartRef.current === null ? 888 : propsRef.current.snapshot.marksLeft),
        }));

        // Timer
        mgr.add(new Canvas({
            bounds: {
                x: gameWidth - COUNTER_DIGIT_WIDTH * 3 - MARKS_COUNTER_X_POSITION,
                y: TIMER_Y_POSITION,
                w: COUNTER_DIGIT_WIDTH * 3,
                h: COUNTER_DIGIT_HEIGHT,
            },
            render: (c) => {
                const start = timerStartRef.current;
                if (start === null) return drawCommonCounter(c, 888);
                const end = timerEndRef.current ?? performance.now();
                drawCommonCounter(c, Math.floor((end - start) / 1000));
            },
        }));

        // Cells
        const cells: Button[] = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cellCol = col;
                const cellRow = row;
                const button = new Button({
                    bounds: {
                        x: FIELD_X_POSITION + cellCol * CELL_SIZE,
                        y: FIELD_Y_POSITION + cellRow * CELL_SIZE,
                        w: CELL_SIZE,
                        h: CELL_SIZE,
                    },
                    sprite: {base: 0, hoverOffset: 1, pressedOffset: 2},
                    onClick: () => {
                        if (timerStartRef.current === null) timerStartRef.current = performance.now();
                        aimVisibleRef.current = false;
                        propsRef.current.onReveal({col: cellCol, row: cellRow});
                    },
                    onContextMenu: () => {
                        aimVisibleRef.current = false;
                        propsRef.current.onMark({col: cellCol, row: cellRow});
                    },
                    onPointerDown: () => propsRef.current.onFieldMouseDown(),
                    onPointerUp: () => propsRef.current.onFieldMouseUp(),
                });
                cells.push(button);
                mgr.add(button);
            }
        }
        cellsRef.current = cells;

        // Start button
        mgr.add(new Button({
            bounds: {
                x: Math.floor(gameWidth / 2 - START_BUTTON_SIZE / 2),
                y: START_BUTTON_Y_POSITION,
                w: START_BUTTON_SIZE,
                h: START_BUTTON_SIZE,
            },
            sprite: {base: 27, hoverOffset: 1, pressedOffset: 2},
            overlay: () => {
                const snap = propsRef.current.snapshot;
                const baseAvatarSpriteIndex = 30;
                if (snap.isGameOver !== false) {
                    return baseAvatarSpriteIndex + (snap.isGameOver === winSymbol ? 2 : 3);
                }
                const pressed = mgr.pressedWidget;
                const isAboutToReveal = pressed instanceof Button && cellsRef.current.includes(pressed);
                return baseAvatarSpriteIndex + (isAboutToReveal ? 1 : 0);
            },
            onClick: () => propsRef.current.onStart(),
        }));

        // Aim — reticle that follows the hovered cell, or floats freely when the mouse is off-field.
        // Hidden after the first reveal until 30s of inactivity.
        mgr.add(new Canvas({
            bounds: {x: FIELD_X_POSITION, y: FIELD_Y_POSITION, w: fieldWidth, h: fieldHeight},
            z: 10,
            render: (c) => {
                if (!aimVisibleRef.current) return;
                const x = aimRef.current.x;
                const y = aimRef.current.y;
                const r = 8;
                const tick = 14;

                c.strokeStyle = 'red';
                c.fillStyle = 'red';
                c.lineWidth = 1.5;

                c.beginPath();
                c.arc(x, y, r, 0, Math.PI * 2);
                c.stroke();

                c.beginPath();
                c.moveTo(x, y - tick);
                c.lineTo(x, y - r);
                c.moveTo(x, y + r);
                c.lineTo(x, y + tick);
                c.moveTo(x - tick, y);
                c.lineTo(x - r, y);
                c.moveTo(x + r, y);
                c.lineTo(x + tick, y);
                c.stroke();

                c.beginPath();
                c.arc(x, y, 1.5, 0, Math.PI * 2);
                c.fill();
            },
        }));
    }, [canvasProps.height, canvasProps.width, propsRef]);

    // RAF loop
    useEffect(() => {
        const {current: canvas} = canvasElementRef;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        let lastSnapshot: MinesweeperSnapshot | null = null;
        let lastHover: Widget | null = null;
        let lastPress: Widget | null = null;
        let lastSecond = -1;
        let lastAimTime = -1;
        let lastAimVisible = false;

        const render = () => {
            const mgr = managerRef.current;
            if (!mgr) {
                frameId = globalThis.requestAnimationFrame(render);
                return;
            }

            const snapshot = propsRef.current.snapshot;
            const now = performance.now();
            const second = Math.floor(now / 1000);
            const snapshotChanged = snapshot !== lastSnapshot;

            if (snapshotChanged) {
                const isGameOver = snapshot.isGameOver !== false;
                snapshot.cells.forEach((cell, i) => updateCellWidget(cellsRef.current[i], cell, isGameOver));

                // Fresh game detection — first snapshot of a new game has no revealed cells and isn't game-over.
                // This catches both canvas and DOM start-button paths.
                if (snapshot.isGameOver === false && snapshot.cells.every(c => c === cellSymbol)) {
                    timerStartRef.current = null;
                    timerEndRef.current = null;
                    if (!aimVisibleRef.current) {
                        aimVisibleRef.current = true;
                        aimRef.current = initAim(snapshot.cols * CELL_SIZE, snapshot.rows * CELL_SIZE);
                    }
                }

                // Game-over detection — freeze the timer and hide the aim until a new game starts.
                if (snapshot.isGameOver !== false && timerEndRef.current === null) {
                    timerEndRef.current = performance.now();
                    aimVisibleRef.current = false;
                }
            }

            mgr.refreshHover();

            const hover = mgr.hoveredWidget;
            const press = mgr.pressedWidget;

            const aimDt = lastAimTime < 0 ? 0 : Math.min((now - lastAimTime) / 1000, AIM_MAX_DT);
            lastAimTime = now;

            // Aim re-emerges after AIM_IDLE_MS of inactivity. Only a click hides it again (handled in cell handlers).
            // Disabled while a game is over — aim stays hidden until a new game starts.
            if (!aimVisibleRef.current && snapshot.isGameOver === false && lastActivityRef.current >= 0 && now - lastActivityRef.current > AIM_IDLE_MS) {
                aimVisibleRef.current = true;
                aimRef.current = initAim(snapshot.cols * CELL_SIZE, snapshot.rows * CELL_SIZE);
            }
            const aimVisible = aimVisibleRef.current;
            const aimVisibilityChanged = aimVisible !== lastAimVisible;

            const followingCell = hover instanceof Button && cellsRef.current.includes(hover);
            let aimMoved = false;
            if (aimVisible && followingCell) {
                const idx = cellsRef.current.indexOf(hover as Button);
                aimRef.current.x = (idx % snapshot.cols) * CELL_SIZE + CELL_SIZE / 2;
                aimRef.current.y = Math.floor(idx / snapshot.cols) * CELL_SIZE + CELL_SIZE / 2;
            } else if (aimVisible && aimDt > 0) {
                advanceAim(aimRef.current, aimDt, snapshot.cols * CELL_SIZE, snapshot.rows * CELL_SIZE);
                aimMoved = true;
            }

            // Timer needs a per-second redraw too while running.
            const timerRunning = timerStartRef.current !== null && timerEndRef.current === null;

            if (snapshotChanged || hover !== lastHover || press !== lastPress || (timerRunning && second !== lastSecond) || aimMoved || aimVisibilityChanged) {
                canvas.style.cursor = hover ? 'pointer' : 'default';
                mgr.draw(ctx);
                lastSnapshot = snapshot;
                lastHover = hover;
                lastPress = press;
                lastSecond = second;
                lastAimVisible = aimVisible;
            }

            frameId = globalThis.requestAnimationFrame(render);
        };
        render();
        return () => globalThis.cancelAnimationFrame(frameId);
    }, [canvasProps.height, canvasProps.width, propsRef]);

    // Mouse events
    useEffect(() => {
        const {current: canvas} = canvasElementRef;
        if (!canvas) return;

        const ac = new AbortController();

        const markActive = () => { lastActivityRef.current = performance.now(); };

        canvas.addEventListener('mousemove', (event) => {
            markActive();
            const {x, y} = getCanvasCoords(canvas, event);
            managerRef.current?.handleMouseMove(x, y);
        }, {signal: ac.signal});

        canvas.addEventListener('mouseleave', () => {
            managerRef.current?.handleMouseLeave();
        }, {signal: ac.signal});

        canvas.addEventListener('mousedown', (event) => {
            markActive();
            const {x, y} = getCanvasCoords(canvas, event);
            managerRef.current?.handleMouseDown(x, y);
        }, {signal: ac.signal});

        canvas.addEventListener('mouseup', (event) => {
            markActive();
            const {x, y} = getCanvasCoords(canvas, event);
            managerRef.current?.handleMouseUp(x, y);
        }, {signal: ac.signal});

        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            markActive();
            const {x, y} = getCanvasCoords(canvas, event);
            managerRef.current?.handleContextMenu(x, y);
        }, {signal: ac.signal});

        return () => ac.abort();
    }, [canvasProps.height, canvasProps.width, propsRef]);

    return <canvas key={`${props.snapshot.cols}x${props.snapshot.rows}`} ref={canvasElementRef} {...canvasProps}/>;
};
