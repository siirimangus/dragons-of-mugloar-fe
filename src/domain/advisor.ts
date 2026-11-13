import {
  HEAL_ITEM_ID,
  HEAL_THRESHOLD,
  RESERVE_GOLD,
  UPGRADE_ORDER,
  WAIT_RESERVE_GOLD,
} from './tuning';
import type { Ad, Advice, Session, ShopItem } from './types';
import { describeAd } from './value';

export type AdviceInput = {
  readonly session: Session;
  readonly ads: readonly Ad[];
  readonly shop: readonly ShopItem[];
  /** How many times each shop item was bought in this game. */
  readonly purchases: Readonly<Record<string, number>>;
  /** Ads the API rejected on the current turn. */
  readonly unavailableAdIds: readonly string[];
};

const shorten = (text: string, max = 60): string =>
  text.length > max ? `${text.slice(0, max - 3)}...` : text;

const percent = (p: number): string => `${Math.round(p * 100)}%`;

function wait(heal: ShopItem, reason: string): Advice {
  return { kind: 'buy', targetId: heal.id, headline: 'Wait for a fresh board', reason };
}

export function advise(input: AdviceInput): Advice {
  const { session, ads, shop, purchases, unavailableAdIds } = input;
  const heal = shop.find((item) => item.id === HEAL_ITEM_ID);

  const best = ads
    .filter((ad) => !unavailableAdIds.includes(ad.adId))
    .map((ad) => ({ ad, insight: describeAd(ad) }))
    .filter(({ insight }) => !insight.trap)
    .sort((a, b) => b.insight.value - a.insight.value)[0];

  if (heal && session.lives <= HEAL_THRESHOLD && session.gold >= heal.cost) {
    const lives = `${session.lives} ${session.lives === 1 ? 'life' : 'lives'}`;
    return {
      kind: 'buy',
      targetId: heal.id,
      headline: `Buy a ${heal.name.toLowerCase()}`,
      reason: `You are down to ${lives}. A potion costs ${heal.cost} gold and adds one.`,
    };
  }

  const nextUpgrade = UPGRADE_ORDER.map((id) => shop.find((item) => item.id === id)).find(
    (item) => item !== undefined && (purchases[item.id] ?? 0) === 0,
  );
  if (nextUpgrade && session.gold - nextUpgrade.cost >= RESERVE_GOLD) {
    return {
      kind: 'buy',
      targetId: nextUpgrade.id,
      headline: `Buy ${nextUpgrade.name}`,
      reason: `Upgrades raise your dragon's level, which improves your chances. It costs ${nextUpgrade.cost} gold.`,
    };
  }

  if (best && best.insight.value >= 0) {
    return {
      kind: 'solve',
      targetId: best.ad.adId,
      headline: `Solve "${shorten(best.ad.message)}"`,
      reason: `About ${percent(best.insight.probability)} chance to win ${best.ad.reward} gold.`,
    };
  }

  if (heal && session.gold >= heal.cost) {
    if (!best) {
      return wait(
        heal,
        'Only trap ads are on the board. A potion costs a turn but brings a fresh board and a spare life.',
      );
    }
    if (session.gold - heal.cost >= WAIT_RESERVE_GOLD) {
      return wait(
        heal,
        'Every message is a bad bet right now. A potion costs a turn but brings a fresh board and a spare life.',
      );
    }
  }

  if (best) {
    return {
      kind: 'solve',
      targetId: best.ad.adId,
      headline: `Solve "${shorten(best.ad.message)}"`,
      reason: `No good options and no spare gold to wait: this is the least bad message, with about ${percent(best.insight.probability)} chance. You may lose a life.`,
    };
  }

  return {
    kind: 'none',
    targetId: null,
    headline: 'No safe move',
    reason: 'Only trap ads are left and a potion is out of reach. You can end the game.',
  };
}
