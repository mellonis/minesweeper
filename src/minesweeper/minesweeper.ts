import {Cell} from "./cell";
import {cell, explosion, lose, mark, mine, missMark, win} from "./symbols";

export type GetCellParams = {
    col: number;
    row: number;
} | { index: number };

export type Snapshot = ReturnType<Minesweeper['getSnapShot']>;

// Module-level so both the live game and the static `Minesweeper.preview` factory share placement.
function placeMines(
    cols: number,
    rows: number,
    mines: number,
    safeCol?: number,
    safeRow?: number,
): Set<number> {
    const total = cols * rows;

    // Build the safe zone (3x3 around the safe cell). Fall back to 1-cell or no exclusion
    // if the level is dense enough that the wider zone leaves no room for all mines.
    let exclude = new Set<number>();
    if (safeCol !== undefined && safeRow !== undefined) {
        for (let dc = -1; dc <= 1; dc++) {
            for (let dr = -1; dr <= 1; dr++) {
                const c = safeCol + dc;
                const r = safeRow + dr;
                if (c >= 0 && c < cols && r >= 0 && r < rows) {
                    exclude.add(r * cols + c);
                }
            }
        }
        if (total - exclude.size < mines) {
            exclude = new Set([safeRow * cols + safeCol]);
            if (total - exclude.size < mines) exclude = new Set();
        }
    }

    const options = Array.from({length: total}, (_, index) => index)
        .filter((index) => !exclude.has(index));

    const result = new Set<number>();
    while (mines--) {
        const index = Math.floor(Math.random() * options.length);
        result.add(options.splice(index, 1)[0]);
    }

    return result;
}

export class Minesweeper {
    readonly #cols: number;
    readonly #rows: number;
    readonly #mines: number;
    readonly #field: Cell[][] = [];
    #marksLeft: number
    #explodedCell: [number, number] | null = null;
    #isWin = false;
    #isLose = false;
    #fieldFilled = false;

    constructor(cols: number, rows: number, mines: number) {
        if (!Minesweeper.#checkCols(cols)) {
            throw new Error("Invalid cols value");
        }

        this.#cols = cols;

        if (!Minesweeper.#checkRows(rows)) {
            throw new Error("Invalid rows value");
        }

        this.#rows = rows;

        if (!Minesweeper.#checkMinesCount(cols, rows, mines)) {
            throw new Error("Invalid mines value");
        }

        this.#mines = mines;
        this.#marksLeft = mines;
        // Field is filled lazily on first reveal so the first shot lands in a known-safe zone.
    }

    get #isGameOver() {
        return this.#isWin || this.#isLose;
    }

    static #checkCols(cols: number): boolean {
        return !(!Number.isInteger(cols) || cols < 1);
    }

    static #checkMinesCount(cols: number, rows: number, mines: number): boolean {
        return !(
            !Number.isInteger(mines) ||
            mines < 1 ||
            mines > cols * rows
        );
    }

    static #checkRows(rows: number): boolean {
        return !(!Number.isInteger(rows) || rows < 1);
    }

    static preview(cols: number, rows: number, mines: number): Snapshot {
        if (!Minesweeper.#checkCols(cols)) throw new Error("Invalid cols value");
        if (!Minesweeper.#checkRows(rows)) throw new Error("Invalid rows value");
        if (!Minesweeper.#checkMinesCount(cols, rows, mines)) throw new Error("Invalid mines value");

        const minePositions = placeMines(cols, rows, mines);
        const cells: (number | typeof mine)[] = new Array(cols * rows);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const index = row * cols + col;
                if (minePositions.has(index)) {
                    cells[index] = mine;
                    continue;
                }
                let count = 0;
                for (let dc = -1; dc <= 1; dc++) {
                    for (let dr = -1; dr <= 1; dr++) {
                        if (dc === 0 && dr === 0) continue;
                        const nc = col + dc;
                        const nr = row + dr;
                        if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
                        if (minePositions.has(nr * cols + nc)) count++;
                    }
                }
                cells[index] = count;
            }
        }

        return {
            cols,
            rows,
            cells,
            marksLeft: mines,
            isGameOver: false,
        };
    }

    reveal(param: GetCellParams) {
        if (this.#isGameOver) {
            return;
        }

        const [col, row] = this.#getCoords(param);

        if (!this.#fieldFilled) {
            this.#fillField(this.#mines, col, row);
        }

        const cell = this.#field[col][row];
        const isMine = cell.reveal(this.#isGameOver);

        if (isMine) {
            this.#explodedCell = [col, row];
            this.#lose();
        } else {
            const [minesCount, unrevealedCount] = this.#field.flat().reduce((result, {isRevealed, isMine}) => {
                if (isMine) {
                    result[0]++;
                }

                if (!isRevealed) {
                    result[1]++;
                }

                return result;
            }, [0, 0]);

            if (minesCount === unrevealedCount) {
                this.#win();
            }
        }
    }

    mark(param: GetCellParams) {
        if (this.#isGameOver || !this.#fieldFilled) {
            return;
        }

        const [col, row] = this.#getCoords(param);
        const cell = this.#field[col][row];

        if (!cell.isMarked && this.#marksLeft === 0) {
            return;
        }

        const result = cell.mark();

        this.#marksLeft += result;
    }

    getRevealedSnapshot(): Snapshot {
        if (!this.#fieldFilled) {
            return this.getSnapShot();
        }

        const cells: (number | typeof mine)[] = [];
        for (let row = 0; row < this.#rows; row++) {
            for (let col = 0; col < this.#cols; col++) {
                const c = this.#field[col][row];
                cells.push(c.isMine ? mine : c.neighbourMinesCount);
            }
        }

        return {
            cols: this.#cols,
            rows: this.#rows,
            cells,
            marksLeft: this.#marksLeft,
            isGameOver: false,
        };
    }

    getSnapShot() {
        return {
            cols: this.#cols,
            rows: this.#rows,
            isGameOver: this.#isGameOver ? this.#isWin ? win : lose : false,
            cells: (() => {
                const result = [];

                if (!this.#fieldFilled) {
                    for (let i = 0; i < this.#cols * this.#rows; i++) {
                        result.push(cell);
                    }
                    return result;
                }

                for (let row = 0; row < this.#rows; row++) {
                    for (let col = 0; col < this.#cols; col++) {
                        const {isMarked, isMine, isRevealed, neighbourMinesCount} = this.#field[col][row];

                        if (!isRevealed) {
                            if (!this.#isGameOver) {
                                result.push(isMarked ? mark : cell);
                            } else {
                                if (this.#isWin) {
                                    result.push(mark);
                                } else {
                                    result.push(!isMine ? missMark : mark);
                                }

                            }

                            continue;
                        }

                        if (isMine) {
                            const isExplosionSymbol = this.#isGameOver && this.#explodedCell![0] === col && this.#explodedCell![1] === row;

                            result.push(isExplosionSymbol ? explosion : mine);

                            continue;
                        }

                        result.push(neighbourMinesCount);
                    }
                }

                return result;
            })(),
            marksLeft: this.#isWin ? 0 : this.#marksLeft,
        };
    }

    #checkIndex(index: number): boolean {
        return !(!Number.isInteger(index) || index >= this.#cols * this.#rows);
    }

    #checkCol(col: number): boolean {
        return !(!Number.isInteger(col) || col > this.#cols);
    }

    #checkRow(row: number): boolean {
        return !(!Number.isInteger(row) || row > this.#rows);
    }

    #getNeighboursGenerator(col: number, row: number) {
        return function* (this: Minesweeper) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                    const neighbourCol = col + colOffset;
                    const neighbourRow = row + rowOffset;

                    if (
                        neighbourCol < 0 ||
                        neighbourRow < 0 ||
                        neighbourCol >= this.#cols ||
                        neighbourRow >= this.#rows ||
                        (neighbourCol === col && neighbourRow === row)
                    ) {
                        continue;
                    }

                    yield this.#field[neighbourCol][neighbourRow];
                }
            }
        }.bind(this);
    }

    #fillField(mines: number, safeCol?: number, safeRow?: number): void {
        const minesSet = placeMines(this.#cols, this.#rows, mines, safeCol, safeRow);
        const generatedField = Array.from({length: this.#cols}).reduce((board: Cell[][], _, col) => {
            board.push(
                Array.from({length: this.#rows}).map((_, row) => {
                    const isMine = minesSet.has(row * this.#cols + col);

                    return new Cell(isMine, this.#getNeighboursGenerator(col, row));
                })
            );

            return board;
        }, [] as Cell[][]);

        this.#field.push(...generatedField);
        this.#field.flat().forEach((cell) => cell.countNeighbourMines());
        this.#fieldFilled = true;
    }

    #lose(): void {
        this.#field.flat().forEach((cell) => cell.reveal());
        this.#isLose = true;
    }

    #win(): void {
        this.#isWin = true;
    }

    #convertIndexToColAndRowPair(index: number) {
        if (!this.#checkIndex(index)) {
            throw new Error("Invalid index value");
        }

        return [index % this.#cols, Math.floor(index / this.#cols)];
    }

    #getCoords(params: GetCellParams): [number, number] {
        if ('index' in params) {
            const [col, row] = this.#convertIndexToColAndRowPair(params.index);
            return [col, row];
        }

        if (!this.#checkCol(params.col)) {
            throw new Error("Invalid col value");
        }

        if (!this.#checkRow(params.row)) {
            throw new Error("Invalid row value");
        }

        return [params.col, params.row];
    }
}
