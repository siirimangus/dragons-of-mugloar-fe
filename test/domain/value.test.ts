import { describe, expect, it } from 'vitest';
import { adValue, describeAd } from '../../src/domain/value';
import { makeAd, TRAP_MESSAGE } from '../support/builders';

describe('adValue', () => {
  it('is odds x reward - (1 - odds) x life value', () => {
    // 0.94 * 63 - 0.06 * 150 = 50.22
    expect(adValue(makeAd({ probability: 'Piece of cake', reward: 63 }))).toBeCloseTo(50.22);
  });

  it('is negative when the odds are poor', () => {
    // 0.46 * 100 - 0.54 * 150 = -35
    expect(adValue(makeAd({ probability: 'Risky', reward: 100 }))).toBeCloseTo(-35);
  });

  it('values an unknown label with the unknown-label odds', () => {
    // 0.3 * 50 - 0.7 * 150 = -90
    expect(adValue(makeAd({ probability: 'Mystery', reward: 50 }))).toBeCloseTo(-90);
  });
});

describe('describeAd', () => {
  it('combines odds, value, risk and the trap flag', () => {
    const insight = describeAd(makeAd({ probability: 'Sure thing', reward: 50 }));
    expect(insight.probability).toBe(0.99);
    expect(insight.value).toBeCloseTo(48);
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
