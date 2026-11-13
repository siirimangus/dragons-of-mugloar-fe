import { useState } from 'react';
import type { Ad, SortKey } from '../domain/types';
import { sortAds, visibleAds } from '../domain/sort';
import { isTrap } from '../domain/traps';
import { describeAd } from '../domain/value';
import type { BoardStatus } from '../state/game-reducer';
import { AdCard } from './AdCard';
import styles from './AdBoard.module.css';
import { AdFilters } from './AdFilters';
import { Illustration } from './Illustration';

type Props = {
  readonly ads: readonly Ad[];
  readonly advisedAdId: string | null;
  readonly unavailableAdIds: readonly string[];
  readonly status: BoardStatus;
  readonly disabled: boolean;
  readonly onSolve: (adId: string) => void;
};

export function AdBoard({ ads, advisedAdId, unavailableAdIds, status, disabled, onSolve }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [hideTraps, setHideTraps] = useState(true);

  const shown = sortAds(visibleAds(ads, hideTraps), sortKey);
  const hiddenTrapCount = hideTraps ? ads.filter(isTrap).length : 0;
  const loading = status === 'loading';

  return (
    <section className={styles.board} aria-labelledby="board-title" aria-busy={loading}>
      <h2 id="board-title">Message board</h2>
      <AdFilters
        sortKey={sortKey}
        hideTraps={hideTraps}
        hiddenTrapCount={hiddenTrapCount}
        onSortChange={setSortKey}
        onHideTrapsChange={setHideTraps}
      />
      {loading && <p role="status">Loading messages...</p>}
      {shown.length === 0 && !loading ? (
        <div className={styles.empty}>
          <Illustration slot="empty-board" />
          <p>No messages right now: buy a potion to wait for new ones.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {shown.map((ad, index) => (
            <AdCard
              key={`${ad.adId}:${index}`}
              ad={ad}
              insight={describeAd(ad)}
              recommended={ad.adId === advisedAdId}
              unavailable={unavailableAdIds.includes(ad.adId)}
              disabled={disabled}
              onSolve={onSolve}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
