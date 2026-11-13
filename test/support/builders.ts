import { UPGRADE_ORDER } from '../../src/domain/tuning';
import type { Ad, Session, ShopItem } from '../../src/domain/types';

export const SHOP: readonly ShopItem[] = [
  { id: 'hpot', name: 'Healing potion', cost: 50 },
  { id: 'cs', name: 'Claw Sharpening', cost: 100 },
  { id: 'gas', name: 'Gasoline', cost: 100 },
  { id: 'wax', name: 'Copper Plating', cost: 100 },
  { id: 'tricks', name: 'Book of Tricks', cost: 100 },
  { id: 'wingpot', name: 'Potion of Stronger Wings', cost: 100 },
  { id: 'ch', name: 'Claw Honing', cost: 300 },
  { id: 'rf', name: 'Rocket Fuel', cost: 300 },
  { id: 'iron', name: 'Iron Plating', cost: 300 },
  { id: 'mtrix', name: 'Book of Megatricks', cost: 300 },
  { id: 'wingpotmax', name: 'Potion of Awesome Wings', cost: 300 },
];

/** Purchases map where every upgrade has been bought once. */
export const ALL_BOUGHT: Readonly<Record<string, number>> = Object.fromEntries(
  UPGRADE_ORDER.map((id) => [id, 1]),
);

export function makeAd(overrides: Partial<Ad> = {}): Ad {
  return {
    adId: 'a1',
    message: 'Help Someone to fix their wagon',
    reward: 50,
    expiresIn: 5,
    probability: 'Sure thing',
    ...overrides,
  };
}

export const TRAP_MESSAGE = 'Steal super awesome diamond pot from Melita Langdon';

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    gameId: 'g1',
    lives: 3,
    gold: 0,
    level: 0,
    score: 0,
    highScore: 0,
    turn: 0,
    ...overrides,
  };
}
