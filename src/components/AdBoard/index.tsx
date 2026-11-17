import { useState } from 'react';
import { arrangeBoard } from '../../domain/board';
import type { Ad, SortKey } from '../../domain/types';
import type { BoardStatus } from '../../state/game-reducer';
import { AdCard } from '../AdCard';
import styles from './AdBoard.module.css';
import { AdFilters } from '../AdFilters';
import { Illustration } from '../Illustration';

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

    // Keys come from the position in the original list so sorting/filtering never remounts a card.
    const keys = new Map(ads.map((ad, index) => [ad, `${ad.adId}:${index}`]));
    // The advised ad stays on the board even when it is a trap: the advisor only ever recommends
    // one as a last resort, and advice you cannot see is no help.
    const { entries, hiddenTrapCount } = arrangeBoard(ads, {
        sortKey,
        hideTraps,
        keepAdId: advisedAdId,
    });
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
            {entries.length === 0 && !loading ? (
                <div className={styles.empty}>
                    <Illustration slot="empty-board" />
                    <p>No messages right now: buy a potion to wait for new ones.</p>
                </div>
            ) : entries.length > 0 ? (
                <ul className={styles.list}>
                    {entries.map(({ ad, insight }) => (
                        <AdCard
                            key={keys.get(ad)}
                            ad={ad}
                            insight={insight}
                            recommended={ad.adId === advisedAdId}
                            unavailable={unavailableAdIds.includes(ad.adId)}
                            disabled={disabled}
                            onSolve={onSolve}
                        />
                    ))}
                </ul>
            ) : null}
        </section>
    );
}
