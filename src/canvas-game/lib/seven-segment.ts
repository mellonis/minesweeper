// Classic 7-segment LCD digit. Each segment is a hexagonal "stick" that tapers
// at its ends. With a non-zero `gap` adjacent segments leave visible space
// between them so a fully-lit "8" reads as 7 distinct segments.
//
//   +--a--+
//   |     |
//   f     b
//   |     |
//   +--g--+
//   |     |
//   e     c
//   |     |
//   +--d--+

type SegmentLit = readonly [number, number, number, number, number, number, number];

export const SEVEN_SEGMENT_PATTERNS: Record<number, SegmentLit> = {
    0: [1, 1, 1, 1, 1, 1, 0],
    1: [0, 1, 1, 0, 0, 0, 0],
    2: [1, 1, 0, 1, 1, 0, 1],
    3: [1, 1, 1, 1, 0, 0, 1],
    4: [0, 1, 1, 0, 0, 1, 1],
    5: [1, 0, 1, 1, 0, 1, 1],
    6: [1, 0, 1, 1, 1, 1, 1],
    7: [1, 1, 1, 0, 0, 0, 0],
    8: [1, 1, 1, 1, 1, 1, 1],
    9: [1, 1, 1, 1, 0, 1, 1],
};

export const SEVEN_SEGMENT_ALL: SegmentLit = [1, 1, 1, 1, 1, 1, 1];

// Draws a 7-segment digit at (0,0) within a w×h area, using the current fillStyle.
// `t` is segment thickness, `gap` is the visible gap between adjacent segments
// (0 = touching at corners, like the original).
export const drawSevenSegment = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    pattern: SegmentLit,
    gap: number = 0,
): void => {
    const halfT = t / 2;
    const midY = h / 2;
    const g = gap;

    // a (top horizontal)
    if (pattern[0]) {
        ctx.beginPath();
        ctx.moveTo(halfT + g, 0);
        ctx.lineTo(w - halfT - g, 0);
        ctx.lineTo(w - g, halfT);
        ctx.lineTo(w - halfT - g, t);
        ctx.lineTo(halfT + g, t);
        ctx.lineTo(g, halfT);
        ctx.closePath();
        ctx.fill();
    }

    // b (top-right vertical)
    if (pattern[1]) {
        ctx.beginPath();
        ctx.moveTo(w - halfT, g);
        ctx.lineTo(w, halfT + g);
        ctx.lineTo(w, midY - halfT - g);
        ctx.lineTo(w - halfT, midY - g);
        ctx.lineTo(w - t, midY - halfT - g);
        ctx.lineTo(w - t, halfT + g);
        ctx.closePath();
        ctx.fill();
    }

    // c (bottom-right vertical)
    if (pattern[2]) {
        ctx.beginPath();
        ctx.moveTo(w - halfT, midY + g);
        ctx.lineTo(w, midY + halfT + g);
        ctx.lineTo(w, h - halfT - g);
        ctx.lineTo(w - halfT, h - g);
        ctx.lineTo(w - t, h - halfT - g);
        ctx.lineTo(w - t, midY + halfT + g);
        ctx.closePath();
        ctx.fill();
    }

    // d (bottom horizontal)
    if (pattern[3]) {
        ctx.beginPath();
        ctx.moveTo(halfT + g, h - t);
        ctx.lineTo(w - halfT - g, h - t);
        ctx.lineTo(w - g, h - halfT);
        ctx.lineTo(w - halfT - g, h);
        ctx.lineTo(halfT + g, h);
        ctx.lineTo(g, h - halfT);
        ctx.closePath();
        ctx.fill();
    }

    // e (bottom-left vertical)
    if (pattern[4]) {
        ctx.beginPath();
        ctx.moveTo(halfT, midY + g);
        ctx.lineTo(t, midY + halfT + g);
        ctx.lineTo(t, h - halfT - g);
        ctx.lineTo(halfT, h - g);
        ctx.lineTo(0, h - halfT - g);
        ctx.lineTo(0, midY + halfT + g);
        ctx.closePath();
        ctx.fill();
    }

    // f (top-left vertical)
    if (pattern[5]) {
        ctx.beginPath();
        ctx.moveTo(halfT, g);
        ctx.lineTo(t, halfT + g);
        ctx.lineTo(t, midY - halfT - g);
        ctx.lineTo(halfT, midY - g);
        ctx.lineTo(0, midY - halfT - g);
        ctx.lineTo(0, halfT + g);
        ctx.closePath();
        ctx.fill();
    }

    // g (middle horizontal)
    if (pattern[6]) {
        ctx.beginPath();
        ctx.moveTo(halfT + g, midY - halfT);
        ctx.lineTo(w - halfT - g, midY - halfT);
        ctx.lineTo(w - g, midY);
        ctx.lineTo(w - halfT - g, midY + halfT);
        ctx.lineTo(halfT + g, midY + halfT);
        ctx.lineTo(g, midY);
        ctx.closePath();
        ctx.fill();
    }
};
