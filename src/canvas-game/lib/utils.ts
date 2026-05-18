export const getCanvasCoords = (
    element: HTMLCanvasElement,
    {clientX, clientY}: Pick<MouseEvent, 'clientX' | 'clientY'>,
): { x: number; y: number; } => {
    const rect = element.getBoundingClientRect();
    // The canvas may render at a CSS size different from its style.width / style.height
    // when constrained by ancestors (e.g. max-width: 100% on small viewports). Scale the
    // event offset back into the canvas's internal CSS coordinate space.
    const cssWidth = element.width / globalThis.devicePixelRatio;
    const cssHeight = element.height / globalThis.devicePixelRatio;

    return {
        x: (clientX - rect.left) * (cssWidth / rect.width),
        y: (clientY - rect.top) * (cssHeight / rect.height),
    };
}
