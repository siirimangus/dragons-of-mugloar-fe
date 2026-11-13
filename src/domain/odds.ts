import { LABEL_PROBABILITY, RISK_LOW_AT, RISK_MEDIUM_AT, UNKNOWN_PROBABILITY } from './tuning';
import type { Risk } from './types';

export function successProbability(label: string): number {
    const known = Object.hasOwn(LABEL_PROBABILITY, label) ? LABEL_PROBABILITY[label] : undefined;
    return known ?? UNKNOWN_PROBABILITY;
}

export function riskOf(probability: number): Risk {
    if (probability >= RISK_LOW_AT) return 'low';
    if (probability >= RISK_MEDIUM_AT) return 'medium';
    return 'high';
}
