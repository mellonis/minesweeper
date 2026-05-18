import './index.css';
import {Game, type GameLevel} from './canvas-game/game';

const levels: Record<string, GameLevel> = {
    beginner: [9, 9, 10],
    intermediate: [16, 16, 40],
    expert: [30, 16, 99],
};

const root = document.getElementById('root');
if (!root) throw new Error("#root not found");

const game = new Game(root, levels.beginner);

const presets = document.createElement('div');
presets.className = 'presets';
for (const [name, level] of Object.entries(levels)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name[0].toUpperCase() + name.slice(1);
    button.addEventListener('click', () => game.setLevel(...level));
    presets.appendChild(button);
}
root.appendChild(presets);
