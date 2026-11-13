import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Illustration } from '../../src/components/Illustration';

describe('Illustration', () => {
    it('renders a labelled placeholder for the ad icon, which has no artwork yet', () => {
        render(<Illustration slot="ad" />);
        const placeholder = screen.getByRole('img');
        expect(placeholder).toHaveAttribute('data-slot', 'ad');
        expect(placeholder).toHaveAccessibleName(/illustration placeholder/i);
    });

    it('shows the escort-request parchment in the empty-board slot', () => {
        render(<Illustration slot="empty-board" />);
        const image = screen.getByRole('img');
        expect(image.tagName).toBe('IMG');
        expect(image).toHaveAttribute('data-slot', 'empty-board');
        expect(image).toHaveAttribute('src', expect.stringMatching(/ambassador-on-paper.*\.webp$/));
        // The picture contains text, so the description carries it.
        expect(image).toHaveAccessibleName(/royal request of escort.*tao/i);
        expect(image).not.toHaveAccessibleName(/placeholder/i);
        expect(image).toHaveAttribute('width', '800');
        expect(image).toHaveAttribute('height', '571');
    });

    it('shows the missing-poster artwork in the hero slot', () => {
        render(<Illustration slot="hero" />);
        const image = screen.getByRole('img');
        expect(image.tagName).toBe('IMG');
        expect(image).toHaveAttribute('data-slot', 'hero');
        expect(image).toHaveAttribute('src', expect.stringMatching(/zelda-on-paper.*\.webp$/));
        // The picture contains text, so the description carries it.
        expect(image).toHaveAccessibleName(/missing.*zelda.*reward on return/i);
        expect(image).not.toHaveAccessibleName(/placeholder/i);
        // Fixed dimensions let the browser reserve the space before the image loads.
        expect(image).toHaveAttribute('width', '1200');
        expect(image).toHaveAttribute('height', '1092');
    });

    it('shows the dragon-in-the-barn sketch in the summary slot', () => {
        render(<Illustration slot="summary" />);
        const image = screen.getByRole('img');
        expect(image.tagName).toBe('IMG');
        expect(image).toHaveAttribute('data-slot', 'summary');
        expect(image).toHaveAttribute('src', expect.stringMatching(/dragon-in-barn.*\.webp$/));
        expect(image).toHaveAccessibleName(/dragon looking out of a small barn/i);
        expect(image).not.toHaveAccessibleName(/placeholder/i);
        expect(image).toHaveAttribute('width', '1200');
        expect(image).toHaveAttribute('height', '857');
    });
});
