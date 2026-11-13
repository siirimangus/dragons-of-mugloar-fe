import { isTrap } from './traps';
import type { Ad, SortKey } from './types';
import { describeAd } from './value';

export function sortAds(ads: readonly Ad[], key: SortKey): Ad[] {
  const entries = ads.map((ad, index) => ({ ad, index, insight: describeAd(ad) }));
  type Entry = (typeof entries)[number];
  const compare: Record<SortKey, (a: Entry, b: Entry) => number> = {
    value: (a, b) => b.insight.value - a.insight.value,
    reward: (a, b) => b.ad.reward - a.ad.reward,
    risk: (a, b) => b.insight.probability - a.insight.probability,
    expiry: (a, b) => a.ad.expiresIn - b.ad.expiresIn,
  };
  return entries.sort((a, b) => compare[key](a, b) || a.index - b.index).map((entry) => entry.ad);
}

export function visibleAds(ads: readonly Ad[], hideTraps: boolean): Ad[] {
  return hideTraps ? ads.filter((ad) => !isTrap(ad)) : [...ads];
}
