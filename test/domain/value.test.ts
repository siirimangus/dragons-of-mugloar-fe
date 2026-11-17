import { describe, expect, it } from 'vitest';
import { describeAd } from '../../src/domain/value';
import { makeAd, TRAP_MESSAGE } from '../support/builders';

describe('describeAd', () => {
    it('splits value into the gain and the risk it is paid for', () => {
        // 0.94 * 63 = 59.22 expected gold, 0.06 * 150 = 9 for the chance of losing a life
        const insight = describeAd(makeAd({ probability: 'Piece of cake', reward: 63 }));
        expect(insight.expectedGain).toBeCloseTo(59.22);
        expect(insight.riskCost).toBeCloseTo(9);
        expect(insight.value).toBeCloseTo(50.22);
    });

    it('is negative when the risk costs more than the reward is worth', () => {
        // 0.44 * 100 - 0.56 * 150 = -40
        expect(describeAd(makeAd({ probability: 'Risky', reward: 100 })).value).toBeCloseTo(-40);
    });

    it('values an unknown label with the unknown-label odds', () => {
        // 0.3 * 50 - 0.7 * 150 = -90
        expect(describeAd(makeAd({ probability: 'Mystery', reward: 50 })).value).toBeCloseTo(-90);
    });

    it('combines odds, value, risk and the trap flag', () => {
        const insight = describeAd(makeAd({ probability: 'Sure thing', reward: 50 }));
        expect(insight.probability).toBe(0.98);
        expect(insight.value).toBeCloseTo(46);
        expect(insight.risk).toBe('low');
        expect(insight.trap).toBe(false);
    });

    it('flags a trap even when its label looks great', () => {
        const insight = describeAd(
            makeAd({ message: TRAP_MESSAGE, probability: 'Sure thing', reward: 421 }),
        );
        expect(insight.trap).toBe(true);
    });
});
