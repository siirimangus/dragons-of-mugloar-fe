import type { SortKey } from '../../domain/types';
import styles from './AdFilters.module.css';

type Props = {
    readonly sortKey: SortKey;
    readonly onSortChange: (key: SortKey) => void;
};

const OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
    { key: 'value', label: 'Best value' },
    { key: 'reward', label: 'Highest reward' },
    { key: 'risk', label: 'Lowest risk' },
    { key: 'expiry', label: 'Expires soonest' },
];

export function AdFilters({ sortKey, onSortChange }: Props) {
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
        </div>
    );
}
