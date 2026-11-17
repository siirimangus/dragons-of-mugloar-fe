import { HEAL_ITEM_ID } from './tuning';
import type { ShopItem } from './types';

export function isHealingItem(item: Pick<ShopItem, 'id'>): boolean {
    return item.id === HEAL_ITEM_ID;
}

/**
 * The API does not say what an item does, only what it costs, so the effect is read off the price
 * list: every 100-gold item was observed to add one dragon level and every 300-gold item two.
 * Prices are fixed for a whole game, so this holds for as long as the shop looks like it does now.
 */
export function itemEffect(item: ShopItem): string {
    if (isHealingItem(item)) return '+1 life';
    return item.cost >= 300 ? '+2 dragon levels' : '+1 dragon level';
}
