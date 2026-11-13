import { ErrorBanner } from '../../components/ErrorBanner';
import { Illustration } from '../../components/Illustration';
import { Logo } from '../../components/Logo';
import { useGameActions, useGameState } from '../../state/game-context';
import styles from './StartScreen.module.css';

export function StartScreen() {
    const { error } = useGameState();
    const actions = useGameActions();

    return (
        <main className={styles.start}>
            <h1 className={styles.title}>
                <Logo className={styles.logo} />
            </h1>
            <Illustration slot="hero" />
            <ul className={styles.how}>
                <li>Read the messages on the board and pick the ones worth solving.</li>
                <li>Spend gold in the shop on potions and upgrades.</li>
                <li>Reach 1000 points, and watch out for traps!</li>
            </ul>
            {error && (
                <ErrorBanner
                    error={error}
                    disabled={actions.isPending}
                    onRetry={() => void actions.retry()}
                    onDismiss={actions.dismissError}
                    onPlayAgain={actions.playAgain}
                />
            )}
            <button
                type="button"
                onClick={() => void actions.startGame()}
                disabled={actions.isPending}
            >
                {actions.isPending ? 'Starting...' : 'Start new game'}
            </button>
        </main>
    );
}
