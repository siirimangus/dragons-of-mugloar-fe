import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Illustration } from '../../src/components/Illustration';

describe('Illustration', () => {
    it.each(['empty-board', 'summary', 'ad'] as const)(
        'renders a labelled placeholder for %s',
        (slot) => {
            render(<Illustration slot={slot} />);
            const placeholder = screen.getByRole('img');
            expect(placeholder).toHaveAttribute('data-slot', slot);
            expect(placeholder).toHaveAccessibleName(/illustration placeholder/i);
        },
    );

    it('renders the dragon artwork for the hero slot', () => {
        render(<Illustration slot="hero" />);
        const image = screen.getByRole('img');
        expect(image.tagName).toBe('IMG');
        expect(image).toHaveAttribute('data-slot', 'hero');
        expect(image).toHaveAttribute('src', expect.stringMatching(/dragon-in-barn.*\.webp$/));
        expect(image).toHaveAccessibleName(/dragon/i);
        expect(image).not.toHaveAccessibleName(/placeholder/i);
        // Fixed dimensions let the browser reserve the space before the image loads.
        expect(image).toHaveAttribute('width', '1200');
        expect(image).toHaveAttribute('height', '857');
    });
});
