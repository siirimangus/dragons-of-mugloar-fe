import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GoalBar } from '../../src/components/GoalBar';

describe('GoalBar', () => {
    it('shows progress toward the 1000-point goal', () => {
        render(<GoalBar score={250} />);
        expect(screen.getByRole('progressbar', { name: /goal/i })).toHaveAttribute('value', '250');
        expect(screen.getByText('250 / 1000')).toBeInTheDocument();
        expect(screen.queryByText(/goal reached/i)).not.toBeInTheDocument();
    });

    it('announces when the goal is reached and caps the bar', () => {
        render(<GoalBar score={1240} />);
        expect(screen.getByRole('progressbar', { name: /goal/i })).toHaveAttribute('value', '1000');
        expect(screen.getByText(/goal reached/i)).toBeInTheDocument();
    });
});
