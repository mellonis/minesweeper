export const COLS_RANGE = [5, 40] as const;
export const ROWS_RANGE = [5, 40] as const;
const MINES_MIN = 1;
const SAFE_ZONE_RESERVED = 9; // keep a 3x3 worth of empty cells reachable post-save
const AUTO_SHUFFLE_INTERVAL_MS = 1000;

export interface ConfigPanelOptions {
    initialCols: number;
    initialRows: number;
    initialMines: number;
    onLiveChange: (cols: number, rows: number, mines: number) => void;
    onSave: (cols: number, rows: number, mines: number) => void;
    onCancel: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

interface SliderRow {
    container: HTMLDivElement;
    input: HTMLInputElement;
    valueLabel: HTMLSpanElement;
}

export class ConfigPanel {
    private readonly backdrop: HTMLDivElement;
    private readonly colsRow: SliderRow;
    private readonly rowsRow: SliderRow;
    private readonly minesRow: SliderRow;
    private readonly abortController = new AbortController();
    private readonly autoShuffleTimer: ReturnType<typeof setInterval>;
    private cols: number;
    private rows: number;
    private mines: number;
    private dragging = false;

    constructor(container: HTMLElement, private readonly options: ConfigPanelOptions) {
        this.cols = options.initialCols;
        this.rows = options.initialRows;
        this.mines = options.initialMines;

        this.backdrop = document.createElement('div');
        this.backdrop.className = 'config-panel-backdrop';

        const panel = document.createElement('div');
        panel.className = 'config-panel';

        const title = document.createElement('h2');
        title.textContent = 'Custom board';
        panel.appendChild(title);

        this.colsRow = this.buildRow('cols', COLS_RANGE[0], COLS_RANGE[1], this.cols);
        this.rowsRow = this.buildRow('rows', ROWS_RANGE[0], ROWS_RANGE[1], this.rows);
        this.minesRow = this.buildRow('mines', MINES_MIN, this.maxMines(), this.mines);

        panel.appendChild(this.colsRow.container);
        panel.appendChild(this.rowsRow.container);
        panel.appendChild(this.minesRow.container);

        const actions = document.createElement('div');
        actions.className = 'config-panel-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'config-panel-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this.options.onCancel(), {signal: this.abortController.signal});

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'config-panel-save';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => this.options.onSave(this.cols, this.rows, this.mines), {signal: this.abortController.signal});

        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        panel.appendChild(actions);

        this.backdrop.appendChild(panel);
        container.appendChild(this.backdrop);

        this.attachSliderListeners(this.colsRow, 'cols');
        this.attachSliderListeners(this.rowsRow, 'rows');
        this.attachSliderListeners(this.minesRow, 'mines');

        this.autoShuffleTimer = setInterval(() => {
            if (this.dragging) return;
            // Silent re-randomize while idle. Same dims, just a new mine layout.
            this.options.onLiveChange(this.cols, this.rows, this.mines);
        }, AUTO_SHUFFLE_INTERVAL_MS);
    }

    dispose(): void {
        clearInterval(this.autoShuffleTimer);
        this.abortController.abort();
        this.backdrop.remove();
    }

    private buildRow(label: string, min: number, max: number, value: number): SliderRow {
        const container = document.createElement('div');
        container.className = 'config-panel-row';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;

        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(min);
        input.max = String(max);
        input.step = '1';
        input.value = String(value);

        const valueLabel = document.createElement('span');
        valueLabel.className = 'config-panel-value';
        valueLabel.textContent = String(value);

        container.appendChild(labelEl);
        container.appendChild(input);
        container.appendChild(valueLabel);
        return {container, input, valueLabel};
    }

    private attachSliderListeners(row: SliderRow, axis: 'cols' | 'rows' | 'mines'): void {
        const {signal} = this.abortController;

        row.input.addEventListener('input', () => {
            const next = Number(row.input.value);
            if (axis === 'cols') this.cols = next;
            else if (axis === 'rows') this.rows = next;
            else this.mines = next;

            if (axis !== 'mines') {
                // cols/rows change shifts the mines ceiling — re-clamp.
                const newMax = this.maxMines();
                this.minesRow.input.max = String(newMax);
                if (this.mines > newMax) {
                    this.mines = newMax;
                    this.minesRow.input.value = String(newMax);
                    this.minesRow.valueLabel.textContent = String(newMax);
                }
            }

            row.valueLabel.textContent = row.input.value;
            this.options.onLiveChange(this.cols, this.rows, this.mines);
        }, {signal});

        row.input.addEventListener('pointerdown', () => {
            this.dragging = true;
            this.options.onDragStart?.();
        }, {signal});
        const endDrag = () => {
            this.dragging = false;
            this.options.onDragEnd?.();
        };
        row.input.addEventListener('pointerup', endDrag, {signal});
        row.input.addEventListener('pointercancel', endDrag, {signal});
    }

    private maxMines(): number {
        return Math.max(MINES_MIN, this.cols * this.rows - SAFE_ZONE_RESERVED);
    }
}
