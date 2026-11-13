import { describe, expect, it } from 'vitest';
import { isHealingItem, itemEffect } from '../../src/domain/shop';
import { SHOP } from '../support/builders';

const byId = (id: string) => {
  const item = SHOP.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`no shop item ${id}`);
  return item;
};

describe('itemEffect', () => {
  it('describes the healing potion', () => {
    expect(itemEffect(byId('hpot'))).toBe('+1 life');
  });

  it('describes 100-gold upgrades as one dragon level', () => {
    expect(itemEffect(byId('cs'))).toBe('+1 dragon level');
    expect(itemEffect(byId('wingpot'))).toBe('+1 dragon level');
  });

  it('describes 300-gold upgrades as two dragon levels', () => {
    expect(itemEffect(byId('ch'))).toBe('+2 dragon levels');
    expect(itemEffect(byId('wingpotmax'))).toBe('+2 dragon levels');
  });
});

describe('isHealingItem', () => {
  it('is true only for the healing potion', () => {
    expect(isHealingItem(byId('hpot'))).toBe(true);
    expect(isHealingItem(byId('cs'))).toBe(false);
  });
});
