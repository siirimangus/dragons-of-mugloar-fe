import { useId } from 'react';
import { isHealingItem } from '../../domain/shop';
import { MAX_POTIONS } from '../../domain/tuning';
import type { ShopItem as Item } from '../../domain/types';
import styles from './Shop.module.css';
import { ShopItem } from '../ShopItem';

type Props = {
    readonly shop: readonly Item[];
    readonly gold: number;
    readonly purchases: Readonly<Record<string, number>>;
    readonly advisedItemId: string | null;
    readonly disabled: boolean;
    readonly onBuy: (itemId: string) => void;
};

export function Shop({ shop, gold, purchases, advisedItemId, disabled, onBuy }: Props) {
    const baseId = useId();
    const groups = [
        {
            key: 'healing',
            title: `Healing (max ${MAX_POTIONS} lives)`,
            items: shop.filter(isHealingItem),
        },
        { key: 'upgrades', title: 'Upgrades', items: shop.filter((item) => !isHealingItem(item)) },
    ].filter((group) => group.items.length > 0);

    return (
        <section className={styles.shop} aria-labelledby="shop-title">
            <h2 id="shop-title">Shop</h2>
            {groups.map((group) => (
                <div key={group.key} role="group" aria-labelledby={`${baseId}-${group.key}`}>
                    <h3 id={`${baseId}-${group.key}`}>{group.title}</h3>
                    <ul className={styles.list}>
                        {group.items.map((item) => {
                            const bought = purchases[item.id] ?? 0;
                            return (
                                <ShopItem
                                    key={item.id}
                                    item={item}
                                    gold={gold}
                                    bought={bought}
                                    limitReached={isHealingItem(item) && bought >= MAX_POTIONS}
                                    suggested={item.id === advisedItemId}
                                    disabled={disabled}
                                    onBuy={onBuy}
                                />
                            );
                        })}
                    </ul>
                </div>
            ))}
        </section>
    );
}
