import { useState } from 'react';
import { ActivityLog, LastResultStatus } from '../components/ActivityLog';
import { Advisor } from '../components/Advisor';
import { AdBoard } from '../components/AdBoard';
import { ErrorBanner } from '../components/ErrorBanner';
import { Hud } from '../components/Hud';
import { Shop } from '../components/Shop';
import { advise } from '../domain/advisor';
import { useGameActions, useGameState } from '../state/game-context';
import styles from './GameScreen.module.css';

type Tab = 'board' | 'shop' | 'activity';

const TABS: ReadonlyArray<{ key: Tab; label: string }> = [
  { key: 'board', label: 'Board' },
  { key: 'shop', label: 'Shop' },
  { key: 'activity', label: 'Activity' },
];

export function GameScreen() {
  const state = useGameState();
  const actions = useGameActions();
  const [tab, setTab] = useState<Tab>('board');
  const { session } = state;
  if (!session) return null;

  const advice = advise({
    session,
    ads: state.ads,
    shop: state.shop,
    purchases: state.purchases,
    unavailableAdIds: state.unavailableAdIds,
  });
  const advisedAdId = advice.kind === 'solve' ? advice.targetId : null;
  const advisedItemId = advice.kind === 'buy' ? advice.targetId : null;
  const disabled = actions.isPending;

  const doAdvice = () => {
    if (!advice.targetId) return;
    void (advice.kind === 'solve'
      ? actions.solveAd(advice.targetId)
      : actions.buyItem(advice.targetId));
  };

  return (
    <div className={styles.screen}>
      <Hud session={session} disabled={disabled} onEndGame={actions.endGame} focusTitleOnMount />
      <main className={styles.main}>
        {state.error && (
          <div className={styles.error}>
            <ErrorBanner
              error={state.error}
              disabled={actions.isPending}
              onRetry={() => void actions.retry()}
              onDismiss={actions.dismissError}
              onPlayAgain={actions.playAgain}
            />
          </div>
        )}
        <nav className={styles.tabs} aria-label="Sections">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={tab === key ? '' : 'secondary'}
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className={styles.status}>
          <LastResultStatus lastResult={state.lastResult} firstLogId={state.log[0]?.id} />
        </div>
        <div className={styles.grid}>
          <div className={styles.advisor} data-active={tab === 'board'}>
            <Advisor advice={advice} disabled={disabled} onDo={doAdvice} />
          </div>
          <div className={styles.board} data-active={tab === 'board'}>
            <AdBoard
              ads={state.ads}
              advisedAdId={advisedAdId}
              unavailableAdIds={state.unavailableAdIds}
              status={state.boardStatus}
              disabled={disabled}
              onSolve={(adId) => void actions.solveAd(adId)}
            />
          </div>
          <div className={styles.shop} data-active={tab === 'shop'}>
            <Shop
              shop={state.shop}
              gold={session.gold}
              purchases={state.purchases}
              advisedItemId={advisedItemId}
              disabled={disabled}
              onBuy={(itemId) => void actions.buyItem(itemId)}
            />
          </div>
          <div className={styles.activity} data-active={tab === 'activity'}>
            <ActivityLog log={state.log} />
          </div>
        </div>
      </main>
    </div>
  );
}
