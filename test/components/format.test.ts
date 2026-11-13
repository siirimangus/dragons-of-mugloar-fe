import { describe, expect, it } from 'vitest';
import { formatPercent, formatValue, pluralize } from '../../src/components/format';

describe('formatPercent', () => {
    it.each([
        [0.94, '94%'],
        [0.99, '99%'],
        [0, '0%'],
        [0.3, '30%'],
    ])('formats %s as %s', (value, expected) => {
        expect(formatPercent(value)).toBe(expected);
    });
});

describe('formatValue', () => {
    it.each([
        [47.4, '+47'],
        [-45.5, '-46'],
        [0, '+0'],
        [-0.2, '+0'],
    ])('formats %s as %s', (value, expected) => {
        expect(formatValue(value)).toBe(expected);
    });
});

describe('pluralize', () => {
    it('uses the singular only for exactly one', () => {
        expect(pluralize(1, 'turn')).toBe('1 turn');
        expect(pluralize(0, 'turn')).toBe('0 turns');
        expect(pluralize(5, 'turn')).toBe('5 turns');
    });
});
