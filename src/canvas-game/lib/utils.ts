export const getCanvasCoords = (
    element: HTMLElement,
    {clientX, clientY}: Pick<MouseEvent, 'clientX' | 'clientY'>,
): { x: number; y: number; } => {
    const rect = element.getBoundingClientRect();

    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
    };
}
