import { describe, expect, it } from '@jest/globals';
import { Minesweeper } from './minesweeper';
import { cell, mark } from './symbols';

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
});