import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Shop } from '../../src/components/Shop';
import { SHOP } from '../support/builders';

function renderShop(props: Partial<React.ComponentProps<typeof Shop>> = {}) {
  const onBuy = vi.fn();
  render(
    <Shop
      shop={SHOP}
      gold={120}
      purchases={{}}
      advisedItemId={null}
      disabled={false}
      onBuy={onBuy}
      {...props}
    />,
  );
  return { onBuy };
}

describe('Shop', () => {
  it('groups healing and upgrades and shows cost and effect', () => {
    renderShop();
    expect(screen.getByRole('heading', { name: 'Healing' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upgrades' })).toBeInTheDocument();
    const potion = screen.getByText('Healing potion').closest('li')!;
    expect(within(potion).getByText('50 gold')).toBeInTheDocument();
    expect(within(potion).getByText('+1 life')).toBeInTheDocument();
    const honing = screen.getByText('Claw Honing').closest('li')!;
    expect(within(honing).getByText('300 gold')).toBeInTheDocument();
    expect(within(honing).getByText('+2 dragon levels')).toBeInTheDocument();
  });

  it('disables items the player cannot afford', () => {
    renderShop({ gold: 120 });
    expect(screen.getByRole('button', { name: 'Buy Healing potion' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Buy Claw Sharpening' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Buy Claw Honing' })).toBeDisabled();
  });

  it('disables every button while an action runs', () => {
    renderShop({ disabled: true, gold: 1000 });
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });

  it('buys the clicked item', async () => {
    const user = userEvent.setup();
    const { onBuy } = renderShop();
    await user.click(screen.getByRole('button', { name: 'Buy Gasoline' }));
    expect(onBuy).toHaveBeenCalledWith('gas');
  });

  it('shows how many times an item was bought', () => {
    renderShop({ purchases: { hpot: 3, cs: 1 } });
    expect(
      within(screen.getByText('Healing potion').closest('li')!).getByText('bought x3'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByText('Claw Sharpening').closest('li')!).getByText('bought x1'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByText('Gasoline').closest('li')!).queryByText(/bought/),
    ).not.toBeInTheDocument();
  });

  it('highlights the advisor pick', () => {
    renderShop({ advisedItemId: 'cs' });
    expect(
      within(screen.getByText('Claw Sharpening').closest('li')!).getByText('Suggested'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Suggested')).toHaveLength(1);
  });
});
