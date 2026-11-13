import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../src/api/errors';
import { StartScreen } from '../../src/screens/StartScreen';
import { FakeDragonsApi } from '../support/fake-dragons-api';
import { clickWhenEnabled } from '../support/click';
import { renderWithGame } from '../support/render';

describe('StartScreen', () => {
  it('explains the game and offers to start', () => {
    renderWithGame(<StartScreen />, new FakeDragonsApi());
    expect(screen.getByRole('heading', { name: 'Dragons of Mugloar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start new game' })).toBeEnabled();
    expect(screen.getByRole('img')).toHaveAttribute('data-slot', 'hero');
    expect(screen.getByText(/reach 1000 points/i)).toBeInTheDocument();
  });

  it('shows a Retry banner when the game cannot be started, then starts', async () => {
    const api = new FakeDragonsApi();
    api.failNext('startGame', new ApiError('net', { retryable: true }));
    const { user } = renderWithGame(<StartScreen />, api);
    await user.click(screen.getByRole('button', { name: 'Start new game' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the game server/i);
    await clickWhenEnabled(user, () => screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(api.calls.filter((call) => call === 'startGame')).toHaveLength(2));
  });

  it('disables the button and says so while starting', async () => {
    const api = new FakeDragonsApi();
    const release = api.hold('startGame');
    const { user } = renderWithGame(<StartScreen />, api);
    await user.click(screen.getByRole('button', { name: 'Start new game' }));
    expect(await screen.findByRole('button', { name: 'Starting...' })).toBeDisabled();
    release();
  });

  it('disables the banner buttons while a start is in flight', async () => {
    const api = new FakeDragonsApi();
    api.failNext('startGame', new ApiError('net', { retryable: true }));
    const { user } = renderWithGame(<StartScreen />, api);
    await user.click(screen.getByRole('button', { name: 'Start new game' }));
    await screen.findByRole('alert');
    const release = api.hold('startGame');
    await clickWhenEnabled(user, () => screen.getByRole('button', { name: 'Start new game' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Starting...' })).toBeDisabled();
      // The banner is cleared when an action starts; if it is still shown, it must be disabled too.
      const banner = screen.queryByRole('alert');
      if (banner) {
        for (const button of within(banner).getAllByRole('button')) expect(button).toBeDisabled();
      }
    });
    release();
  });
});
