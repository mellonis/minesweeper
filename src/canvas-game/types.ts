export const enum MouseState {
    default,
    hover,
    active,
}

export type MouseStates = { state: MouseState, x: number, y: number };