import { beforeEach, describe, expect, it } from '@jest/globals';
import { Cell } from './cell';

describe('Cell', () => {
    let mockNeighboursGenerator: () => Generator<Cell, void, unknown>;

    beforeEach(() => {
        mockNeighboursGenerator = function* () {
            yield new Cell(true, mockNeighboursGenerator);  // mine
            yield new Cell(false, mockNeighboursGenerator); // empty
            yield new Cell(true, mockNeighboursGenerator);  // mine
        };
    });

    describe('constructor and getters', () => {
        it('should initialize with correct mine status', () => {
            const cell = new Cell(true, mockNeighboursGenerator);
            expect(cell.isMine).toBe(true);
            expect(cell.isRevealed).toBe(false);
            expect(cell.isMarked).toBe(false);
        });

        it('should throw error when accessing neighbourMinesCount before counting', () => {
            const cell = new Cell(false, mockNeighboursGenerator);
            expect(() => cell.neighbourMinesCount).toThrow('Illegal neighbourMinesCount');
        });
    });

    describe('countNeighbourMines', () => {
        it('should count neighbouring mines correctly', () => {
            const cell = new Cell(false, mockNeighboursGenerator);
            cell.countNeighbourMines();
            expect(cell.neighbourMinesCount).toBe(2); // From mock generator (2 mines)
        });

        it('should set -1 for mine cells', () => {
            const cell = new Cell(true, mockNeighboursGenerator);
            cell.countNeighbourMines();
            expect(cell.neighbourMinesCount).toBe(-1);
        });

        it('should throw error when called multiple times', () => {
            const cell = new Cell(false, mockNeighboursGenerator);
            cell.countNeighbourMines();
            expect(() => cell.countNeighbourMines()).toThrow('Illegal call countNeighbourMines');
        });
    });

    describe('reveal', () => {
        it('should reveal unmarked cell', () => {
            const cell = new Cell(false, mockNeighboursGenerator);
            cell.countNeighbourMines();
            expect(cell.reveal()).toBe(false);
            expect(cell.isRevealed).toBe(true);
        });

        it('should not reveal marked cell', () => {
            const cell = new Cell(false, mockNeighboursGenerator);
            cell.mark();
            expect(cell.reveal()).toBe(false);
            expect(cell.isRevealed).toBe(false);
        });

        it('should reveal mine and return true', () => {
            const cell = new Cell(true, mockNeighboursGenerator);
            cell.countNeighbourMines();
            expect(cell.reveal()).toBe(true);
        });

        it('should reveal neighbors for empty cell', () => {
            const neighbours: Cell[] = [];
            const emptyNeighboursGenerator = function* () {
                for (const cell of neighbours) yield cell;
            };
            neighbours.push(
                new Cell(false, emptyNeighboursGenerator),
                new Cell(false, emptyNeighboursGenerator),
            );
            neighbours.forEach((c) => c.countNeighbourMines());

            const cell = new Cell(false, emptyNeighboursGenerator);
            cell.countNeighbourMines();
            cell.reveal();

            expect(neighbours.every(n => n.isRevealed)).toBe(true);
        });
    });

    describe('mark', () => {
        it('should mark unrevealed cell', () => {
            const cell = new Cell(false, mockNeighboursGenerator);
            expect(cell.mark()).toBe(-1);
            expect(cell.isMarked).toBe(true);
        });

        it('should unmark marked cell', () => {
            const cell = new Cell(false, mockNeighboursGenerator);
            cell.mark();
            expect(cell.mark()).toBe(1);
            expect(cell.isMarked).toBe(false);
        });

        it('should not mark revealed cell', () => {
            const cell = new Cell(false, mockNeighboursGenerator);
            cell.countNeighbourMines();
            cell.reveal();
            expect(cell.mark()).toBe(0);
            expect(cell.isMarked).toBe(false);
        });
    });

    describe('chain reactions', () => {
        it('should trigger chain reaction for empty cells', () => {
            // Create a chain of empty cells
            const cells: Cell[] = [];
            const chainGenerator = function* () {
                for (const cell of cells) {
                    yield cell;
                }
            };

            // Create 3 empty cells in a chain
            for (let i = 0; i < 3; i++) {
                cells.push(new Cell(false, chainGenerator));
            }

            // Count mines for all cells
            cells.forEach(cell => cell.countNeighbourMines());

            // Reveal first cell
            cells[0].reveal();

            // Check if all cells were revealed
            expect(cells.every(cell => cell.isRevealed)).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle empty neighbour list', () => {
            const emptyGenerator = function* () {};
            const cell = new Cell(false, emptyGenerator);
            cell.countNeighbourMines();
            expect(cell.neighbourMinesCount).toBe(0);
        });

        it('should handle repeated reveal attempts', () => {
            const cell = new Cell(false, mockNeighboursGenerator);
            cell.countNeighbourMines();
            cell.reveal();
            expect(cell.reveal()).toBe(false); // Second reveal attempt
        });

        it('should handle game ended state', () => {
            const cell = new Cell(true, mockNeighboursGenerator);
            cell.countNeighbourMines();
            expect(cell.reveal(true)).toBe(true);
        });
    });
});
