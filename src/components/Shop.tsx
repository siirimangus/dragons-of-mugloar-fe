import { useId } from 'react';
import { isHealingItem } from '../domain/shop';
import type { ShopItem as Item } from '../domain/types';
import styles from './Shop.module.css';
import { ShopItem } from './ShopItem';

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
    { title: 'Healing', items: shop.filter(isHealingItem) },
    { title: 'Upgrades', items: shop.filter((item) => !isHealingItem(item)) },
  ].filter((group) => group.items.length > 0);

  return (
    <section className={styles.shop} aria-labelledby="shop-title">
      <h2 id="shop-title">Shop</h2>
      {groups.map((group) => (
        <div key={group.title} role="group" aria-labelledby={`${baseId}-${group.title}`}>
          <h3 id={`${baseId}-${group.title}`}>{group.title}</h3>
          <ul className={styles.list}>
            {group.items.map((item) => (
              <ShopItem
                key={item.id}
                item={item}
                gold={gold}
                bought={purchases[item.id] ?? 0}
                suggested={item.id === advisedItemId}
                disabled={disabled}
                onBuy={onBuy}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
