import './App.css';
import {
    cell as cellSymbol,
    explosion as explosionSymbol,
    mark as markSymbol,
    mine as mineSymbol,
    Minesweeper,
    missMark as missMarkSymbol,
    win as winSymbol
} from './minesweeper';
import {CSSProperties, MouseEventHandler, useCallback, useState} from "react";
import cx from 'classnames';
import {Game} from "./canvas-game/Game.tsx";

const getTargetElementIndex = (target: HTMLElement): number => Array.prototype.indexOf.call((target as HTMLElement).parentNode!.children, target)

const levels = {
    beginner: [9, 9, 10],
    intermediate: [16, 16, 40],
    expert: [30, 16, 99],
    custom: [100, 40, 270],
} as const;

const createMinesweeper = () => new Minesweeper(...levels.beginner);

function App() {
    const [minesweeper, setMinesweeper] = useState(createMinesweeper);
    const [snapshot, setSnapshot] = useState(() => minesweeper.getSnapShot());
    const [mouseDown, setMouseDown] = useState(false);

    const handleNewGame = useCallback(() => {
        const newMinesweeper = createMinesweeper();
        setMinesweeper(newMinesweeper);
        setSnapshot(newMinesweeper.getSnapShot());
    }, []);

    const handleClick: MouseEventHandler = useCallback(({target}) => {
        minesweeper.reveal({index: getTargetElementIndex(target as HTMLElement)});
        setSnapshot(minesweeper.getSnapShot());
    }, [minesweeper]);

    const handleRightClick: MouseEventHandler = useCallback((event) => {
        event.preventDefault();
        minesweeper.mark({index: getTargetElementIndex(event.target as HTMLElement)});
        setSnapshot(minesweeper.getSnapShot());
    }, [minesweeper]);

    const handleFieldMouseDown = useCallback(() => setMouseDown(true), []);
    const handleFieldMouseUp = useCallback(() => setMouseDown(false), []);

    const avatar = (() => {
        if (snapshot.isGameOver === false) {
            return mouseDown ? '😮' : '🙂';
        }

        return snapshot.isGameOver === winSymbol ? '😎' : '😵';
    })();

    return (
        <div className="App">
            <Game
                snapshot={snapshot}
                onReveal={(params) => {
                    minesweeper.reveal(params);
                    setSnapshot(minesweeper.getSnapShot());
                }}
                onMark={(params) => {
                    minesweeper.mark(params);
                    setSnapshot(minesweeper.getSnapShot());
                }}
                onFieldMouseDown={handleFieldMouseDown}
                onFieldMouseUp={handleFieldMouseUp}
            />
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
        </div>
    );
}

export default App;
