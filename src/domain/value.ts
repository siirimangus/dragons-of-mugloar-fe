import { riskOf, successProbability } from './odds';
import { isTrap } from './traps';
import { LIFE_VALUE } from './tuning';
import type { Ad, AdInsight } from './types';

export function describeAd(ad: Ad): AdInsight {
    const probability = successProbability(ad.probability);
    // Kept as two halves rather than one number: the card shows both, so the player can see why a
    // safe ad usually wins and when a risky one with a big reward finally beats it.
    const expectedGain = probability * ad.reward;
    const riskCost = (1 - probability) * LIFE_VALUE;
    return {
        probability,
        expectedGain,
        riskCost,
        value: expectedGain - riskCost,
        risk: riskOf(probability),
        trap: isTrap(ad),
    };
}
