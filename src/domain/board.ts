import type { Ad, BoardEntry, SortKey } from './types';
import { describeAd } from './value';

type Ranked = BoardEntry & { readonly index: number };

const COMPARE: Record<SortKey, (a: Ranked, b: Ranked) => number> = {
    value: (a, b) => b.insight.value - a.insight.value,
    reward: (a, b) => b.ad.reward - a.ad.reward,
    risk: (a, b) => b.insight.probability - a.insight.probability,
    expiry: (a, b) => a.ad.expiresIn - b.ad.expiresIn,
};

/**
 * Every ad described and sorted in one pass, so nothing downstream has to recompute its insight.
 */
export function arrangeBoard(ads: readonly Ad[], sortKey: SortKey): BoardEntry[] {
    const ranked: Ranked[] = ads.map((ad, index) => ({ ad, insight: describeAd(ad), index }));
    // Ties keep the order the API sent.
    ranked.sort((a, b) => COMPARE[sortKey](a, b) || a.index - b.index);
    return ranked.map(({ ad, insight }) => ({ ad, insight }));
}
