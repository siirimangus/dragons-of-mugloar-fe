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
    confirm: false,
};
const none: Advice = {
    kind: 'none',
    targetId: null,
    headline: 'No move available',
    reason: 'The board is empty.',
    confirm: false,
};

const trapAdvice: Advice = {
    kind: 'solve',
    targetId: 'trap',
    headline: 'Solve "Steal super awesome diamond pot"',
    reason: 'Only traps are left and you cannot afford a potion.',
    confirm: true,
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

    it('asks for confirmation before advice that costs a life', async () => {
        const user = userEvent.setup();
        const onDo = vi.fn();
        render(<Advisor advice={trapAdvice} disabled={false} onDo={onDo} />);
        await user.click(screen.getByRole('button', { name: 'Do it' }));
        expect(onDo).not.toHaveBeenCalled();
        expect(screen.getByText('You will probably lose a life. Do it anyway?')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Yes, do it anyway' }));
        expect(onDo).toHaveBeenCalledTimes(1);
    });

    it('cancels the confirmation with the Cancel button and with Escape', async () => {
        const user = userEvent.setup();
        render(<Advisor advice={trapAdvice} disabled={false} onDo={() => undefined} />);
        await user.click(screen.getByRole('button', { name: 'Do it' }));
        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.getByRole('button', { name: 'Do it' })).toHaveFocus();

        await user.click(screen.getByRole('button', { name: 'Do it' }));
        await user.keyboard('{Escape}');
        expect(screen.getByRole('button', { name: 'Do it' })).toBeInTheDocument();
    });

    it('drops a half-finished confirmation when the advice changes', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <Advisor advice={trapAdvice} disabled={false} onDo={() => undefined} />,
        );
        await user.click(screen.getByRole('button', { name: 'Do it' }));
        expect(screen.getByRole('button', { name: 'Yes, do it anyway' })).toBeInTheDocument();
        rerender(<Advisor advice={solve} disabled={false} onDo={() => undefined} />);
        expect(screen.queryByRole('button', { name: 'Yes, do it anyway' })).not.toBeInTheDocument();
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
