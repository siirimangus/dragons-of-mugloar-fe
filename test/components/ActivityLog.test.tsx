import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityLog, LastResultStatus } from '../../src/components/ActivityLog';

describe('ActivityLog', () => {
    it('shows the last result in a live region', () => {
        render(
            <LastResultStatus
                lastResult={{ text: 'You failed on the mission!', success: false }}
                firstLogId={undefined}
            />,
        );
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('You failed on the mission!');
    });

    it('keeps the live region mounted when there is no result yet', () => {
        render(<LastResultStatus lastResult={null} firstLogId={undefined} />);
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('re-announces a repeated result with identical text', () => {
        const result = { text: 'You bought Healing potion.', success: true };
        const { rerender } = render(<LastResultStatus lastResult={result} firstLogId={1} />);
        const before = screen.getByRole('status').firstElementChild;
        rerender(<LastResultStatus lastResult={{ ...result }} firstLogId={2} />);
        const after = screen.getByRole('status').firstElementChild;
        expect(before).not.toBeNull();
        expect(after).not.toBe(before);
        expect(after).toHaveTextContent('You bought Healing potion.');
    });

    it('lists recent turns, newest first', () => {
        render(
            <ActivityLog
                log={[
                    { id: 2, turn: 2, success: false, text: 'Failed: Help Bob' },
                    { id: 1, turn: 1, success: true, text: 'Solved: Help Ann' },
                ]}
            />,
        );
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent('Turn 2: Failed: Help Bob');
        expect(items[1]).toHaveTextContent('Turn 1: Solved: Help Ann');
    });

    it('explains an empty log', () => {
        render(<ActivityLog log={[]} />);
        expect(screen.getByText(/nothing has happened yet/i)).toBeInTheDocument();
    });
});
