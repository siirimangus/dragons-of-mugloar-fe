import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdBoard } from '../../src/components/AdBoard';
import { makeAd, TRAP_MESSAGE } from '../support/builders';

const ads = [
    makeAd({ adId: 'risky', message: 'Risky job', probability: 'Risky', reward: 90, expiresIn: 2 }),
    makeAd({
        adId: 'cake',
        message: 'Cake job',
        probability: 'Piece of cake',
        reward: 20,
        expiresIn: 7,
    }),
    makeAd({
        adId: 'sure',
        message: 'Sure job',
        probability: 'Sure thing',
        reward: 60,
        expiresIn: 4,
    }),
    makeAd({
        adId: 'trap',
        message: TRAP_MESSAGE,
        probability: 'Sure thing',
        reward: 421,
        expiresIn: 3,
    }),
];

function renderBoard(props: Partial<React.ComponentProps<typeof AdBoard>> = {}) {
    const onSolve = vi.fn();
    render(
        <AdBoard
            ads={ads}
            advisedAdId={null}
            unavailableAdIds={[]}
            status="ready"
            disabled={false}
            onSolve={onSolve}
            {...props}
        />,
    );
    return { onSolve };
}

const cardMessages = () =>
    screen.getAllByRole('listitem').map((item) => within(item).getByText(/job|Steal/).textContent);

describe('AdBoard', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('lists every ad, trap ads included, best value first by default', () => {
        renderBoard();
        // trap: 0.98*421 - 0.02*150 = 409.58, sure: 55.8, cake: 9.8, risky: -44.4
        expect(cardMessages()).toEqual([TRAP_MESSAGE, 'Sure job', 'Cake job', 'Risky job']);
        expect(screen.getByText('Trap likely')).toBeInTheDocument();
    });

    it.each([
        ['reward', [TRAP_MESSAGE, 'Risky job', 'Sure job', 'Cake job']],
        ['risk', ['Sure job', TRAP_MESSAGE, 'Cake job', 'Risky job']],
        ['expiry', ['Risky job', TRAP_MESSAGE, 'Sure job', 'Cake job']],
        ['value', [TRAP_MESSAGE, 'Sure job', 'Cake job', 'Risky job']],
    ])('sorts by %s', async (key, expected) => {
        const user = userEvent.setup();
        renderBoard();
        await user.selectOptions(screen.getByLabelText(/sort by/i), key);
        expect(cardMessages()).toEqual(expected);
    });

    it('keeps the same card element when the sort order changes', async () => {
        const user = userEvent.setup();
        renderBoard();
        const card = screen.getByText('Cake job').closest('li');
        await user.selectOptions(screen.getByLabelText(/sort by/i), 'reward');
        expect(card).toBeInTheDocument();
        expect(screen.getByText('Cake job').closest('li')).toBe(card);
    });

    it('marks only the advised ad as recommended', () => {
        renderBoard({ advisedAdId: 'sure' });
        expect(screen.getAllByText('Recommended')).toHaveLength(1);
        expect(
            within(screen.getByText('Sure job').closest('li')!).getByText('Recommended'),
        ).toBeInTheDocument();
    });

    it('solves the clicked ad', async () => {
        const user = userEvent.setup();
        const { onSolve } = renderBoard();
        const sureCard = within(screen.getByText('Sure job').closest('li')!);
        await user.click(sureCard.getByRole('button', { name: 'Solve' }));
        expect(onSolve).toHaveBeenCalledWith('sure');
    });

    it('marks rejected ads as unavailable', () => {
        renderBoard({ unavailableAdIds: ['cake'] });
        expect(screen.getByText(/no longer available/i)).toBeInTheDocument();
    });

    it('explains an empty board', () => {
        renderBoard({ ads: [] });
        expect(screen.getByText(/no messages right now/i)).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /royal request of escort/i })).toHaveAttribute(
            'data-slot',
            'empty-board',
        );
    });

    it('says so when the board is loading', () => {
        renderBoard({ status: 'loading' });
        expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
    });

    it('renders no empty list while loading with zero ads', () => {
        renderBoard({ ads: [], status: 'loading' });
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('renders two ads that share an adId without key warnings', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        renderBoard({
            ads: [
                makeAd({ adId: 'dup', message: 'Dup job', expiresIn: 5 }),
                makeAd({ adId: 'dup', message: 'Dup job', expiresIn: 3 }),
            ],
        });
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(error).not.toHaveBeenCalled();
    });
});
