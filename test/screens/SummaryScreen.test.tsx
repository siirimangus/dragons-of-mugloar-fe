import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';
import { SummaryScreen } from '../../src/screens/SummaryScreen';
import { FakeDragonsApi } from '../support/fake-dragons-api';
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
    const solveButtons = await screen.findAllByRole('button', { name: 'Solve' });
    await user.click(solveButtons[0]!);

    expect(await screen.findByRole('heading', { name: 'Game over' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Game over' })).toHaveFocus();
    expect(screen.getByText('Final score')).toBeInTheDocument();
    expect(screen.getByText(/goal not reached/i)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('data-slot', 'summary');

    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByRole('button', { name: 'Start new game' })).toBeInTheDocument();
  });
});
