import { riskOf, successProbability } from './odds';
import { isTrap } from './traps';
import { LIFE_VALUE } from './tuning';
import type { Ad, AdInsight } from './types';

export function adValue(ad: Pick<Ad, 'probability' | 'reward'>): number {
  const p = successProbability(ad.probability);
  return p * ad.reward - (1 - p) * LIFE_VALUE;
}

export function describeAd(ad: Ad): AdInsight {
  const probability = successProbability(ad.probability);
  return { probability, value: adValue(ad), risk: riskOf(probability), trap: isTrap(ad) };
}
