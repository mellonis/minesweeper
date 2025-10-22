import {Cell} from "./cell";
import {cell, explosion, lose, mark, mine, missMark, win} from "./symbols";

export type GetCellParams = {
    col: number;
    row: number;
} | { index: number };

export type Snapshot = ReturnType<Minesweeper['getSnapShot']>;

export class Minesweeper {
    readonly #cols: number;
    readonly #rows: number;
    readonly #field: Cell[][] = [];
    #marksLeft: number
    #explodedCell: [number, number] | null = null;
    #isWin = false;
    #isLose = false;

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

        this.#marksLeft = mines;
        this.#fillField(mines);
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

    static #getMinesSet(cells: number, mines: number): Set<number> {
        const options = Array.from({length: cells}).map(
            (_, index) => index
        );

        const result = new Set<number>();

        while (mines--) {
            const index = Math.floor(Math.random() * options.length);
            result.add(options.splice(index, 1)[0]);
        }

        return result;
    }

    reveal(param: GetCellParams) {
        if (this.#isGameOver) {
            return;
        }

        const [cell, col, row] = this.#getCell(param);

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
        if (this.#isGameOver) {
            return;
        }

        const cell = this.#getCell(param)[0];

        if (!cell.isMarked && this.#marksLeft === 0) {
            return;
        }

        const result = cell.mark();

        this.#marksLeft += result;
    }

    getSnapShot() {
        return {
            cols: this.#cols,
            rows: this.#rows,
            isGameOver: this.#isGameOver ? this.#isWin ? win : lose : false,
            cells: (() => {
                const result = [];

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

    #fillField(mines: number): void {
        const minesSet = Minesweeper.#getMinesSet(this.#cols * this.#rows, mines);
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

    #getCell(params: GetCellParams): [Cell, number, number] {
        let col: number;
        let row: number;

        if ('index' in params) {
            [col, row] = this.#convertIndexToColAndRowPair(params.index);
        } else {
            if (!this.#checkCol(params.col)) {
                throw new Error("Invalid col value");
            }

            if (!this.#checkRow(params.row)) {
                throw new Error("Invalid row value");
            }

            [col, row] = [params.col, params.row];
        }

        return [this.#field[col][row], col, row];
    }
}
