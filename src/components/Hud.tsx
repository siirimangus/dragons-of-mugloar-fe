import { useState } from 'react';
import type { Session } from '../domain/types';
import { GoalBar } from './GoalBar';
import styles from './Hud.module.css';

type Props = {
  readonly session: Session;
  readonly disabled: boolean;
  readonly onEndGame: () => void;
};

function Stat({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className={styles.stat}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function Hud({ session, disabled, onEndGame }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <header className={styles.hud}>
      <div className={styles.top}>
        <h1 className={styles.title}>Dragons of Mugloar</h1>
        {confirming ? (
          <div role="group" aria-label="Confirm ending the game" className={styles.confirm}>
            <span>End this game?</span>
            <button type="button" onClick={onEndGame} disabled={disabled}>
              Yes, end game
            </button>
            <button type="button" className="secondary" onClick={() => setConfirming(false)}>
              Keep playing
            </button>
          </div>
        ) : (
          <button
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
