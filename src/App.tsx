import './App.css';
import {
    cell as cellSymbol,
    explosion as explosionSymbol,
    mark as markSymbol,
    mine as mineSymbol,
    Minesweeper,
    missMark as missMarkSymbol,
    Snapshot as MinesweeperSnapshot,
    win as winSymbol
} from './minesweeper';
import {CSSProperties, MouseEventHandler, useCallback, useEffect, useRef, useState} from "react";
import cx from 'classnames';
import {Game} from "./canvas-game/Game.tsx";

const getTargetElementIndex = (target: HTMLElement): number => Array.prototype.indexOf.call((target as HTMLElement).parentNode!.children, target)

const levels = {
    beginner: [9, 9, 10],
    intermediate: [16, 16, 40],
    expert: [30, 16, 99],
    custom: [100, 40, 270],
} as const;

function App() {
    const [minesweeper, setMinesweeper] = useState<Minesweeper | null>(null)
    const [snapshot, setSnapshot] = useState<MinesweeperSnapshot | null>(null);
    const handleNewGame = useCallback(() => {
        setMinesweeper(new Minesweeper(...levels.beginner));
    }, [])

    useEffect(() => {
        handleNewGame()
    }, [handleNewGame]);

    useEffect(() => {
        if (minesweeper) {
            setSnapshot(minesweeper.getSnapShot());
        }
    }, [minesweeper]);

    const minesweeperRef = useRef<Minesweeper | null>(minesweeper);
    minesweeperRef.current = minesweeper;

    const handleClick: MouseEventHandler = useCallback(({target}) => {
        const {current: minesweeper} = minesweeperRef;

        if (!minesweeper) {
            return;
        }

        minesweeper.reveal({index: getTargetElementIndex(target as HTMLElement)});
        setSnapshot(minesweeper.getSnapShot())
    }, []);

    const handleRightClick: MouseEventHandler = useCallback((event) => {
        event.preventDefault();

        const {current: minesweeper} = minesweeperRef;

        if (!minesweeper) {
            return;
        }

        minesweeper.mark({index: getTargetElementIndex(event.target as HTMLElement)});
        setSnapshot(minesweeper.getSnapShot())
    }, []);

    const [mouseDown, setMouseDown] = useState(false);

    const handleFieldMouseDown = useCallback(() => setMouseDown(true), []);
    const handleFieldMouseUp = useCallback(() => setMouseDown(false), []);

    const avatar = (() => {
        if (snapshot) {
            if (snapshot.isGameOver === false) {
                return mouseDown ? '😮' : '🙂';
            }

            return snapshot.isGameOver === winSymbol ? '😎' : '😵';
        }

        return null;
    })();

    return (
        <div className="App">
            {snapshot && (
                <Game
                    snapshot={snapshot}
                    onReveal={(params) => {
                        if (minesweeper) {
                            minesweeper.reveal(params);
                            setSnapshot(minesweeper.getSnapShot());
                        }
                    }}
                    onMark={(params) => {
                        if (minesweeper) {
                            minesweeper.mark(params);
                            setSnapshot(minesweeper.getSnapShot());
                        }
                    }}
                    onFieldMouseDown={handleFieldMouseDown}
                    onFieldMouseUp={handleFieldMouseUp}
                />
            )}
            {snapshot && (
                <div className="game">
                    <div className="panel">
                        <div>
                            <div className="marksLeft">
                                <span>{String(snapshot.marksLeft).padStart(3, '0')}</span>
                                <span>🚩</span>
                            </div>
                        </div>
                        <div>
                            <button className="avatar clickable" onClick={handleNewGame}>{avatar}</button>
                        </div>
                        <div></div>
                    </div>
                    <div
                        className="field"
                        style={
                            {
                                '--cols': snapshot.cols
                            } as CSSProperties
                        }
                        onMouseDown={handleFieldMouseDown}
                        onMouseUp={handleFieldMouseUp}
                        onMouseLeave={handleFieldMouseUp}
                    >
                        {snapshot.cells.map((cell, index) => {
                            const isRevealed = cell !== cellSymbol;
                            const isMine = cell === mineSymbol;
                            const isExplosion = cell === explosionSymbol;
                            const isMissMark = cell === missMarkSymbol;
                            const isMark = cell === markSymbol;
                            const content = (() => {
                                if (isMine || isExplosion || isMissMark) {
                                    return '💣';
                                }

                                if (isMark) {
                                    return '🚩';
                                }

                                if (isRevealed && typeof cell === 'number' && cell > 0) {
                                    return cell;
                                }

                                return null;
                            })();

                            return (
                                <div
                                    key={index}
                                    className={cx('cell', {
                                        clickable: !snapshot.isGameOver && (!isRevealed || isMark),
                                        cell_notRevealed: !isRevealed,
                                        cell_isMark: isMark,
                                        cell_isMissMark: isMissMark,
                                        cell_isExplosion: isExplosion,
                                        [`cell_${content}`]: typeof content === 'number'
                                    })}
                                    onClick={handleClick}
                                    onContextMenu={handleRightClick}
                                    data-content={content}
                                >
                                    {isMissMark && <div className="cross"/>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
