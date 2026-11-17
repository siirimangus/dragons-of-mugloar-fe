import { LABEL_PROBABILITY, RISK_LOW_AT, RISK_MEDIUM_AT, UNKNOWN_PROBABILITY } from './tuning';
import type { Risk } from './types';

/** A Map, so a label that happens to name an Object property ("toString") cannot match. */
const PROBABILITY = new Map(Object.entries(LABEL_PROBABILITY));

export function successProbability(label: string): number {
    return PROBABILITY.get(label) ?? UNKNOWN_PROBABILITY;
}

export function riskOf(probability: number): Risk {
    if (probability >= RISK_LOW_AT) return 'low';
    if (probability >= RISK_MEDIUM_AT) return 'medium';
    return 'high';
}
