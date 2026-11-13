import type { SortKey } from '../domain/types';
import styles from './AdFilters.module.css';

type Props = {
    readonly sortKey: SortKey;
    readonly hideTraps: boolean;
    readonly hiddenTrapCount: number;
    readonly onSortChange: (key: SortKey) => void;
    readonly onHideTrapsChange: (hide: boolean) => void;
};

const OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
    { key: 'value', label: 'Best value' },
    { key: 'reward', label: 'Highest reward' },
    { key: 'risk', label: 'Lowest risk' },
    { key: 'expiry', label: 'Expires soonest' },
];

export function AdFilters({
    sortKey,
    hideTraps,
    hiddenTrapCount,
    onSortChange,
    onHideTrapsChange,
}: Props) {
    return (
        <div className={styles.filters}>
            <label>
                Sort by{' '}
                <select
                    value={sortKey}
                    onChange={(event) => onSortChange(event.target.value as SortKey)}
                >
                    {OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={hideTraps}
                    onChange={(event) => onHideTrapsChange(event.target.checked)}
                />{' '}
                Hide trap ads
            </label>
            {hideTraps && hiddenTrapCount > 0 && (
                <span className={styles.hidden}>
                    {hiddenTrapCount} trap {hiddenTrapCount === 1 ? 'ad' : 'ads'} hidden
                </span>
            )}
        </div>
    );
}
