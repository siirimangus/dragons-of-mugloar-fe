import { describe, expect, it } from 'vitest';
import { arrangeBoard } from '../../src/domain/board';
import type { BoardEntry, SortKey } from '../../src/domain/types';
import { makeAd, TRAP_MESSAGE } from '../support/builders';

const ads = [
    makeAd({ adId: 'risky', probability: 'Risky', reward: 90, expiresIn: 2 }),
    makeAd({ adId: 'cake', probability: 'Piece of cake', reward: 20, expiresIn: 7 }),
    makeAd({ adId: 'sure', probability: 'Sure thing', reward: 60, expiresIn: 4 }),
];
const ids = (entries: readonly BoardEntry[]) => entries.map((entry) => entry.ad.adId);
const sortedBy = (sortKey: SortKey, list: readonly ReturnType<typeof makeAd>[] = ads) =>
    ids(arrangeBoard(list, { sortKey, hideTraps: false }).entries);

describe('arrangeBoard', () => {
    it('sorts by expected value, best first', () => {
        // risky 0.44*90-0.56*150 = -44.4, cake 0.94*20-0.06*150 = 9.8, sure 0.98*60-0.02*150 = 55.8
        expect(sortedBy('value')).toEqual(['sure', 'cake', 'risky']);
    });

    it('sorts by reward, highest first', () => {
        expect(sortedBy('reward')).toEqual(['risky', 'sure', 'cake']);
    });

    it('sorts by risk, lowest risk (highest odds) first', () => {
        expect(sortedBy('risk')).toEqual(['sure', 'cake', 'risky']);
    });

    it('sorts by expiry, soonest first', () => {
        expect(sortedBy('expiry')).toEqual(['risky', 'sure', 'cake']);
    });

    it('keeps the original order for ties and never mutates the input', () => {
        const tied = [makeAd({ adId: 'one' }), makeAd({ adId: 'two' }), makeAd({ adId: 'three' })];
        expect(sortedBy('value', tied)).toEqual(['one', 'two', 'three']);
        expect(ads.map((ad) => ad.adId)).toEqual(['risky', 'cake', 'sure']);
    });

    it('carries each ad’s insight so nothing downstream recomputes it', () => {
        const [first] = arrangeBoard(ads, { sortKey: 'value', hideTraps: false }).entries;
        expect(first?.insight).toMatchObject({ probability: 0.98, risk: 'low', trap: false });
        expect(first?.insight.expectedGain).toBeCloseTo(58.8);
        expect(first?.insight.riskCost).toBeCloseTo(3);
        expect(first?.insight.value).toBeCloseTo(55.8);
    });
});

describe('arrangeBoard trap filtering', () => {
    const withTraps = [
        makeAd({ adId: 'ok' }),
        makeAd({ adId: 'trap1', message: TRAP_MESSAGE }),
        makeAd({ adId: 'trap2', message: TRAP_MESSAGE }),
    ];

    it('hides trap ads and counts what it took away', () => {
        const board = arrangeBoard(withTraps, { sortKey: 'value', hideTraps: true });
        expect(ids(board.entries)).toEqual(['ok']);
        expect(board.hiddenTrapCount).toBe(2);
    });

    it('keeps every ad when traps are shown', () => {
        const board = arrangeBoard(withTraps, { sortKey: 'value', hideTraps: false });
        expect(ids(board.entries)).toHaveLength(3);
        expect(board.hiddenTrapCount).toBe(0);
    });

    it('keeps the advised trap visible and leaves it out of the hidden count', () => {
        const board = arrangeBoard(withTraps, {
            sortKey: 'value',
            hideTraps: true,
            keepAdId: 'trap2',
        });
        expect(ids(board.entries)).toEqual(['ok', 'trap2']);
        expect(board.hiddenTrapCount).toBe(1);
    });
});
