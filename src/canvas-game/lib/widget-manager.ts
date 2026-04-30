import {Button, Widget, WidgetId} from "./widgets.ts";

const colorCache = new Map<WidgetId, string>();
const idToColor = (id: WidgetId): string => {
    let c = colorCache.get(id);
    if (c === undefined) {
        c = '#' + id.toString(16).padStart(6, '0');
        colorCache.set(id, c);
    }
    return c;
};

const isDisabled = (w: Widget): boolean => w instanceof Button && w.disabled;

export class WidgetManager {
    private readonly widgets = new Set<Widget>();
    private readonly widgetById = new Map<WidgetId, Widget>();
    private readonly pickCanvas: HTMLCanvasElement;
    private readonly pickCtx: CanvasRenderingContext2D;
    private readonly dpr: number;
    private cssWidth = 0;
    private cssHeight = 0;
    private layoutDirty = true;

    private hoveredId: WidgetId | 0 = 0;
    private pressedId: WidgetId | 0 = 0;
    private lastMouseX = -1;
    private lastMouseY = -1;

    get pressedWidget(): Widget | null {
        return this.pressedId !== 0 ? this.widgetById.get(this.pressedId) ?? null : null;
    }

    get hoveredWidget(): Widget | null {
        return this.hoveredId !== 0 ? this.widgetById.get(this.hoveredId) ?? null : null;
    }

    constructor() {
        this.dpr = globalThis.devicePixelRatio;
        this.pickCanvas = document.createElement('canvas');
        // alpha: false → the buffer is opaque black, so id 0 (never assigned) is the miss sentinel.
        const ctx = this.pickCanvas.getContext('2d', {alpha: false, willReadFrequently: true});
        if (!ctx) throw new Error("Can't create pick canvas context");
        ctx.imageSmoothingEnabled = false;
        this.pickCtx = ctx;
    }

    add(widget: Widget): void {
        this.widgets.add(widget);
        this.widgetById.set(widget.id, widget);
        this.layoutDirty = true;
    }

    remove(widget: Widget): void {
        this.widgets.delete(widget);
        this.widgetById.delete(widget.id);
        if (this.hoveredId === widget.id) this.hoveredId = 0;
        if (this.pressedId === widget.id) this.pressedId = 0;
        this.layoutDirty = true;
    }

    clear(): void {
        this.widgets.clear();
        this.widgetById.clear();
        this.hoveredId = 0;
        this.pressedId = 0;
        this.layoutDirty = true;
    }

    resize(cssWidth: number, cssHeight: number): void {
        this.cssWidth = cssWidth;
        this.cssHeight = cssHeight;
        this.pickCanvas.width = cssWidth * this.dpr;
        this.pickCanvas.height = cssHeight * this.dpr;
        this.pickCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.pickCtx.imageSmoothingEnabled = false;
        this.layoutDirty = true;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.layoutDirty) this.repaintPickCanvas();
        // Array.prototype.sort is stable (ES2019+), so equal-z widgets keep registration order.
        const sorted = [...this.widgets].sort((a, b) => a.z - b.z);
        for (const w of sorted) {
            w.draw(ctx, {hovered: this.hoveredId === w.id, pressed: this.pressedId === w.id});
        }
    }

    handleMouseMove(cssX: number, cssY: number): void {
        this.lastMouseX = cssX;
        this.lastMouseY = cssY;
        const w = this.pickAt(cssX, cssY);
        this.hoveredId = w && !isDisabled(w) ? w.id : 0;
    }

    handleMouseLeave(): void {
        this.lastMouseX = -1;
        this.lastMouseY = -1;
        this.hoveredId = 0;
        this.pressedId = 0;
    }

    refreshHover(): void {
        if (this.lastMouseX < 0) return;
        const w = this.pickAt(this.lastMouseX, this.lastMouseY);
        this.hoveredId = w && !isDisabled(w) ? w.id : 0;
    }

    handleMouseDown(cssX: number, cssY: number): void {
        const w = this.pickAt(cssX, cssY);
        if (!w || isDisabled(w)) {
            this.pressedId = 0;
            return;
        }
        this.pressedId = w.id;
        if (w instanceof Button) w.onPointerDown?.();
    }

    handleMouseUp(cssX: number, cssY: number): void {
        const pressed = this.pressedId !== 0 ? this.widgetById.get(this.pressedId) : null;
        const released = this.pickAt(cssX, cssY);
        this.pressedId = 0;

        if (pressed instanceof Button && !isDisabled(pressed)) {
            pressed.onPointerUp?.();
            if (pressed === released) pressed.onClick?.();
        }
    }

    handleContextMenu(cssX: number, cssY: number): void {
        const w = this.pickAt(cssX, cssY);
        if (w instanceof Button && !isDisabled(w)) w.onContextMenu?.();
    }

    private pickAt(cssX: number, cssY: number): Widget | null {
        if (cssX < 0 || cssY < 0 || cssX >= this.cssWidth || cssY >= this.cssHeight) return null;
        if (this.layoutDirty) this.repaintPickCanvas();
        const px = Math.floor(cssX * this.dpr);
        const py = Math.floor(cssY * this.dpr);
        const data = this.pickCtx.getImageData(px, py, 1, 1).data;
        const id = (data[0] << 16) | (data[1] << 8) | data[2];
        if (id === 0) return null;
        return this.widgetById.get(id) ?? null;
    }

    private repaintPickCanvas(): void {
        this.pickCtx.clearRect(0, 0, this.cssWidth, this.cssHeight);
        for (const w of this.widgets) {
            if (!w.isInteractive) continue;
            w.drawPicking(this.pickCtx, idToColor(w.id));
        }
        this.layoutDirty = false;
    }
}
