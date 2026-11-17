import { formatPercent } from '../utils/format';
import { HEAL_ITEM_ID, HEAL_THRESHOLD, RESERVE_GOLD, UPGRADE_ORDER } from './tuning';
import type { Ad, Advice, BoardEntry, Session, ShopItem } from './types';
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

const best = <T>(items: readonly T[], score: (item: T) => number): T | undefined =>
    items.reduce<T | undefined>(
        (champion, item) =>
            champion === undefined || score(item) > score(champion) ? item : champion,
        undefined,
    );

function solve(entry: BoardEntry, reason: string, confirm = false): Advice {
    return {
        kind: 'solve',
        targetId: entry.ad.adId,
        headline: `Solve "${shorten(entry.ad.message)}"`,
        reason,
        confirm,
    };
}

export function advise(input: AdviceInput): Advice {
    const { session, ads, shop, purchases, unavailableAdIds } = input;
    const heal = shop.find((item) => item.id === HEAL_ITEM_ID);
    const canHeal = heal !== undefined && session.gold >= heal.cost;

    const available = ads
        .filter((ad) => !unavailableAdIds.includes(ad.adId))
        .map((ad) => ({ ad, insight: describeAd(ad) }));
    const safest = best(
        available.filter(({ insight }) => !insight.trap),
        ({ insight }) => insight.value,
    );

    if (heal && canHeal && session.lives <= HEAL_THRESHOLD) {
        const lives = `${session.lives} ${session.lives === 1 ? 'life' : 'lives'}`;
        return {
            kind: 'buy',
            targetId: heal.id,
            headline: `Buy a ${heal.name.toLowerCase()}`,
            reason: `You are down to ${lives}. A potion costs ${heal.cost} gold and adds one.`,
            confirm: false,
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
            reason: `Upgrades raise your dragon's level, which roughly doubles the rewards the board offers. They do not change your odds, but bigger rewards are where the score comes from. It costs ${nextUpgrade.cost} gold.`,
            confirm: false,
        };
    }

    if (safest && safest.insight.value >= 0) {
        return solve(
            safest,
            `About ${formatPercent(safest.insight.probability)} chance to win ${safest.ad.reward} gold.`,
        );
    }

    // Nothing is worth solving. A potion passes the turn for a fresh board and a spare life, and
    // gold has no use outside the shop, so it is worth buying whenever it is affordable.
    if (heal && canHeal) {
        return {
            kind: 'buy',
            targetId: heal.id,
            headline: 'Wait for a fresh board',
            reason: safest
                ? 'Every message is a bad bet right now. A potion costs a turn but brings a fresh board and a spare life.'
                : 'No safe messages are on the board. A potion costs a turn but brings a fresh board and a spare life.',
            confirm: false,
        };
    }

    if (safest) {
        return solve(
            safest,
            `No good options and no gold for a potion: this is the least bad message, with about ${formatPercent(safest.insight.probability)} chance. You may lose a life.`,
        );
    }

    // Only traps are left and a potion is out of reach. Doing nothing is not "waiting": the turn
    // only advances when you act, so the board would never refresh. A trap costs a life, but it
    // is the one move that gets you a new board.
    const trap = best(available, ({ ad }) => ad.reward);
    if (trap) {
        return solve(
            trap,
            'Only traps are left and you cannot afford a potion. Solving one almost certainly costs a life, but nothing else refreshes the board: the turn only moves when you act.',
            true,
        );
    }

    return {
        kind: 'none',
        targetId: null,
        headline: 'No move available',
        reason: 'The board is empty and a potion is out of reach. You can end the game.',
        confirm: false,
    };
}
