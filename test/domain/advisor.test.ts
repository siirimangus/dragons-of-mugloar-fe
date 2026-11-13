import { describe, expect, it } from 'vitest';
import { advise } from '../../src/domain/advisor';
import { ALL_BOUGHT, makeAd, makeSession, SHOP, TRAP_MESSAGE } from '../support/builders';

const good = makeAd({ adId: 'good', probability: 'Piece of cake', reward: 60 });
const bad = makeAd({ adId: 'bad', probability: 'Risky', reward: 80 }); // value -44.2
const trap = makeAd({
  adId: 'trap',
  message: TRAP_MESSAGE,
  probability: 'Sure thing',
  reward: 421,
});

const base = { shop: SHOP, purchases: ALL_BOUGHT, unavailableAdIds: [] as string[] };

describe('advise', () => {
  it('recommends a healing potion when lives are low and it is affordable', () => {
    const advice = advise({ ...base, session: makeSession({ lives: 2, gold: 60 }), ads: [good] });
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
    });
  });

  it('says there is no safe move with only traps and no gold', () => {
    const advice = advise({ ...base, session: makeSession({ gold: 49 }), ads: [trap] });
    expect(advice).toMatchObject({ kind: 'none', targetId: null, headline: 'No safe move' });
  });

  it('waits instead of gambling on a bad ad only when gold stays at least 300 afterwards', () => {
    expect(advise({ ...base, session: makeSession({ gold: 350 }), ads: [bad] })).toMatchObject({
      kind: 'buy',
      targetId: 'hpot',
    });
    expect(advise({ ...base, session: makeSession({ gold: 349 }), ads: [bad] })).toMatchObject({
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
    expect(advice.kind).toBe('none');
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
