import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Illustration } from '../../src/components/Illustration';

describe('Illustration', () => {
    it.each(['hero', 'empty-board', 'summary', 'ad'] as const)(
        'renders a labelled placeholder for %s',
        (slot) => {
            render(<Illustration slot={slot} />);
            const placeholder = screen.getByRole('img');
            expect(placeholder).toHaveAttribute('data-slot', slot);
            expect(placeholder).toHaveAccessibleName(/illustration placeholder/i);
        },
    );
});
