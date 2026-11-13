import { GOAL_SCORE } from '../domain/tuning';
import styles from './GoalBar.module.css';

export function GoalBar({ score }: { readonly score: number }) {
    const progress = Math.min(Math.max(score, 0), GOAL_SCORE);
    const reached = score >= GOAL_SCORE;
    return (
        <div className={styles.goal}>
            <progress
                className={styles.bar}
                aria-label={`Progress to the ${GOAL_SCORE}-point goal`}
                max={GOAL_SCORE}
                value={progress}
            />
            <span className={styles.text}>
                {progress} / {GOAL_SCORE}
            </span>
            {reached && <strong className={styles.reached}>Goal reached!</strong>}
        </div>
    );
}
