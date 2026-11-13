import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../src/api/errors';
import { App } from '../../src/App';
import { FakeDragonsApi } from '../support/fake-dragons-api';
import { clickWhenEnabled } from '../support/click';
import { renderWithGame } from '../support/render';

describe('GameScreen', () => {
  it('has a main landmark and focuses the heading when play starts', async () => {
    const { user } = renderWithGame(<App />, new FakeDragonsApi());
    await user.click(screen.getByRole('button', { name: 'Start new game' }));
    await screen.findAllByRole('button', { name: 'Solve' });
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('mounts a single advisor panel', async () => {
    const { user } = renderWithGame(<App />, new FakeDragonsApi());
    await user.click(screen.getByRole('button', { name: 'Start new game' }));
    await screen.findAllByRole('button', { name: 'Solve' });
    expect(document.querySelectorAll('#advisor-title')).toHaveLength(1);
  });

  it('disables the board, shop and End game while an action is in flight', async () => {
    const api = new FakeDragonsApi();
    const { user } = renderWithGame(<App />, api);
    await user.click(screen.getByRole('button', { name: 'Start new game' }));
    const firstSolve = () => screen.getAllByRole('button', { name: 'Solve' })[0]!;
    await screen.findAllByRole('button', { name: 'Solve' });
    api.failNext('solve', new ApiError('net', { retryable: true }));
    await clickWhenEnabled(user, firstSolve);

    const release = api.hold('solve');
    await clickWhenEnabled(user, firstSolve);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'End game' })).toBeDisabled();
      for (const button of screen.getAllByRole('button', { name: /^Solve|^Buy/ })) {
        expect(button).toBeDisabled();
      }
      // The banner is cleared when an action starts; if it is still shown, it must be disabled too.
      const banner = screen.queryByRole('alert');
      if (banner) {
        for (const button of within(banner).getAllByRole('button')) expect(button).toBeDisabled();
      }
    });
    release();
  });
});
