import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../src/api/errors';
import { App } from '../../src/App';
import { FakeDragonsApi } from '../support/fake-dragons-api';
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

  it('disables every control, including the error banner, while an action is in flight', async () => {
    const api = new FakeDragonsApi();
    const { user } = renderWithGame(<App />, api);
    await user.click(screen.getByRole('button', { name: 'Start new game' }));
    const solveButtons = await screen.findAllByRole('button', { name: 'Solve' });
    api.failNext('solve', new ApiError('net', { retryable: true }));
    await user.click(solveButtons[0]!);
    await screen.findByRole('alert');

    const release = api.hold('solve');
    await user.click(solveButtons[1]!);
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'End game' })).toBeDisabled();
    release();
  });
});
