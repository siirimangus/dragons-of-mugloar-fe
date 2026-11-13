import { describe, expect, it } from 'vitest';
import { sortAds, visibleAds } from '../../src/domain/sort';
import { makeAd, TRAP_MESSAGE } from '../support/builders';

const ads = [
    makeAd({ adId: 'risky', probability: 'Risky', reward: 90, expiresIn: 2 }),
    makeAd({ adId: 'cake', probability: 'Piece of cake', reward: 20, expiresIn: 7 }),
    makeAd({ adId: 'sure', probability: 'Sure thing', reward: 60, expiresIn: 4 }),
];
const ids = (list: readonly { adId: string }[]) => list.map((ad) => ad.adId);

describe('sortAds', () => {
    it('sorts by expected value, best first', () => {
        // values: risky 0.46*90-0.54*150 = -39.6, cake 0.94*20-0.06*150 = 9.8, sure 0.99*60-0.01*150 = 57.9
        expect(ids(sortAds(ads, 'value'))).toEqual(['sure', 'cake', 'risky']);
    });

    it('sorts by reward, highest first', () => {
        expect(ids(sortAds(ads, 'reward'))).toEqual(['risky', 'sure', 'cake']);
    });

    it('sorts by risk, lowest risk (highest odds) first', () => {
        expect(ids(sortAds(ads, 'risk'))).toEqual(['sure', 'cake', 'risky']);
    });

    it('sorts by expiry, soonest first', () => {
        expect(ids(sortAds(ads, 'expiry'))).toEqual(['risky', 'sure', 'cake']);
    });

    it('keeps the original order for ties and never mutates the input', () => {
        const tied = [makeAd({ adId: 'one' }), makeAd({ adId: 'two' }), makeAd({ adId: 'three' })];
        expect(ids(sortAds(tied, 'value'))).toEqual(['one', 'two', 'three']);
        expect(ids(ads)).toEqual(['risky', 'cake', 'sure']);
    });
});

describe('visibleAds', () => {
    const withTrap = [makeAd({ adId: 'ok' }), makeAd({ adId: 'trap', message: TRAP_MESSAGE })];

    it('hides trap ads when asked to', () => {
        expect(ids(visibleAds(withTrap, true))).toEqual(['ok']);
    });

    it('keeps every ad when traps are shown', () => {
        expect(ids(visibleAds(withTrap, false))).toEqual(['ok', 'trap']);
    });
});
