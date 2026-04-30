import {
    cell as cellSymbol,
    explosion as explosionSymbol,
    mark as markSymbol,
    mine as mineSymbol,
    Minesweeper,
    missMark as missMarkSymbol,
    Snapshot as MinesweeperSnapshot,
    win as winSymbol,
} from "../minesweeper";
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

    let angle = (Math.random() - 0.5) * 0.03;
    if (bounced) angle += (Math.random() - 0.5) * 0.6;
    const cs = Math.cos(angle);
    const sn = Math.sin(angle);
    const nvx = aim.vx * cs - aim.vy * sn;
    const nvy = aim.vx * sn + aim.vy * cs;

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

export type GameLevelFactory = () => Minesweeper;

export class Game {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly manager = new WidgetManager();
    private readonly abortController = new AbortController();

    private minesweeper: Minesweeper;
    private snapshot: MinesweeperSnapshot;
    private cells: Button[] = [];
    private aimState: AimState;
    private aimVisible = true;
    private lastActivity = -1;
    private timerStart: number | null = null;
    private timerEnd: number | null = null;
    private rafId = 0;

    constructor(
        container: HTMLElement,
        private readonly levelFactory: GameLevelFactory,
    ) {
        prepareSprite();

        this.minesweeper = this.levelFactory();
        this.snapshot = this.minesweeper.getSnapShot();
        this.aimState = initAim(this.snapshot.cols * CELL_SIZE, this.snapshot.rows * CELL_SIZE);

        this.canvas = document.createElement('canvas');
        container.appendChild(this.canvas);

        const ctx = this.canvas.getContext('2d', {alpha: false});
        if (!ctx) throw new Error("Can't get canvas 2D context");
        this.ctx = ctx;

        this.setupCanvas();
        this.buildWidgets();
        this.attachListeners();
        this.startRenderLoop();
    }

    dispose(): void {
        if (this.rafId !== 0) globalThis.cancelAnimationFrame(this.rafId);
        this.abortController.abort();
        this.canvas.remove();
    }

    private get canvasWidth(): number {
        return this.snapshot.cols * CELL_SIZE + GAME_WIDTH_WITHOUT_FIELD;
    }

    private get canvasHeight(): number {
        return this.snapshot.rows * CELL_SIZE + GAME_HEIGHT_WITHOUT_FIELD_AND_PANEL + GAME_PANEL_HEIGHT;
    }

    private setupCanvas(): void {
        const dpr = globalThis.devicePixelRatio;
        this.canvas.width = this.canvasWidth * dpr;
        this.canvas.height = this.canvasHeight * dpr;
        this.canvas.style.width = this.canvasWidth + 'px';
        this.canvas.style.height = this.canvasHeight + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.manager.resize(this.canvasWidth, this.canvasHeight);
    }

    private buildWidgets(): void {
        this.manager.clear();
        this.aimState = initAim(this.snapshot.cols * CELL_SIZE, this.snapshot.rows * CELL_SIZE);

        const {cols, rows} = this.snapshot;
        const fieldWidth = cols * CELL_SIZE;
        const fieldHeight = rows * CELL_SIZE;
        const gameWidth = this.canvasWidth;
        const gameHeight = this.canvasHeight;

        // Outer game frame (raised)
        this.manager.add(new Panel({
            bounds: {x: 0, y: 0, w: gameWidth, h: gameHeight},
            borderWidth: INTERFACE_BORDER_WIDTH,
            borderStyle: 'raised',
            background: BACKGROUND_COLOR,
        }));

        // Panel border (sunken)
        this.manager.add(new Panel({
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
        this.manager.add(new Panel({
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
        this.manager.add(new Canvas({
            bounds: {
                x: MARKS_COUNTER_X_POSITION,
                y: MARKS_COUNTER_Y_POSITION,
                w: COUNTER_DIGIT_WIDTH * 3,
                h: COUNTER_DIGIT_HEIGHT,
            },
            render: (c) => drawCommonCounter(c, this.timerStart === null ? 888 : this.snapshot.marksLeft),
        }));

        // Timer
        this.manager.add(new Canvas({
            bounds: {
                x: gameWidth - COUNTER_DIGIT_WIDTH * 3 - MARKS_COUNTER_X_POSITION,
                y: TIMER_Y_POSITION,
                w: COUNTER_DIGIT_WIDTH * 3,
                h: COUNTER_DIGIT_HEIGHT,
            },
            render: (c) => {
                if (this.timerStart === null) return drawCommonCounter(c, 888);
                const end = this.timerEnd ?? performance.now();
                drawCommonCounter(c, Math.floor((end - this.timerStart) / 1000));
            },
        }));

        // Cells
        this.cells = [];
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
                    onClick: () => this.handleReveal(cellCol, cellRow),
                    onContextMenu: () => this.handleMark(cellCol, cellRow),
                });
                this.cells.push(button);
                this.manager.add(button);
            }
        }

        // Start button
        this.manager.add(new Button({
            bounds: {
                x: Math.floor(gameWidth / 2 - START_BUTTON_SIZE / 2),
                y: START_BUTTON_Y_POSITION,
                w: START_BUTTON_SIZE,
                h: START_BUTTON_SIZE,
            },
            sprite: {base: 27, hoverOffset: 1, pressedOffset: 2},
            overlay: () => {
                const baseAvatarSpriteIndex = 30;
                if (this.snapshot.isGameOver !== false) {
                    return baseAvatarSpriteIndex + (this.snapshot.isGameOver === winSymbol ? 2 : 3);
                }
                const pressed = this.manager.pressedWidget;
                const isAboutToReveal = pressed instanceof Button && this.cells.includes(pressed);
                return baseAvatarSpriteIndex + (isAboutToReveal ? 1 : 0);
            },
            onClick: () => this.handleStart(),
        }));

        // Aim — reticle that follows the hovered cell, or floats freely when the mouse is off-field
        this.manager.add(new Canvas({
            bounds: {x: FIELD_X_POSITION, y: FIELD_Y_POSITION, w: fieldWidth, h: fieldHeight},
            z: 10,
            render: (c) => {
                if (!this.aimVisible) return;
                const x = this.aimState.x;
                const y = this.aimState.y;
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
    }

    private attachListeners(): void {
        const {signal} = this.abortController;
        const markActive = () => {
            this.lastActivity = performance.now();
        };

        this.canvas.addEventListener('mousemove', (event) => {
            markActive();
            const {x, y} = getCanvasCoords(this.canvas, event);
            this.manager.handleMouseMove(x, y);
        }, {signal});

        this.canvas.addEventListener('mouseleave', () => {
            this.manager.handleMouseLeave();
        }, {signal});

        this.canvas.addEventListener('mousedown', (event) => {
            markActive();
            const {x, y} = getCanvasCoords(this.canvas, event);
            this.manager.handleMouseDown(x, y);
        }, {signal});

        this.canvas.addEventListener('mouseup', (event) => {
            markActive();
            const {x, y} = getCanvasCoords(this.canvas, event);
            this.manager.handleMouseUp(x, y);
        }, {signal});

        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            markActive();
            const {x, y} = getCanvasCoords(this.canvas, event);
            this.manager.handleContextMenu(x, y);
        }, {signal});
    }

    private handleReveal(col: number, row: number): void {
        if (this.timerStart === null) this.timerStart = performance.now();
        this.aimVisible = false;
        this.minesweeper.reveal({col, row});
        this.refreshSnapshot();
    }

    private handleMark(col: number, row: number): void {
        this.aimVisible = false;
        this.minesweeper.mark({col, row});
        this.refreshSnapshot();
    }

    private handleStart(): void {
        const oldDims = {cols: this.snapshot.cols, rows: this.snapshot.rows};
        this.minesweeper = this.levelFactory();
        this.snapshot = this.minesweeper.getSnapShot();
        this.timerStart = null;
        this.timerEnd = null;
        if (this.snapshot.cols !== oldDims.cols || this.snapshot.rows !== oldDims.rows) {
            this.setupCanvas();
            this.buildWidgets();
        }
        // Cell button states refresh in the next RAF tick via updateCellWidget on snapshot change.
    }

    private refreshSnapshot(): void {
        this.snapshot = this.minesweeper.getSnapShot();
        if (this.snapshot.isGameOver !== false && this.timerEnd === null) {
            this.timerEnd = performance.now();
            this.aimVisible = false;
        }
    }

    private startRenderLoop(): void {
        let lastSnapshot: MinesweeperSnapshot | null = null;
        let lastHover: Widget | null = null;
        let lastPress: Widget | null = null;
        let lastSecond = -1;
        let lastAimTime = -1;
        let lastAimVisible = false;

        const render = () => {
            const snapshot = this.snapshot;
            const now = performance.now();
            const second = Math.floor(now / 1000);
            const snapshotChanged = snapshot !== lastSnapshot;

            if (snapshotChanged) {
                const isGameOver = snapshot.isGameOver !== false;
                snapshot.cells.forEach((cellSym, i) => updateCellWidget(this.cells[i], cellSym, isGameOver));

                // Fresh-game detection (handles external new-game triggers too).
                if (snapshot.isGameOver === false && snapshot.cells.every(c => c === cellSymbol)) {
                    this.timerStart = null;
                    this.timerEnd = null;
                    if (!this.aimVisible) {
                        this.aimVisible = true;
                        this.aimState = initAim(snapshot.cols * CELL_SIZE, snapshot.rows * CELL_SIZE);
                    }
                }
            }

            this.manager.refreshHover();

            const hover = this.manager.hoveredWidget;
            const press = this.manager.pressedWidget;

            const aimDt = lastAimTime < 0 ? 0 : Math.min((now - lastAimTime) / 1000, AIM_MAX_DT);
            lastAimTime = now;

            if (!this.aimVisible
                && snapshot.isGameOver === false
                && this.lastActivity >= 0
                && now - this.lastActivity > AIM_IDLE_MS) {
                this.aimVisible = true;
                this.aimState = initAim(snapshot.cols * CELL_SIZE, snapshot.rows * CELL_SIZE);
            }
            const aimVisible = this.aimVisible;
            const aimVisibilityChanged = aimVisible !== lastAimVisible;

            const followingCell = hover instanceof Button && this.cells.includes(hover);
            let aimMoved = false;
            if (aimVisible && followingCell) {
                const idx = this.cells.indexOf(hover as Button);
                this.aimState.x = (idx % snapshot.cols) * CELL_SIZE + CELL_SIZE / 2;
                this.aimState.y = Math.floor(idx / snapshot.cols) * CELL_SIZE + CELL_SIZE / 2;
            } else if (aimVisible && aimDt > 0) {
                advanceAim(this.aimState, aimDt, snapshot.cols * CELL_SIZE, snapshot.rows * CELL_SIZE);
                aimMoved = true;
            }

            const timerRunning = this.timerStart !== null && this.timerEnd === null;

            if (snapshotChanged
                || hover !== lastHover
                || press !== lastPress
                || (timerRunning && second !== lastSecond)
                || aimMoved
                || aimVisibilityChanged) {
                this.canvas.style.cursor = hover ? 'pointer' : 'default';
                this.manager.draw(this.ctx);
                lastSnapshot = snapshot;
                lastHover = hover;
                lastPress = press;
                lastSecond = second;
                lastAimVisible = aimVisible;
            }

            this.rafId = globalThis.requestAnimationFrame(render);
        };
        render();
    }
}
