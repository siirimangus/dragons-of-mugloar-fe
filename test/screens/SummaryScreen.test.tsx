import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';
import { SummaryScreen } from '../../src/screens/SummaryScreen';
import { FakeDragonsApi } from '../support/fake-dragons-api';
import { clickWhenEnabled } from '../support/click';
import { renderWithGame } from '../support/render';

describe('SummaryScreen', () => {
  it('renders without a game instead of crashing', () => {
    renderWithGame(<SummaryScreen />, new FakeDragonsApi());
    expect(screen.getByRole('heading', { name: 'Game over' })).toBeInTheDocument();
  });

  it('summarises a finished game and starts over', async () => {
    const api = new FakeDragonsApi({ lives: 1, solveSucceeds: () => false });
    const { user } = renderWithGame(<App />, api);
    await user.click(screen.getByRole('button', { name: 'Start new game' }));
    await screen.findAllByRole('button', { name: 'Solve' });
    await clickWhenEnabled(user, () => screen.getAllByRole('button', { name: 'Solve' })[0]!);

    expect(await screen.findByRole('heading', { name: 'Game over' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Game over' })).toHaveFocus());
    expect(screen.getByText('Final score')).toBeInTheDocument();
    expect(screen.getByText(/goal not reached/i)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('data-slot', 'summary');

    await clickWhenEnabled(user, () => screen.getByRole('button', { name: 'Play again' }));
    expect(await screen.findByRole('button', { name: 'Start new game' })).toBeInTheDocument();
  });
});
