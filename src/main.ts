import './index.css';
import {Game} from './canvas-game/game';
import {Minesweeper} from './minesweeper';

const levels = {
    beginner: [9, 9, 10],
    intermediate: [16, 16, 40],
    expert: [30, 16, 99],
} as const;

const root = document.getElementById('root');
if (!root) throw new Error("#root not found");

new Game(root, () => new Minesweeper(...levels.beginner));
