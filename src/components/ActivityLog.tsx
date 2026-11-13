import type { LastResult, LogEntry } from '../state/game-reducer';
import styles from './ActivityLog.module.css';

type Props = {
  readonly lastResult: LastResult | null;
  readonly log: readonly LogEntry[];
};

export function ActivityLog({ lastResult, log }: Props) {
  return (
    <section className={styles.activity} aria-labelledby="activity-title">
      <h2 id="activity-title">Activity</h2>
      <p role="status" className={lastResult?.success === false ? styles.fail : styles.ok}>
        {lastResult?.text}
      </p>
      {log.length === 0 ? (
        <p className={styles.empty}>Nothing has happened yet.</p>
      ) : (
        <ol className={styles.list}>
          {log.map((entry) => (
            <li key={entry.id} className={entry.success ? styles.ok : styles.fail}>
              Turn {entry.turn}: {entry.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
