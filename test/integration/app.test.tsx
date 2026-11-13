import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { ApiError } from '../../src/api/errors';
import type { Ad } from '../../src/domain/types';
import { FakeDragonsApi, type FakeOptions } from '../support/fake-dragons-api';
import { renderWithGame } from '../support/render';

async function startGame(options: FakeOptions = {}, api = new FakeDragonsApi(options)) {
  const view = renderWithGame(<App />, api);
  await view.user.click(screen.getByRole('button', { name: 'Start new game' }));
  await screen.findByRole('heading', { name: 'Message board' });
  return { ...view, api };
}

const stat = (label: string) => within(screen.getByText(label).closest('div')!);

describe('playing the game', () => {
  it('starts a game and shows the header, the board without traps, and the shop', async () => {
    await startGame();
    expect(stat('Score').getByText('0')).toBeInTheDocument();
    expect(stat('Lives').getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Help Ann to fix their wagon')).toBeInTheDocument();
    expect(screen.getByText('Escort Bob to the market')).toBeInTheDocument();
    expect(screen.queryByText(/super awesome/i)).not.toBeInTheDocument();
    expect(screen.getByText('1 trap ad hidden')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buy Healing potion' })).toBeInTheDocument();
  });

  it('solves the recommended ad, updates the header and loads a new board', async () => {
    const { user } = await startGame();
    const recommended = screen.getByText('Recommended').closest('li')!;
    expect(within(recommended).getByText('Help Ann to fix their wagon')).toBeInTheDocument();

    await user.click(within(recommended).getByRole('button', { name: 'Solve' }));

    await screen.findByText('You successfully solved the mission!');
    expect(stat('Score').getByText('60')).toBeInTheDocument();
    expect(stat('Gold').getByText('60')).toBeInTheDocument();
    expect(stat('Turn').getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Turn 1: Solved: Help Ann to fix their wagon')).toBeInTheDocument();
  });

  it('shows the goal as reached once the score passes 1000', async () => {
    const { user } = await startGame({ score: 990 });
    expect(screen.queryByText(/goal reached/i)).not.toBeInTheDocument();
    await user.click(
      within(screen.getByText('Recommended').closest('li')!).getByRole('button', { name: 'Solve' }),
    );
    expect(await screen.findByText('Goal reached!')).toBeInTheDocument();
  });

  it('buys an item, updates gold, lives and the purchase count', async () => {
    const { user } = await startGame({ gold: 100 });
    await user.click(screen.getByRole('button', { name: 'Buy Healing potion' }));
    await screen.findByText('You bought Healing potion.');
    expect(stat('Lives').getByText('4')).toBeInTheDocument();
    expect(stat('Gold').getByText('50')).toBeInTheDocument();
    expect(screen.getByText('bought x1')).toBeInTheDocument();
  });

  it('follows the advisor with one click', async () => {
    const { user } = await startGame({ lives: 2, gold: 60 });
    expect(screen.getByText('Buy a healing potion')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Do it' }));
    await screen.findByText('You bought Healing potion.');
    expect(stat('Lives').getByText('3')).toBeInTheDocument();
  });

  it('asks for confirmation before solving a trap and loses a life when it fails', async () => {
    const { user } = await startGame();
    await user.click(screen.getByRole('checkbox', { name: /hide trap ads/i }));
    const trapCard = screen.getByText('Trap likely').closest('li')!;
    await user.click(within(trapCard).getByRole('button', { name: 'Solve anyway' }));
    await user.click(within(trapCard).getByRole('button', { name: 'Yes, solve anyway' }));

    expect(await screen.findByText(/fell into a trap/i)).toBeInTheDocument();
    expect(stat('Lives').getByText('2')).toBeInTheDocument();
  });

  it('disables the action buttons while a request is running', async () => {
    const api = new FakeDragonsApi();
    const { user } = await startGame({}, api);
    const release = api.hold('solve');
    await user.click(
      within(screen.getByText('Recommended').closest('li')!).getByRole('button', { name: 'Solve' }),
    );

    for (const button of screen.getAllByRole('button', { name: 'Solve' }))
      expect(button).toBeDisabled();
    expect(screen.getByRole('button', { name: 'End game' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Do it' })).toBeDisabled();

    release();
    await screen.findByText('You successfully solved the mission!');
    expect(screen.getAllByRole('button', { name: 'Solve' })[0]).toBeEnabled();
  });
});

describe('when things go wrong', () => {
  it('shows a Retry banner after a network error and repeats the solve', async () => {
    const api = new FakeDragonsApi();
    const { user } = await startGame({}, api);
    api.failNext('solve', new ApiError('net', { retryable: true }));
    await user.click(
      within(screen.getByText('Recommended').closest('li')!).getByRole('button', { name: 'Solve' }),
    );

    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent(/could not reach the game server/i);
    expect(screen.getByText('Help Ann to fix their wagon')).toBeInTheDocument();

    await user.click(within(banner).getByRole('button', { name: 'Retry' }));
    await screen.findByText('You successfully solved the mission!');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers to start over when the game has expired', async () => {
    const api = new FakeDragonsApi();
    const { user } = await startGame({}, api);
    api.failNext('solve', new ApiError('gone', { status: 404, retryable: false }));
    await user.click(
      within(screen.getByText('Recommended').closest('li')!).getByRole('button', { name: 'Solve' }),
    );

    expect(await screen.findByText('This game has expired. Start a new one.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByRole('button', { name: 'Start new game' })).toBeInTheDocument();
  });

  it('marks an ad the server rejects as unavailable and keeps playing', async () => {
    const api = new FakeDragonsApi();
    const { user } = await startGame({}, api);
    api.failNext('solve', new ApiError('Bad Request', { status: 400, retryable: false }));
    await user.click(
      within(screen.getByText('Recommended').closest('li')!).getByRole('button', { name: 'Solve' }),
    );

    expect(await screen.findAllByText(/no longer available/i)).not.toHaveLength(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('ending the game', () => {
  it('ends when the last life is lost and shows the summary', async () => {
    const { user } = await startGame({ lives: 1, solveSucceeds: () => false });
    await user.click(
      within(screen.getByText('Recommended').closest('li')!).getByRole('button', { name: 'Solve' }),
    );

    expect(await screen.findByRole('heading', { name: 'Game over' })).toBeInTheDocument();
    expect(screen.getByText('Final score')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByRole('button', { name: 'Start new game' })).toBeInTheDocument();
  });

  it('lets the player end the game after confirming', async () => {
    const { user } = await startGame({ score: 1200 });
    await user.click(screen.getByRole('button', { name: 'End game' }));
    await user.click(screen.getByRole('button', { name: 'Yes, end game' }));

    expect(await screen.findByRole('heading', { name: 'Game over' })).toBeInTheDocument();
    expect(screen.getByText(/goal reached/i)).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
  });
});

describe('while a request is in flight', () => {
  it('locks every action while a retry runs, then returns to normal when the result arrives', async () => {
    const api = new FakeDragonsApi({ gold: 100 });
    const { user } = await startGame({}, api);
    const recommended = () => within(screen.getByText('Recommended').closest('li')!);
    api.failNext('solve', new ApiError('net', { retryable: true }));
    await user.click(recommended().getByRole('button', { name: 'Solve' }));
    const banner = await screen.findByRole('alert');

    const release = api.hold('solve');
    await user.click(within(banner).getByRole('button', { name: 'Retry' }));

    const locked = [
      ...screen.getAllByRole('button', { name: 'Solve' }),
      ...screen.getAllByRole('button', { name: /^Buy / }),
      screen.getByRole('button', { name: 'End game' }),
    ];
    for (const button of locked) expect(button).toBeDisabled();
    // Starting an action clears the error, so the banner buttons cannot be clicked mid-flight.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    release();
    await screen.findByText('You successfully solved the mission!');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End game' })).toBeEnabled();
    expect(screen.getAllByRole('button', { name: 'Solve' })[0]).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Buy Healing potion' })).toBeEnabled();
  });
});

describe('when the server repeats an ad id', () => {
  class DuplicateIdApi extends FakeDragonsApi {
    override async getMessages(gameId: string): Promise<Ad[]> {
      const ads = await super.getMessages(gameId);
      return ads.map((ad, index) => (index === 1 ? { ...ad, adId: ads[0]!.adId } : ad));
    }
  }

  it('renders both ads without key warnings and still solves one', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { user } = await startGame({}, new DuplicateIdApi());
      expect(screen.getByText('Help Ann to fix their wagon')).toBeInTheDocument();
      expect(screen.getByText('Escort Bob to the market')).toBeInTheDocument();

      // Advice is matched by ad id, so both duplicates are marked Recommended.
      const [first] = screen.getAllByText('Recommended');
      await user.click(
        within(first!.closest('li')!).getByRole('button', {
          name: 'Solve',
        }),
      );
      await screen.findByText('You successfully solved the mission!');
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
  });
});
