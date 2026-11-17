import { itemEffect } from '../../domain/shop';
import type { ShopItem as Item } from '../../domain/types';
import styles from './ShopItem.module.css';

type Props = {
    readonly item: Item;
    readonly gold: number;
    readonly bought: number;
    /** This item has a per-game purchase cap and it has been reached. */
    readonly limitReached: boolean;
    readonly suggested: boolean;
    readonly disabled: boolean;
    readonly onBuy: (itemId: string) => void;
};

export function ShopItem({ item, gold, bought, limitReached, suggested, disabled, onBuy }: Props) {
    return (
        <li className={`${styles.item} ${suggested ? styles.suggested : ''}`}>
            <div className={styles.info}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.meta}>
                    <span>{item.cost} gold</span> <span>{itemEffect(item)}</span>
                    {bought > 0 && <span>bought x{bought}</span>}
                    {limitReached && <span>limit reached</span>}
                </span>
                {suggested && <span className={styles.badge}>Suggested</span>}
            </div>
            <button
                type="button"
                aria-label={`Buy ${item.name}`}
                onClick={() => onBuy(item.id)}
                disabled={disabled || gold < item.cost || limitReached}
            >
                Buy
            </button>
        </li>
    );
}
