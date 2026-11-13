import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBanner } from '../../src/components/ErrorBanner';

const handlers = () => ({ onRetry: vi.fn(), onDismiss: vi.fn(), onPlayAgain: vi.fn() });

describe('ErrorBanner', () => {
  it('shows the message as an alert with Retry and Dismiss', async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(
      <ErrorBanner
        error={{
          message: 'Could not reach the game server.',
          retry: { kind: 'start' },
          expired: false,
        }}
        disabled={false}
        {...h}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the game server.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(h.onRetry).toHaveBeenCalledTimes(1);
    expect(h.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('offers no Retry when the action cannot be repeated', () => {
    render(
      <ErrorBanner
        error={{ message: 'Something went wrong.', retry: null, expired: false }}
        disabled={false}
        {...handlers()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('offers Play again for an expired game', async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(
      <ErrorBanner
        error={{ message: 'This game has expired. Start a new one.', retry: null, expired: true }}
        disabled={false}
        {...h}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(h.onPlayAgain).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('disables Retry and Dismiss while an action runs', async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(
      <ErrorBanner
        error={{
          message: 'Could not reach the game server.',
          retry: { kind: 'start' },
          expired: false,
        }}
        disabled
        {...h}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toBeDisabled();
      await user.click(button);
    }
    expect(h.onRetry).not.toHaveBeenCalled();
    expect(h.onDismiss).not.toHaveBeenCalled();
  });

  it('disables Play again while an action runs', async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(
      <ErrorBanner
        error={{ message: 'This game has expired. Start a new one.', retry: null, expired: true }}
        disabled
        {...h}
      />,
    );
    const button = screen.getByRole('button', { name: 'Play again' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(h.onPlayAgain).not.toHaveBeenCalled();
  });
});
