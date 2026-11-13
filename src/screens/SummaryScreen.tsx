import { useEffect, useRef } from 'react';
import { Illustration } from '../components/Illustration';
import { GOAL_SCORE } from '../domain/tuning';
import { useGameActions, useGameState } from '../state/game-context';
import styles from './SummaryScreen.module.css';

export function SummaryScreen() {
  const { session, stats } = useGameState();
  const actions = useGameActions();
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  const score = session?.score ?? 0;
  const reached = score >= GOAL_SCORE;

  return (
    <main className={styles.summary}>
      <Illustration slot="summary" />
      <h1 ref={titleRef} tabIndex={-1}>
        Game over
      </h1>
      <p className={reached ? styles.reached : styles.notReached}>
        {reached
          ? `Goal reached: you passed ${GOAL_SCORE} points!`
          : `Goal not reached: ${GOAL_SCORE} points needed.`}
      </p>
      <dl className={styles.stats}>
        <div>
          <dt>Final score</dt>
          <dd>{score}</dd>
        </div>
        <div>
          <dt>Turns played</dt>
          <dd>{session?.turn ?? 0}</dd>
        </div>
        <div>
          <dt>Messages solved</dt>
          <dd>{stats.solved}</dd>
        </div>
        <div>
          <dt>Messages failed</dt>
          <dd>{stats.failed}</dd>
        </div>
        <div>
          <dt>Items bought</dt>
          <dd>{stats.itemsBought}</dd>
        </div>
        <div>
          <dt>Gold spent</dt>
          <dd>{stats.goldSpent}</dd>
        </div>
      </dl>
      <button type="button" onClick={actions.playAgain} disabled={actions.isPending}>
        Play again
      </button>
    </main>
  );
}
