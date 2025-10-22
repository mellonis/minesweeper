import {UnrevealedCellBackgroundState} from "./types.ts";

export const CELL_SIZE = 30;
export const HALF_CELL_SIZE = CELL_SIZE / 2;

export const GAME_PANEL_HEIGHT = 60;
export const INTERFACE_BORDER_WIDTH = 5;
export const INTERFACE_PADDING = 7;

export const FIELD_X_POSITION = INTERFACE_BORDER_WIDTH * 2 + INTERFACE_PADDING;
export const FIELD_Y_POSITION = INTERFACE_BORDER_WIDTH * 4 + INTERFACE_PADDING * 2 + GAME_PANEL_HEIGHT;

export const GAME_WIDTH_WITHOUT_FIELD = FIELD_X_POSITION * 2;
export const GAME_HEIGHT_WITHOUT_FIELD_AND_PANEL = FIELD_X_POSITION * 2 + INTERFACE_BORDER_WIDTH * 2 + INTERFACE_PADDING;

// export const START_BUTTON_WIDTH = 46;

export const CELL_BORDER_WIDTH = 3;

export const BACKGROUND_COLOR = '#b7b8b8';
export const EXPLODED_BACKGROUND_COLOR = 'red';
export const BORDER_COLOR = '#7b7b7b';
export const BORDER_LIGHTEN_COLOR = '#ffffff';
export const BORDER_DARKEN_COLOR = '#636464';
export const BORDER_DARKEN_HOVER_COLOR = '#8f8f8f';
export const CROSS_COLOR = EXPLODED_BACKGROUND_COLOR;

export const DIGIT_COLORS = [undefined,
    'blue',
    'green',
    'red',
    'darkblue',
    'brown',
    'cyan',
    'black',
    'grey',
];

export const COUNTER_BORDER_WIDTH = INTERFACE_BORDER_WIDTH;
export const COUNTER_BACKGROUND_COLOR = '#3c0000';
export const COUNTER_COLOR = 'red';
export const COUNTER_DIGIT_WIDTH = 28;
export const COUNTER_DIGIT_HEIGHT = 38;

export const MARKS_COUNTER_Y_POSITION = FIELD_X_POSITION + GAME_PANEL_HEIGHT / 2 - COUNTER_DIGIT_HEIGHT / 2;
export const MARKS_COUNTER_X_POSITION = MARKS_COUNTER_Y_POSITION;

export const TIMER_Y_POSITION = MARKS_COUNTER_Y_POSITION;

export const START_BUTTON_SIZE = COUNTER_DIGIT_HEIGHT + COUNTER_BORDER_WIDTH * 2;
export const HALF_START_BUTTON_SIZE = START_BUTTON_SIZE / 2;
export const START_BUTTON_Y_POSITION = FIELD_X_POSITION + GAME_PANEL_HEIGHT / 2 - START_BUTTON_SIZE / 2;

export const unrevealedCellColorsTuples = {
    [UnrevealedCellBackgroundState.default]: [BORDER_LIGHTEN_COLOR, BORDER_DARKEN_COLOR],
    [UnrevealedCellBackgroundState.hover]: [BORDER_LIGHTEN_COLOR, BORDER_DARKEN_HOVER_COLOR],
    [UnrevealedCellBackgroundState.active]: [BORDER_DARKEN_COLOR, BORDER_LIGHTEN_COLOR],
};