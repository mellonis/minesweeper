import { describe, expect, it } from '@jest/globals';
import { Minesweeper } from './minesweeper';
import { cell, explosion, lose, mark, mine, win } from './symbols';

describe('Minesweeper', () => {
    describe('marking before first reveal', () => {
        it('is a no-op — marksLeft stays at mines count', () => {
            const game = new Minesweeper(5, 5, 3);

            game.mark({ col: 0, row: 0 });
            game.mark({ col: 1, row: 1 });

            expect(game.getSnapShot().marksLeft).toBe(3);
        });

        it('leaves the snapshot showing only unrevealed cells', () => {
            const game = new Minesweeper(3, 3, 2);

            game.mark({ col: 0, row: 0 });
            game.mark({ col: 2, row: 2 });

            const snap = game.getSnapShot();
            expect(snap.cells.every((c) => c === cell)).toBe(true);
            expect(snap.cells.some((c) => c === mark)).toBe(false);
        });

        it('allows marking after the first reveal', () => {
            const game = new Minesweeper(5, 5, 3);

            game.reveal({ col: 0, row: 0 });
            const unrevealed = game.getSnapShot().cells.findIndex((c) => c === cell);
            expect(unrevealed).toBeGreaterThanOrEqual(0);

            game.mark({ index: unrevealed });

            expect(game.getSnapShot().marksLeft).toBe(2);
        });
    });

    describe('bounds validation', () => {
        it('rejects col equal to cols', () => {
            const game = new Minesweeper(9, 9, 10);
            expect(() => game.reveal({ col: 9, row: 0 })).toThrow('Invalid col value');
        });

        it('rejects negative col', () => {
            const game = new Minesweeper(9, 9, 10);
            expect(() => game.reveal({ col: -1, row: 0 })).toThrow('Invalid col value');
        });

        it('rejects row equal to rows', () => {
            const game = new Minesweeper(9, 9, 10);
            expect(() => game.reveal({ col: 0, row: 9 })).toThrow('Invalid row value');
        });

        it('rejects negative row', () => {
            const game = new Minesweeper(9, 9, 10);
            expect(() => game.reveal({ col: 0, row: -1 })).toThrow('Invalid row value');
        });

        it('rejects index equal to cols*rows', () => {
            const game = new Minesweeper(5, 4, 3);
            expect(() => game.reveal({ index: 20 })).toThrow('Invalid index value');
        });

        it('rejects negative index', () => {
            const game = new Minesweeper(5, 4, 3);
            expect(() => game.reveal({ index: -1 })).toThrow('Invalid index value');
        });

        it('rejects non-integer col', () => {
            const game = new Minesweeper(9, 9, 10);
            expect(() => game.reveal({ col: 1.5, row: 0 })).toThrow('Invalid col value');
        });
    });

    describe('win flow', () => {
        it('reaches isGameOver = win once every non-mine cell is revealed', () => {
            // 3x3 with 8 mines leaves exactly one non-mine cell (the first-click safe cell),
            // so a single reveal at the center wins deterministically — no Math.random mock needed.
            const game = new Minesweeper(3, 3, 8);
            game.reveal({ col: 1, row: 1 });

            const snap = game.getSnapShot();
            expect(snap.isGameOver).toBe(win);
            // The revealed center cell touches all 8 mines.
            expect(snap.cells[4]).toBe(8);
        });
    });

    describe('lose flow', () => {
        it('exposes all mines as mine/explosion and sets isGameOver = lose', () => {
            // Pin mine placement: Math.random → 0 makes placeMines pick options[0] each
            // iteration. For 3x3 with 7 mines and a center first-click, the lone other
            // non-mine ends up at idx 8; idx 0 is a mine, so revealing it loses.
            const originalRandom = Math.random;
            Math.random = () => 0;
            try {
                const game = new Minesweeper(3, 3, 7);
                game.reveal({ col: 1, row: 1 });
                game.reveal({ index: 0 });

                const snap = game.getSnapShot();
                expect(snap.isGameOver).toBe(lose);
                const exposed = snap.cells.filter((c) => c === mine || c === explosion);
                expect(exposed).toHaveLength(7);
                expect(snap.cells.filter((c) => c === explosion)).toHaveLength(1);
            } finally {
                Math.random = originalRandom;
            }
        });
    });

    describe('Minesweeper.preview', () => {
        it('returns a snapshot whose cells array length matches cols * rows', () => {
            const snap = Minesweeper.preview(9, 9, 10);
            expect(snap.cells).toHaveLength(81);
            expect(snap.cols).toBe(9);
            expect(snap.rows).toBe(9);
        });

        it('places exactly the requested number of mines', () => {
            const snap = Minesweeper.preview(16, 16, 40);
            const mineCount = snap.cells.filter((c) => c === mine).length;
            expect(mineCount).toBe(40);
        });

        it('non-mine cells hold a valid neighbour count in 0..8', () => {
            const snap = Minesweeper.preview(10, 10, 15);
            const numbers = snap.cells.filter((c): c is number => typeof c === 'number');
            expect(numbers.length).toBe(85);
            expect(numbers.every((n) => Number.isInteger(n) && n >= 0 && n <= 8)).toBe(true);
        });

        it('neighbour counts agree with mine placement', () => {
            const snap = Minesweeper.preview(5, 5, 6);
            const isMineAt = (col: number, row: number) =>
                col >= 0 && col < 5 && row >= 0 && row < 5 && snap.cells[row * 5 + col] === mine;

            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const cellValue = snap.cells[row * 5 + col];
                    if (cellValue === mine) continue;
                    let expected = 0;
                    for (let dc = -1; dc <= 1; dc++) {
                        for (let dr = -1; dr <= 1; dr++) {
                            if (dc === 0 && dr === 0) continue;
                            if (isMineAt(col + dc, row + dr)) expected++;
                        }
                    }
                    expect(cellValue).toBe(expected);
                }
            }
        });

        it('marksLeft equals the mines count and isGameOver is false', () => {
            const snap = Minesweeper.preview(7, 7, 12);
            expect(snap.marksLeft).toBe(12);
            expect(snap.isGameOver).toBe(false);
        });

        it('handles the all-mines edge case', () => {
            const snap = Minesweeper.preview(3, 3, 9);
            expect(snap.cells.every((c) => c === mine)).toBe(true);
        });

        it('handles a 1x1 single-mine field', () => {
            const snap = Minesweeper.preview(1, 1, 1);
            expect(snap.cells).toEqual([mine]);
        });

        it('throws on invalid params', () => {
            expect(() => Minesweeper.preview(0, 5, 1)).toThrow('Invalid cols value');
            expect(() => Minesweeper.preview(5, 0, 1)).toThrow('Invalid rows value');
            expect(() => Minesweeper.preview(5, 5, 0)).toThrow('Invalid mines value');
            expect(() => Minesweeper.preview(5, 5, 26)).toThrow('Invalid mines value');
        });
    });

    describe('getRevealedSnapshot', () => {
        it('before first reveal, returns all-unrevealed (same as getSnapShot)', () => {
            const game = new Minesweeper(5, 5, 3);
            const revealed = game.getRevealedSnapshot();
            expect(revealed.cells.every((c) => c === cell)).toBe(true);
            expect(revealed.cols).toBe(5);
            expect(revealed.rows).toBe(5);
        });

        it('after first reveal, exposes mines and numbers without ending the game', () => {
            const game = new Minesweeper(6, 6, 5);
            game.reveal({ col: 0, row: 0 });

            const revealed = game.getRevealedSnapshot();
            expect(revealed.isGameOver).toBe(false);

            const mineCount = revealed.cells.filter((c) => c === mine).length;
            expect(mineCount).toBe(5);

            const numbers = revealed.cells.filter((c): c is number => typeof c === 'number');
            expect(numbers.length).toBe(31);
            expect(numbers.every((n) => n >= 0 && n <= 8)).toBe(true);
        });

        it('does not mutate game state — game continues to be playable', () => {
            const game = new Minesweeper(5, 5, 4);
            game.reveal({ col: 0, row: 0 });
            const before = game.getSnapShot();

            game.getRevealedSnapshot();
            game.getRevealedSnapshot();

            const after = game.getSnapShot();
            expect(after.cells).toEqual(before.cells);
            expect(after.isGameOver).toBe(before.isGameOver);
            expect(after.marksLeft).toBe(before.marksLeft);
        });
    });
});