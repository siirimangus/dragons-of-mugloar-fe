import type { GameError } from '../state/game-reducer';
import styles from './ErrorBanner.module.css';

type Props = {
    readonly error: GameError;
    readonly disabled: boolean;
    readonly onRetry: () => void;
    readonly onDismiss: () => void;
    readonly onPlayAgain: () => void;
};

export function ErrorBanner({ error, disabled, onRetry, onDismiss, onPlayAgain }: Props) {
    return (
        <div role="alert" className={styles.banner}>
            <p>{error.message}</p>
            <div className={styles.actions}>
                {error.expired ? (
                    <button type="button" onClick={onPlayAgain} disabled={disabled}>
                        Play again
                    </button>
                ) : (
                    <>
                        {error.retry && (
                            <button type="button" onClick={onRetry} disabled={disabled}>
                                Retry
                            </button>
                        )}
                        <button
                            type="button"
                            className="secondary"
                            onClick={onDismiss}
                            disabled={disabled}
                        >
                            Dismiss
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
