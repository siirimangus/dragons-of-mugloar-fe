import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameHeader } from '../../src/components/GameHeader';
import { makeSession } from '../support/builders';

const session = makeSession({ score: 1240, gold: 310, lives: 3, level: 4, turn: 23 });
const stat = (label: string) => within(screen.getByText(label).closest('div')!);

describe('GameHeader', () => {
    it('uses the logo as the page title', () => {
        render(<GameHeader session={session} disabled={false} onEndGame={() => undefined} />);
        const heading = screen.getByRole('heading', { level: 1 });
        // The logo is the heading's content, so its alt text is the heading's name.
        expect(heading).toHaveAccessibleName('Dragons of Mugloar');
        expect(within(heading).getByRole('img', { name: 'Dragons of Mugloar' })).toHaveAttribute(
            'src',
            expect.stringMatching(/logo.*\.png$/),
        );
    });

    it('shows score, gold, lives, level and turn', () => {
        render(<GameHeader session={session} disabled={false} onEndGame={() => undefined} />);
        expect(stat('Score').getByText('1240')).toBeInTheDocument();
        expect(stat('Gold').getByText('310')).toBeInTheDocument();
        expect(stat('Lives').getByText('3')).toBeInTheDocument();
        expect(stat('Level').getByText('4')).toBeInTheDocument();
        expect(stat('Turn').getByText('23')).toBeInTheDocument();
    });

    it('asks for confirmation before ending the game', async () => {
        const user = userEvent.setup();
        const onEndGame = vi.fn();
        render(<GameHeader session={session} disabled={false} onEndGame={onEndGame} />);

        await user.click(screen.getByRole('button', { name: 'End game' }));
        expect(onEndGame).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Yes, end game' }));
        expect(onEndGame).toHaveBeenCalledTimes(1);
    });

    it('lets the player change their mind', async () => {
        const user = userEvent.setup();
        const onEndGame = vi.fn();
        render(<GameHeader session={session} disabled={false} onEndGame={onEndGame} />);

        await user.click(screen.getByRole('button', { name: 'End game' }));
        await user.click(screen.getByRole('button', { name: 'Keep playing' }));
        expect(onEndGame).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'End game' })).toBeInTheDocument();
    });

    it('disables ending the game while an action is running', () => {
        render(<GameHeader session={session} disabled onEndGame={() => undefined} />);
        expect(screen.getByRole('button', { name: 'End game' })).toBeDisabled();
    });

    it('moves focus to the safe choice when the confirmation opens', async () => {
        const user = userEvent.setup();
        render(<GameHeader session={session} disabled={false} onEndGame={() => undefined} />);

        await user.click(screen.getByRole('button', { name: 'End game' }));
        expect(screen.getByRole('button', { name: 'Keep playing' })).toHaveFocus();
    });

    it('returns focus to End game when the confirmation is cancelled', async () => {
        const user = userEvent.setup();
        render(<GameHeader session={session} disabled={false} onEndGame={() => undefined} />);

        await user.click(screen.getByRole('button', { name: 'End game' }));
        await user.click(screen.getByRole('button', { name: 'Keep playing' }));
        expect(screen.getByRole('button', { name: 'End game' })).toHaveFocus();
    });

    it('cancels the confirmation with Escape and restores focus', async () => {
        const user = userEvent.setup();
        const onEndGame = vi.fn();
        render(<GameHeader session={session} disabled={false} onEndGame={onEndGame} />);

        await user.click(screen.getByRole('button', { name: 'End game' }));
        await user.keyboard('{Escape}');
        expect(onEndGame).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'End game' })).toHaveFocus();
    });
});
