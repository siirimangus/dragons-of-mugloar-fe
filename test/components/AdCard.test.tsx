import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdCard } from '../../src/components/AdCard';
import { describeAd } from '../../src/domain/value';
import { makeAd, TRAP_MESSAGE } from '../support/builders';

const ad = makeAd({
  adId: 'good',
  message: 'Help Ann to fix their wagon',
  reward: 63,
  expiresIn: 5,
  probability: 'Piece of cake',
});
const trap = makeAd({
  adId: 'trap',
  message: TRAP_MESSAGE,
  reward: 421,
  probability: 'Sure thing',
});

function renderCard(props: Partial<React.ComponentProps<typeof AdCard>> = {}) {
  const onSolve = vi.fn();
  render(
    <ul>
      <AdCard
        ad={ad}
        insight={describeAd(ad)}
        recommended={false}
        unavailable={false}
        disabled={false}
        onSolve={onSolve}
        {...props}
      />
    </ul>,
  );
  return { onSolve };
}

describe('AdCard', () => {
  it('shows the message, reward, expiry, odds, value and risk', () => {
    renderCard();
    expect(screen.getByText('Help Ann to fix their wagon')).toBeInTheDocument();
    expect(screen.getByText('63 gold')).toBeInTheDocument();
    expect(screen.getByText('5 turns')).toBeInTheDocument();
    expect(screen.getByText('Piece of cake')).toBeInTheDocument();
    expect(screen.getByText('~94%')).toBeInTheDocument();
    expect(screen.getByText('+50')).toBeInTheDocument();
    expect(screen.getByText('Low risk')).toBeInTheDocument();
  });

  it('solves with one click for a normal ad', async () => {
    const user = userEvent.setup();
    const { onSolve } = renderCard();
    await user.click(screen.getByRole('button', { name: 'Solve' }));
    expect(onSolve).toHaveBeenCalledWith('good');
  });

  it('describes the Solve button with the ad message', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Solve' })).toHaveAccessibleDescription(
      'Help Ann to fix their wagon',
    );
  });

  it('shows the recommended badge', () => {
    renderCard({ recommended: true });
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('disables solving while an action runs', () => {
    renderCard({ disabled: true });
    expect(screen.getByRole('button', { name: 'Solve' })).toBeDisabled();
  });

  it('marks an unavailable ad and cannot be solved', () => {
    renderCard({ unavailable: true });
    expect(screen.getByText(/no longer available/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solve' })).toBeDisabled();
  });

  it('warns about a trap and needs a confirmation before solving it', async () => {
    const user = userEvent.setup();
    const { onSolve } = renderCard({ ad: trap, insight: describeAd(trap) });
    expect(screen.getByText('Trap likely')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Solve anyway' }));
    expect(onSolve).not.toHaveBeenCalled();
    expect(screen.getByText(/probably lose a life/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Yes, solve anyway' }));
    expect(onSolve).toHaveBeenCalledWith('trap');
  });

  it('lets the player back out of a trap', async () => {
    const user = userEvent.setup();
    const { onSolve } = renderCard({ ad: trap, insight: describeAd(trap) });
    await user.click(screen.getByRole('button', { name: 'Solve anyway' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onSolve).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Solve anyway' })).toBeInTheDocument();
  });

  it('moves focus to the safe choice when the trap confirmation opens', async () => {
    const user = userEvent.setup();
    renderCard({ ad: trap, insight: describeAd(trap) });
    await user.click(screen.getByRole('button', { name: 'Solve anyway' }));
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('returns focus to Solve anyway when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    renderCard({ ad: trap, insight: describeAd(trap) });
    await user.click(screen.getByRole('button', { name: 'Solve anyway' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Solve anyway' })).toHaveFocus();
  });

  it('cancels the trap confirmation with Escape and restores focus', async () => {
    const user = userEvent.setup();
    const { onSolve } = renderCard({ ad: trap, insight: describeAd(trap) });
    await user.click(screen.getByRole('button', { name: 'Solve anyway' }));
    await user.keyboard('{Escape}');
    expect(onSolve).not.toHaveBeenCalled();
    expect(screen.queryByRole('group', { name: 'Confirm solving a trap' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solve anyway' })).toHaveFocus();
  });
});
