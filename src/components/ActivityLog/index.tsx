import type { LastResult, LogEntry } from '../../state/game-reducer';
import styles from './ActivityLog.module.css';

type StatusProps = {
    readonly lastResult: LastResult | null;
    /** Id of the newest log entry; changing it re-announces a repeated result. */
    readonly firstLogId: number | undefined;
};

/** The always-mounted live region for the latest result. */
export function LastResultStatus({ lastResult, firstLogId }: StatusProps) {
    return (
        <p role="status" className={lastResult?.success === false ? styles.fail : styles.ok}>
            {lastResult && <span key={firstLogId}>{lastResult.text}</span>}
        </p>
    );
}

export function ActivityLog({ log }: { readonly log: readonly LogEntry[] }) {
    return (
        <section className={styles.activity} aria-labelledby="activity-title">
            <h2 id="activity-title">Activity</h2>
            {log.length === 0 ? (
                <p className={styles.empty}>Nothing has happened yet.</p>
            ) : (
                <div
                    role="group"
                    aria-labelledby="activity-title"
                    tabIndex={0}
                    className={styles.scroll}
                >
                    {/* role="list" keeps the list semantics that some browsers drop with list-style: none */}
                    <ul role="list" className={styles.list}>
                        {log.map((entry) => (
                            <li key={entry.id} className={entry.success ? styles.ok : styles.fail}>
                                Turn {entry.turn}: {entry.text}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
