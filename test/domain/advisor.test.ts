import { describe, expect, it } from 'vitest';
import { advise } from '../../src/domain/advisor';
import { MAX_POTIONS } from '../../src/domain/tuning';
import { ALL_BOUGHT, makeAd, makeSession, SHOP, TRAP_MESSAGE } from '../support/builders';

const good = makeAd({ adId: 'good', probability: 'Piece of cake', reward: 60 });
const bad = makeAd({ adId: 'bad', probability: 'Risky', reward: 80 }); // value -48.8
const trap = makeAd({
    adId: 'trap',
    message: TRAP_MESSAGE,
    probability: 'Sure thing',
    reward: 421,
});

const base = { shop: SHOP, purchases: ALL_BOUGHT, unavailableAdIds: [] as string[] };

describe('advise', () => {
    it('recommends a healing potion when lives are low and it is affordable', () => {
        const advice = advise({
            ...base,
            session: makeSession({ lives: 2, gold: 60 }),
            ads: [good],
        });
        expect(advice).toMatchObject({ kind: 'buy', targetId: 'hpot' });
        expect(advice.reason).toContain('2 lives');
    });

    it('does not heal when gold is short or lives are comfortable', () => {
        expect(
            advise({ ...base, session: makeSession({ lives: 1, gold: 49 }), ads: [good] }).kind,
        ).toBe('solve');
        expect(
            advise({ ...base, session: makeSession({ lives: 3, gold: 500 }), ads: [good] }).kind,
        ).toBe('solve');
    });

    it('recommends the next upgrade when gold stays at least 50 afterwards', () => {
        const advice = advise({
            ...base,
            purchases: {},
            session: makeSession({ gold: 150 }),
            ads: [good],
        });
        expect(advice).toMatchObject({ kind: 'buy', targetId: 'cs' });
    });

    it('keeps saving when the next upgrade is not affordable with the reserve', () => {
        const advice = advise({
            ...base,
            purchases: {},
            session: makeSession({ gold: 149 }),
            ads: [good],
        });
        expect(advice).toMatchObject({ kind: 'solve', targetId: 'good' });
    });

    it('skips upgrades that were already bought', () => {
        const advice = advise({
            ...base,
            purchases: { cs: 1 },
            session: makeSession({ gold: 200 }),
            ads: [good],
        });
        expect(advice).toMatchObject({ kind: 'buy', targetId: 'gas' });
    });

    it('recommends the best non-trap ad by expected value', () => {
        const advice = advise({ ...base, session: makeSession(), ads: [bad, trap, good] });
        expect(advice).toMatchObject({ kind: 'solve', targetId: 'good' });
    });

    it('ignores ads the API rejected', () => {
        const advice = advise({
            ...base,
            unavailableAdIds: ['good'],
            session: makeSession(),
            ads: [good, bad],
        });
        expect(advice).toMatchObject({ kind: 'solve', targetId: 'bad' });
    });

    it('waits with a potion when only trap ads are left', () => {
        const advice = advise({ ...base, session: makeSession({ gold: 50 }), ads: [trap] });
        expect(advice).toMatchObject({
            kind: 'buy',
            targetId: 'hpot',
            headline: 'Wait for a fresh board',
            reason: 'No safe messages are on the board. A potion costs a turn but brings a fresh board and a spare life.',
        });
    });

    it('solves a trap as a last resort, because only acting refreshes the board', () => {
        const advice = advise({ ...base, session: makeSession({ gold: 49 }), ads: [trap] });
        expect(advice).toMatchObject({ kind: 'solve', targetId: 'trap', confirm: true });
        expect(advice.reason).toContain('nothing else refreshes the board');
    });

    it('picks the best-paying trap when it has to solve one', () => {
        const richer = makeAd({ ...trap, adId: 'richer', reward: 500 });
        const advice = advise({ ...base, session: makeSession({ gold: 0 }), ads: [trap, richer] });
        expect(advice).toMatchObject({ kind: 'solve', targetId: 'richer' });
    });

    it('has no move at all only when the board is empty', () => {
        expect(advise({ ...base, session: makeSession({ gold: 50 }), ads: [] })).toMatchObject({
            kind: 'buy',
            reason: 'No safe messages are on the board. A potion costs a turn but brings a fresh board and a spare life.',
        });
        expect(advise({ ...base, session: makeSession({ gold: 49 }), ads: [] })).toMatchObject({
            kind: 'none',
            targetId: null,
            headline: 'No move available',
            reason: 'The board is empty and no potion is available. You can end the game.',
            confirm: false,
        });
    });

    it('waits with a potion whenever one is affordable rather than gambling', () => {
        // Turns are free and gold has no use outside the shop, so there is no reserve to keep.
        for (const gold of [350, 50]) {
            expect(advise({ ...base, session: makeSession({ gold }), ads: [bad] })).toMatchObject({
                kind: 'buy',
                targetId: 'hpot',
            });
        }
        expect(advise({ ...base, session: makeSession({ gold: 49 }), ads: [bad] })).toMatchObject({
            kind: 'solve',
            targetId: 'bad',
        });
    });

    it('warns that the fallback ad is the least bad one', () => {
        const advice = advise({ ...base, session: makeSession({ gold: 10 }), ads: [bad] });
        expect(advice.reason).toContain('least bad');
    });

    it('cannot wait when the shop has no healing potion', () => {
        const shop = SHOP.filter((item) => item.id !== 'hpot');
        const advice = advise({ ...base, shop, session: makeSession({ gold: 1000 }), ads: [trap] });
        expect(advice).toMatchObject({ kind: 'solve', targetId: 'trap', confirm: true });
    });

    it('does not claim upgrades improve the odds, because measured they do not', () => {
        const advice = advise({
            ...base,
            purchases: {},
            session: makeSession({ gold: 150 }),
            ads: [good],
        });
        expect(advice.reason).toContain('roughly doubles the rewards');
        expect(advice.reason).toContain('do not change your odds');
    });

    it('still heals one short of the potion limit', () => {
        const advice = advise({
            ...base,
            purchases: { ...ALL_BOUGHT, hpot: MAX_POTIONS - 1 },
            session: makeSession({ lives: 1, gold: 500 }),
            ads: [good],
        });
        expect(advice).toMatchObject({ kind: 'buy', targetId: 'hpot' });
    });

    it('stops recommending a potion once the limit is reached, even with lives and gold to spare', () => {
        const advice = advise({
            ...base,
            purchases: { ...ALL_BOUGHT, hpot: MAX_POTIONS },
            session: makeSession({ lives: 1, gold: 500 }),
            ads: [good],
        });
        expect(advice.kind).not.toBe('buy');
        expect(advice).toMatchObject({ kind: 'solve', targetId: 'good' });
    });

    it('stops waiting with a potion once the limit is reached, forcing the least bad ad', () => {
        const advice = advise({
            ...base,
            purchases: { ...ALL_BOUGHT, hpot: MAX_POTIONS },
            session: makeSession({ gold: 500 }),
            ads: [bad],
        });
        expect(advice).toMatchObject({ kind: 'solve', targetId: 'bad' });
        expect(advice.reason).toContain('no potion available');
    });

    it('solves a trap as a last resort once the potion limit is reached', () => {
        const advice = advise({
            ...base,
            purchases: { ...ALL_BOUGHT, hpot: MAX_POTIONS },
            session: makeSession({ gold: 500 }),
            ads: [trap],
        });
        expect(advice).toMatchObject({ kind: 'solve', targetId: 'trap', confirm: true });
        expect(advice.reason).toContain('no potion is available');
    });

    it('puts healing before upgrading and upgrading before solving', () => {
        const heal = advise({
            ...base,
            purchases: {},
            session: makeSession({ lives: 1, gold: 500 }),
            ads: [good],
        });
        expect(heal.targetId).toBe('hpot');
        const upgrade = advise({
            ...base,
            purchases: {},
            session: makeSession({ lives: 3, gold: 500 }),
            ads: [good],
        });
        expect(upgrade.targetId).toBe('cs');
    });
});
