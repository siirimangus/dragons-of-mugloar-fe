import { HEAL_ITEM_ID } from './tuning';
import type { ShopItem } from './types';

export function isHealingItem(item: Pick<ShopItem, 'id'>): boolean {
  return item.id === HEAL_ITEM_ID;
}

export function itemEffect(item: ShopItem): string {
  if (isHealingItem(item)) return '+1 life';
  return item.cost >= 300 ? '+2 dragon levels' : '+1 dragon level';
}
