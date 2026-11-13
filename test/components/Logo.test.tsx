import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from '../../src/components/Logo';

describe('Logo', () => {
    it('renders the game logo with the title as its description', () => {
        render(<Logo />);
        const logo = screen.getByRole('img', { name: 'Dragons of Mugloar' });
        expect(logo).toHaveAttribute('src', expect.stringMatching(/logo.*\.png$/));
        // Fixed dimensions let the browser reserve the space before the image loads.
        expect(logo).toHaveAttribute('width', '1200');
        expect(logo).toHaveAttribute('height', '195');
    });

    it('passes a class name through to the image', () => {
        render(<Logo className="custom" />);
        expect(screen.getByRole('img')).toHaveClass('custom');
    });
});
