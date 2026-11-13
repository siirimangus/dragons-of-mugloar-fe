import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Advisor } from '../../src/components/Advisor';
import type { Advice } from '../../src/domain/types';

const solve: Advice = {
    kind: 'solve',
    targetId: 'a1',
    headline: 'Solve "Help Ann"',
    reason: 'About 94% chance to win 60 gold.',
};
const none: Advice = {
    kind: 'none',
    targetId: null,
    headline: 'No safe move',
    reason: 'Only trap ads are left.',
};

describe('Advisor', () => {
    it('shows the headline and the reason', () => {
        render(<Advisor advice={solve} disabled={false} onDo={() => undefined} />);
        expect(screen.getByRole('heading', { name: 'Advisor' })).toBeInTheDocument();
        expect(screen.getByText('Solve "Help Ann"')).toBeInTheDocument();
        expect(screen.getByText('About 94% chance to win 60 gold.')).toBeInTheDocument();
    });

    it('performs the suggestion with one click', async () => {
        const user = userEvent.setup();
        const onDo = vi.fn();
        render(<Advisor advice={solve} disabled={false} onDo={onDo} />);
        await user.click(screen.getByRole('button', { name: 'Do it' }));
        expect(onDo).toHaveBeenCalledTimes(1);
    });

    it('has nothing to do when there is no safe move, and while an action runs', () => {
        const { rerender } = render(
            <Advisor advice={none} disabled={false} onDo={() => undefined} />,
        );
        expect(screen.getByRole('button', { name: 'Do it' })).toBeDisabled();
        rerender(<Advisor advice={solve} disabled onDo={() => undefined} />);
        expect(screen.getByRole('button', { name: 'Do it' })).toBeDisabled();
    });
});
