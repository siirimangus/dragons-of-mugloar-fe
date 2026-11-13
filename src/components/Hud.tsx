import { useEffect, useRef, useState } from 'react';
import type { Session } from '../domain/types';
import { GoalBar } from './GoalBar';
import styles from './Hud.module.css';

type Props = {
    readonly session: Session;
    readonly disabled: boolean;
    readonly onEndGame: () => void;
    /** Moves keyboard focus to the title once, when the HUD first appears. */
    readonly focusTitleOnMount?: boolean;
};

function Stat({ label, value }: { readonly label: string; readonly value: number }) {
    return (
        <div className={styles.stat}>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}

export function Hud({ session, disabled, onEndGame, focusTitleOnMount = false }: Props) {
    const [confirming, setConfirming] = useState(false);
    const endGameRef = useRef<HTMLButtonElement>(null);
    const keepPlayingRef = useRef<HTMLButtonElement>(null);
    const wasConfirming = useRef(false);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        if (focusTitleOnMount) titleRef.current?.focus();
    }, [focusTitleOnMount]);

    useEffect(() => {
        if (confirming) {
            keepPlayingRef.current?.focus();
        } else if (wasConfirming.current) {
            endGameRef.current?.focus();
        }
        wasConfirming.current = confirming;
    }, [confirming]);

    return (
        <header className={styles.hud}>
            <div className={styles.top}>
                <h1 ref={titleRef} tabIndex={-1} className={styles.title}>
                    Dragons of Mugloar
                </h1>
                {confirming ? (
                    <div
                        role="group"
                        aria-label="Confirm ending the game"
                        className={styles.confirm}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') setConfirming(false);
                        }}
                    >
                        <span>End this game?</span>
                        <button type="button" onClick={onEndGame} disabled={disabled}>
                            Yes, end game
                        </button>
                        <button
                            ref={keepPlayingRef}
                            type="button"
                            className="secondary"
                            onClick={() => setConfirming(false)}
                        >
                            Keep playing
                        </button>
                    </div>
                ) : (
                    <button
                        ref={endGameRef}
                        type="button"
                        className="secondary"
                        onClick={() => setConfirming(true)}
                        disabled={disabled}
                    >
                        End game
                    </button>
                )}
            </div>
            <dl className={styles.stats}>
                <Stat label="Score" value={session.score} />
                <Stat label="Gold" value={session.gold} />
                <Stat label="Lives" value={session.lives} />
                <Stat label="Level" value={session.level} />
                <Stat label="Turn" value={session.turn} />
            </dl>
            <GoalBar score={session.score} />
        </header>
    );
}
