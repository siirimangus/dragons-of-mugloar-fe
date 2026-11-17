import type { Ad, BoardEntry, SortKey } from './types';
import { describeAd } from './value';

export type BoardOptions = {
    readonly sortKey: SortKey;
    readonly hideTraps: boolean;
    /** An ad that stays on the board even when traps are hidden, so advice is never invisible. */
    readonly keepAdId?: string | null;
};

export type Board = {
    readonly entries: readonly BoardEntry[];
    /** Traps left out of `entries`, so the filter can say what it took away. */
    readonly hiddenTrapCount: number;
};

type Ranked = BoardEntry & { readonly index: number };

const COMPARE: Record<SortKey, (a: Ranked, b: Ranked) => number> = {
    value: (a, b) => b.insight.value - a.insight.value,
    reward: (a, b) => b.ad.reward - a.ad.reward,
    risk: (a, b) => b.insight.probability - a.insight.probability,
    expiry: (a, b) => a.ad.expiresIn - b.ad.expiresIn,
};

/**
 * Everything the board needs, in one pass: each ad is described exactly once and the result
 * carries its insight, so nothing downstream has to recompute it.
 */
export function arrangeBoard(ads: readonly Ad[], options: BoardOptions): Board {
    const { sortKey, hideTraps, keepAdId = null } = options;
    const ranked: Ranked[] = [];
    let hiddenTrapCount = 0;

    ads.forEach((ad, index) => {
        const insight = describeAd(ad);
        if (hideTraps && insight.trap && ad.adId !== keepAdId) {
            hiddenTrapCount++;
            return;
        }
        ranked.push({ ad, insight, index });
    });

    // Ties keep the order the API sent.
    ranked.sort((a, b) => COMPARE[sortKey](a, b) || a.index - b.index);
    return { entries: ranked.map(({ ad, insight }) => ({ ad, insight })), hiddenTrapCount };
}
