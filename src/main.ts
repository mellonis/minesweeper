import './index.css';
import {Game, type GameLevel} from './canvas-game/game';
import {ConfigPanel} from './canvas-game/config-panel';
import {Minesweeper} from './minesweeper';

const levels: Record<string, GameLevel> = {
    beginner: [9, 9, 10],
    intermediate: [16, 16, 40],
    expert: [30, 16, 99],
};

const root = document.getElementById('root');
if (!root) throw new Error("#root not found");

let currentLevel: GameLevel = levels.beginner;
const game = new Game(root, currentLevel);

let activePanel: ConfigPanel | null = null;
let lastPreviewSnapshot: ReturnType<typeof Minesweeper.preview> | null = null;
let pickOverlay = false;

const openCustomPanel = () => {
    if (activePanel !== null) return;
    const [cols, rows, mines] = currentLevel;
    lastPreviewSnapshot = null;
    game.pause();
    activePanel = new ConfigPanel(root, {
        initialCols: cols,
        initialRows: rows,
        initialMines: mines,
        initialPickOverlay: pickOverlay,
        onLiveChange: (c, r, m) => {
            lastPreviewSnapshot = Minesweeper.preview(c, r, m);
            game.setPreviewSnapshot(lastPreviewSnapshot);
        },
        onSave: (c, r, m) => {
            currentLevel = [c, r, m];
            // If sliders weren't moved, synthesize a preview to seed the close-flip.
            const fromSnap = lastPreviewSnapshot ?? Minesweeper.preview(c, r, m);
            game.applyConfigSave(c, r, m, fromSnap);
            activePanel?.dispose();
            activePanel = null;
            lastPreviewSnapshot = null;
        },
        onCancel: () => {
            game.resume();
            activePanel?.dispose();
            activePanel = null;
            lastPreviewSnapshot = null;
        },
        onPickOverlayChange: (enabled) => {
            pickOverlay = enabled;
            game.setPickOverlay(enabled);
        },
    });
};

const presets = document.createElement('div');
presets.className = 'presets';
for (const [name, level] of Object.entries(levels)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name[0].toUpperCase() + name.slice(1);
    button.addEventListener('click', () => {
        currentLevel = level;
        game.setLevel(...level);
    });
    presets.appendChild(button);
}

const customButton = document.createElement('button');
customButton.type = 'button';
customButton.textContent = 'Custom…';
customButton.addEventListener('click', openCustomPanel);
presets.appendChild(customButton);

root.appendChild(presets);
