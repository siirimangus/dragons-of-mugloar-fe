import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../src/api/errors';
import { StartScreen } from '../../src/screens/StartScreen';
import { FakeDragonsApi } from '../support/fake-dragons-api';
import { clickWhenEnabled } from '../support/click';
import { renderWithGame } from '../support/render';

describe('StartScreen', () => {
    it('explains the game and offers to start', () => {
        renderWithGame(<StartScreen />, new FakeDragonsApi());
        expect(screen.getByRole('heading', { name: 'Dragons of Mugloar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start new game' })).toBeEnabled();
        expect(screen.getByRole('img', { name: /missing.*zelda/i })).toHaveAttribute(
            'data-slot',
            'hero',
        );
        expect(screen.getByText(/reach 1000 points/i)).toBeInTheDocument();
    });

    it('shows the logo as the page title, above the hero picture', () => {
        renderWithGame(<StartScreen />, new FakeDragonsApi());
        const heading = screen.getByRole('heading', { level: 1 });
        // The logo is the heading's content, so its alt text is the heading's name.
        const logo = within(heading).getByRole('img', { name: 'Dragons of Mugloar' });
        expect(logo).toHaveAttribute('src', expect.stringMatching(/logo.*\.png$/));
        expect(logo).toHaveAttribute('width', '1200');
        expect(logo).toHaveAttribute('height', '195');
        const hero = screen.getByRole('img', { name: /missing.*zelda/i });
        expect(logo.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('shows a Retry banner when the game cannot be started, then starts', async () => {
        const api = new FakeDragonsApi();
        api.failNext('startGame', new ApiError('net', { retryable: true }));
        const { user } = renderWithGame(<StartScreen />, api);
        await user.click(screen.getByRole('button', { name: 'Start new game' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            /could not reach the game server/i,
        );
        await clickWhenEnabled(user, () => screen.getByRole('button', { name: 'Retry' }));
        await waitFor(() =>
            expect(api.calls.filter((call) => call === 'startGame')).toHaveLength(2),
        );
    });

    it('disables the button and says so while starting', async () => {
        const api = new FakeDragonsApi();
        const release = api.hold('startGame');
        const { user } = renderWithGame(<StartScreen />, api);
        await user.click(screen.getByRole('button', { name: 'Start new game' }));
        expect(await screen.findByRole('button', { name: 'Starting...' })).toBeDisabled();
        release();
    });

    it('disables the banner buttons while a start is in flight', async () => {
        const api = new FakeDragonsApi();
        api.failNext('startGame', new ApiError('net', { retryable: true }));
        const { user } = renderWithGame(<StartScreen />, api);
        await user.click(screen.getByRole('button', { name: 'Start new game' }));
        await screen.findByRole('alert');
        const release = api.hold('startGame');
        await clickWhenEnabled(user, () => screen.getByRole('button', { name: 'Start new game' }));
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Starting...' })).toBeDisabled();
            // Starting a game does not clear the error, so the banner stays and must be locked too.
            const banner = screen.getByRole('alert');
            expect(within(banner).getByRole('button', { name: 'Retry' })).toBeDisabled();
            expect(within(banner).getByRole('button', { name: 'Dismiss' })).toBeDisabled();
        });
        release();
    });
});
