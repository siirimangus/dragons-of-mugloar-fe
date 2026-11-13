import { describe, expect, it } from 'vitest';
import { riskOf, successProbability } from '../../src/domain/odds';
import { LABEL_PROBABILITY, UNKNOWN_PROBABILITY } from '../../src/domain/tuning';

describe('successProbability', () => {
    it.each(Object.entries(LABEL_PROBABILITY))('returns the measured rate for "%s"', (label, p) => {
        expect(successProbability(label)).toBe(p);
    });

    it('uses the unknown-label probability for labels it does not know', () => {
        expect(successProbability('Mystery')).toBe(UNKNOWN_PROBABILITY);
    });

    it('does not treat inherited object keys as labels', () => {
        expect(successProbability('constructor')).toBe(UNKNOWN_PROBABILITY);
        expect(successProbability('toString')).toBe(UNKNOWN_PROBABILITY);
    });
});

describe('riskOf', () => {
    it.each([
        [0.99, 'low'],
        [0.85, 'low'],
        [0.84, 'medium'],
        [0.55, 'medium'],
        [0.54, 'high'],
        [0, 'high'],
    ] as const)('maps probability %s to %s', (probability, risk) => {
        expect(riskOf(probability)).toBe(risk);
    });
});
