import { describe, expect, it } from 'vitest';
import { arrangeBoard } from '../../src/domain/board';
import type { SortKey } from '../../src/domain/types';
import { makeAd } from '../support/builders';

const ads = [
    makeAd({ adId: 'risky', probability: 'Risky', reward: 90, expiresIn: 2 }),
    makeAd({ adId: 'cake', probability: 'Piece of cake', reward: 20, expiresIn: 7 }),
    makeAd({ adId: 'sure', probability: 'Sure thing', reward: 60, expiresIn: 4 }),
];
const ids = (list: readonly ReturnType<typeof makeAd>[] = ads, sortKey: SortKey = 'value') =>
    arrangeBoard(list, sortKey).map((entry) => entry.ad.adId);

describe('arrangeBoard', () => {
    it('sorts by expected value, best first', () => {
        // risky 0.44*90-0.56*150 = -44.4, cake 0.94*20-0.06*150 = 9.8, sure 0.98*60-0.02*150 = 55.8
        expect(ids(ads, 'value')).toEqual(['sure', 'cake', 'risky']);
    });

    it('sorts by reward, highest first', () => {
        expect(ids(ads, 'reward')).toEqual(['risky', 'sure', 'cake']);
    });

    it('sorts by risk, lowest risk (highest odds) first', () => {
        expect(ids(ads, 'risk')).toEqual(['sure', 'cake', 'risky']);
    });

    it('sorts by expiry, soonest first', () => {
        expect(ids(ads, 'expiry')).toEqual(['risky', 'sure', 'cake']);
    });

    it('keeps the original order for ties and never mutates the input', () => {
        const tied = [makeAd({ adId: 'one' }), makeAd({ adId: 'two' }), makeAd({ adId: 'three' })];
        expect(ids(tied, 'value')).toEqual(['one', 'two', 'three']);
        expect(ads.map((ad) => ad.adId)).toEqual(['risky', 'cake', 'sure']);
    });

    it('carries each ad’s insight so nothing downstream recomputes it', () => {
        const [first] = arrangeBoard(ads, 'value');
        expect(first?.insight).toMatchObject({ probability: 0.98, risk: 'low', trap: false });
        expect(first?.insight.expectedGain).toBeCloseTo(58.8);
        expect(first?.insight.riskCost).toBeCloseTo(3);
        expect(first?.insight.value).toBeCloseTo(55.8);
    });
});
