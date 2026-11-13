import { describe, expect, it } from 'vitest';
import { isTrap } from '../../src/domain/traps';
import { TRAP_PATTERN } from '../../src/domain/tuning';
import { makeAd } from '../support/builders';

describe('isTrap', () => {
    it.each([
        'Steal super awesome diamond pot from Melita Langdon',
        'Steal super awesome diamond house from Valentine Sherman',
        'Steal SUPER AWESOME diamond pot from X',
        'Steal super   awesome diamond pot from X',
    ])('flags "%s"', (message) => {
        expect(isTrap(makeAd({ message }))).toBe(true);
    });

    it.each([
        'Steal bucket delivery to Mai Millhouse and share some of the profits with the people.',
        'Help defending meadow in Bloodmoore from the intruders',
        'Create an advertisement campaign for Teppo Ruggles to promote their horse based business',
    ])('does not flag "%s"', (message) => {
        expect(isTrap(makeAd({ message }))).toBe(false);
    });

    it('gives the same answer every time (the pattern has no global or sticky flag)', () => {
        expect(TRAP_PATTERN.global).toBe(false);
        expect(TRAP_PATTERN.sticky).toBe(false);
        const ad = makeAd({ message: 'Steal super awesome diamond pot from X' });
        expect([isTrap(ad), isTrap(ad), isTrap(ad)]).toEqual([true, true, true]);
    });
});
