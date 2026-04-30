import {drawRect} from "./draw-primitives.ts";
import {drawSprite} from "./sprites.ts";
import {BORDER_DARKEN_COLOR, BORDER_LIGHTEN_COLOR} from "./consts.ts";

export type Bounds = Readonly<{ x: number; y: number; w: number; h: number }>;
export type WidgetId = number;
export type WidgetState = { hovered: boolean; pressed: boolean };
export type BorderStyle = 'raised' | 'sunken';

export interface WidgetParams {
    bounds: Bounds;
    z?: number;
}

export interface BevelParams {
    borderWidth: number;
    borderStyle: BorderStyle;
    background?: string;
}

let nextWidgetId: WidgetId = 1;

const bevelColors = (style: BorderStyle): [string, string] =>
    style === 'raised'
        ? [BORDER_LIGHTEN_COLOR, BORDER_DARKEN_COLOR]
        : [BORDER_DARKEN_COLOR, BORDER_LIGHTEN_COLOR];

export abstract class Widget {
    readonly id: WidgetId;
    readonly bounds: Bounds;
    z: number;

    protected constructor(params: WidgetParams) {
        this.id = nextWidgetId++;
        this.bounds = params.bounds;
        this.z = params.z ?? 0;
    }

    abstract draw(ctx: CanvasRenderingContext2D, state: WidgetState): void;

    drawPicking(ctx: CanvasRenderingContext2D, color: string): void {
        ctx.fillStyle = color;
        ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
    }

    get isInteractive(): boolean {
        return false;
    }
}

export interface PanelParams extends WidgetParams, BevelParams {}

export class Panel extends Widget {
    borderWidth: number;
    borderStyle: BorderStyle;
    background?: string;

    constructor(params: PanelParams) {
        super(params);
        this.borderWidth = params.borderWidth;
        this.borderStyle = params.borderStyle;
        this.background = params.background;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const {x, y, w, h} = this.bounds;
        const [top, bottom] = bevelColors(this.borderStyle);
        drawRect(ctx, x, y, w, h, this.borderWidth, top, bottom, this.background);
    }
}

export interface CanvasWidgetParams extends WidgetParams {
    render: (ctx: CanvasRenderingContext2D, state: WidgetState) => void;
}

export class Canvas extends Widget {
    private readonly render: (ctx: CanvasRenderingContext2D, state: WidgetState) => void;

    constructor(params: CanvasWidgetParams) {
        super(params);
        this.render = params.render;
    }

    draw(ctx: CanvasRenderingContext2D, state: WidgetState): void {
        ctx.save();
        ctx.translate(this.bounds.x, this.bounds.y);
        this.render(ctx, state);
        ctx.restore();
    }
}

export interface ButtonSprite {
    base: number;
    hoverOffset?: number;
    pressedOffset?: number;
}

export interface ButtonParams extends WidgetParams, Partial<BevelParams> {
    sprite?: ButtonSprite | null;
    overlay?: (() => number | null) | null;
    disabled?: boolean;
    onClick?: () => void;
    onContextMenu?: () => void;
    onPointerDown?: () => void;
    onPointerUp?: () => void;
}

export class Button extends Widget {
    borderWidth?: number;
    borderStyle?: BorderStyle;
    background?: string;
    sprite?: ButtonSprite | null;
    overlay?: (() => number | null) | null;
    disabled: boolean;
    onClick?: () => void;
    onContextMenu?: () => void;
    onPointerDown?: () => void;
    onPointerUp?: () => void;

    constructor(params: ButtonParams) {
        super(params);
        this.borderWidth = params.borderWidth;
        this.borderStyle = params.borderStyle;
        this.background = params.background;
        this.sprite = params.sprite;
        this.overlay = params.overlay;
        this.disabled = params.disabled ?? false;
        this.onClick = params.onClick;
        this.onContextMenu = params.onContextMenu;
        this.onPointerDown = params.onPointerDown;
        this.onPointerUp = params.onPointerUp;
    }

    get isInteractive(): boolean {
        return Boolean(this.onClick || this.onContextMenu || this.onPointerDown || this.onPointerUp);
    }

    draw(ctx: CanvasRenderingContext2D, state: WidgetState): void {
        const {x, y, w, h} = this.bounds;

        if (this.borderStyle && this.borderWidth) {
            const [top, bottom] = bevelColors(this.borderStyle);
            drawRect(ctx, x, y, w, h, this.borderWidth, top, bottom, this.background);
        } else if (this.background) {
            ctx.fillStyle = this.background;
            ctx.fillRect(x, y, w, h);
        }

        if (this.sprite) {
            const offset = this.disabled
                ? 0
                : state.pressed
                    ? (this.sprite.pressedOffset ?? 0)
                    : state.hovered
                        ? (this.sprite.hoverOffset ?? 0)
                        : 0;
            ctx.save();
            ctx.translate(x, y);
            drawSprite(ctx, this.sprite.base + offset);
            ctx.restore();
        }

        if (this.overlay) {
            const idx = this.overlay();
            if (idx !== null && idx >= 0) {
                ctx.save();
                ctx.translate(x, y);
                drawSprite(ctx, idx);
                ctx.restore();
            }
        }
    }
}
