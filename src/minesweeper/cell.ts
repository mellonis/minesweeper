import {isMineCellPredicate, isNotMineCellPredicate} from "./utils";

export type CellPredicate = (cell: Cell) => boolean;
type NeighbourGeneratorFabric = () => Generator<Cell, void, unknown>;

export class Cell {
  readonly #isMine;
  #isRevealed = false;
  #isMarked = false;
  #neighboursGenerator;
  #neighbourMinesCount: number | null = null;

  constructor(isMine: boolean, neighboursGenerator: NeighbourGeneratorFabric) {
    this.#isMine = isMine;
    this.#neighboursGenerator = neighboursGenerator;
  }

  get isMine(): boolean {
    return this.#isMine;
  }

  get isRevealed(): boolean {
    return this.#isRevealed;
  }

  get isMarked(): boolean {
    return this.#isMarked;
  }

  get neighbourMinesCount(): number {
    if (typeof this.#neighbourMinesCount !== "number") {
      throw new Error("Illegal neighbourMinesCount");
    }

    return this.#neighbourMinesCount;
  }

  countNeighbourMines(): void {
    if (typeof this.#neighbourMinesCount === "number") {
      throw new Error("Illegal call countNeighbourMines");
    }

    if (this.#isMine) {
      this.#neighbourMinesCount = -1;
      return;
    }

    this.#neighbourMinesCount = Cell.#getNeighbourMinesCells(this.#neighboursGenerator(), isMineCellPredicate).length;
  }

  reveal(isGameEnded = false): number {
    if (this.#isRevealed || this.#isMarked) {
      return 0;
    }

    this.#isRevealed = true;

    if (isGameEnded || this.#isMine) {
      return 1;
    }

    let count = 1;
    if (this.#neighbourMinesCount === 0) {
      Cell.#getNeighbourMinesCells(this.#neighboursGenerator(), isNotMineCellPredicate).forEach((cell) => {
        count += cell.reveal();
      });
    }

    return count;
  }

  mark(): number {
    if (this.#isMarked) {
      this.#isMarked = false;
      return 1;
    }

    if (!this.#isRevealed) {
      this.#isMarked = true;
      return -1;
    }

    return 0;
  }

  static #getNeighbourMinesCells(generator:ReturnType<NeighbourGeneratorFabric>, predicate?: CellPredicate): Cell[] {
    const cells = [...generator];

    if (predicate) {
      return cells.filter(predicate);
    }

    return cells;
  }
}
