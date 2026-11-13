import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../src/api/errors';
import { useGameActions, useGameState } from '../../src/state/game-context';
import { GameProvider } from '../../src/state/GameProvider';
import { FakeDragonsApi } from '../support/fake-dragons-api';

function setup(api: FakeDragonsApi) {
    const wrapper = ({ children }: { children: ReactNode }) => (
        <GameProvider api={api}>{children}</GameProvider>
    );
    return renderHook(() => ({ state: useGameState(), actions: useGameActions() }), { wrapper });
}

const network = () => new ApiError('Network error', { retryable: true });

async function started(api: FakeDragonsApi) {
    const hook = setup(api);
    await act(async () => {
        await hook.result.current.actions.startGame();
    });
    return hook;
}

describe('startGame', () => {
    it('loads the session, the board and the shop', async () => {
        const { result } = await started(new FakeDragonsApi());
        expect(result.current.state.phase).toBe('playing');
        expect(result.current.state.session?.gameId).toBe('fake-game');
        expect(result.current.state.ads).toHaveLength(3);
        expect(result.current.state.shop).toHaveLength(11);
        expect(result.current.actions.isPending).toBe(false);
    });

    it('shows a retryable error when the server cannot be reached, then recovers', async () => {
        const api = new FakeDragonsApi();
        api.failNext('startGame', network());
        const hook = setup(api);
        await act(async () => {
            await hook.result.current.actions.startGame();
        });
        expect(hook.result.current.state.phase).toBe('idle');
        expect(hook.result.current.state.error).toMatchObject({
            message: 'Could not reach the game server. Check your connection and try again.',
            retry: { kind: 'start' },
        });
        await act(async () => {
            await hook.result.current.actions.retry();
        });
        expect(hook.result.current.state.phase).toBe('playing');
        expect(hook.result.current.state.error).toBeNull();
    });
});

describe('solveAd', () => {
    it('updates the session and loads the next board', async () => {
        const hook = await started(new FakeDragonsApi());
        await act(async () => {
            await hook.result.current.actions.solveAd('a0-1');
        });
        const { state } = hook.result.current;
        expect(state.session).toMatchObject({ score: 60, gold: 60, turn: 1 });
        expect(state.ads[0]?.adId).toBe('a1-1');
        expect(state.boardStatus).toBe('ready');
        expect(state.lastResult?.success).toBe(true);
    });

    it('costs a life when the attempt fails', async () => {
        const hook = await started(new FakeDragonsApi({ solveSucceeds: () => false }));
        await act(async () => {
            await hook.result.current.actions.solveAd('a0-1');
        });
        expect(hook.result.current.state.session?.lives).toBe(2);
        expect(hook.result.current.state.lastResult?.success).toBe(false);
    });

    it('finishes the game without reloading the board when the last life is lost', async () => {
        const api = new FakeDragonsApi({ lives: 1, solveSucceeds: () => false });
        const hook = await started(api);
        const messagesBefore = api.calls.filter((call) => call === 'getMessages').length;
        await act(async () => {
            await hook.result.current.actions.solveAd('a0-1');
        });
        expect(hook.result.current.state.phase).toBe('finished');
        expect(api.calls.filter((call) => call === 'getMessages')).toHaveLength(messagesBefore);
    });

    it('marks an ad the API rejects with 400 as unavailable and reloads the board', async () => {
        const api = new FakeDragonsApi();
        const hook = await started(api);
        await act(async () => {
            await hook.result.current.actions.solveAd('does-not-exist');
        });
        expect(hook.result.current.state.unavailableAdIds).toEqual(['does-not-exist']);
        expect(hook.result.current.state.error).toBeNull();
        expect(hook.result.current.state.boardStatus).toBe('ready');
    });

    it('offers a retry after a network failure and repeats the same solve', async () => {
        const api = new FakeDragonsApi();
        const hook = await started(api);
        api.failNext('solve', network());
        await act(async () => {
            await hook.result.current.actions.solveAd('a0-1');
        });
        expect(hook.result.current.state.error?.retry).toEqual({ kind: 'solve', adId: 'a0-1' });
        await act(async () => {
            await hook.result.current.actions.retry();
        });
        expect(hook.result.current.state.session?.score).toBe(60);
        expect(hook.result.current.state.error).toBeNull();
    });

    it('reports an expired game without a retry', async () => {
        const api = new FakeDragonsApi();
        const hook = await started(api);
        api.failNext('solve', new ApiError('gone', { status: 404, retryable: false }));
        await act(async () => {
            await hook.result.current.actions.solveAd('a0-1');
        });
        expect(hook.result.current.state.error).toMatchObject({
            message: 'This game has expired. Start a new one.',
            retry: null,
            expired: true,
        });
    });

    it('does nothing before a game has started', async () => {
        const api = new FakeDragonsApi();
        const hook = setup(api);
        await act(async () => {
            await hook.result.current.actions.solveAd('a0-1');
        });
        expect(api.calls).toEqual([]);
    });
});

describe('buyItem', () => {
    it('buys a potion, adds a life and reloads the board and the shop', async () => {
        const api = new FakeDragonsApi({ gold: 100 });
        const hook = await started(api);
        await act(async () => {
            await hook.result.current.actions.buyItem('hpot');
        });
        const { state } = hook.result.current;
        expect(state.session).toMatchObject({ lives: 4, gold: 50, turn: 1 });
        expect(state.purchases).toEqual({ hpot: 1 });
        expect(api.calls.filter((call) => call === 'getShop')).toHaveLength(2);
    });

    it('records a refused purchase without counting it', async () => {
        const hook = await started(new FakeDragonsApi({ gold: 10 }));
        await act(async () => {
            await hook.result.current.actions.buyItem('hpot');
        });
        expect(hook.result.current.state.purchases).toEqual({});
        expect(hook.result.current.state.lastResult?.success).toBe(false);
    });
});

describe('refresh failures and ending', () => {
    it('retries a failed board reload', async () => {
        const api = new FakeDragonsApi();
        const hook = await started(api);
        api.failNext('getMessages', network());
        await act(async () => {
            await hook.result.current.actions.solveAd('a0-1');
        });
        expect(hook.result.current.state.session?.score).toBe(60);
        expect(hook.result.current.state.error?.retry).toEqual({
            kind: 'refresh',
            includeShop: false,
        });
        expect(hook.result.current.state.boardStatus).toBe('error');
        await act(async () => {
            await hook.result.current.actions.retry();
        });
        expect(hook.result.current.state.boardStatus).toBe('ready');
        expect(hook.result.current.state.error).toBeNull();
    });

    it('ends the game, dismisses errors and starts over', async () => {
        const hook = await started(new FakeDragonsApi());
        act(() => hook.result.current.actions.endGame());
        expect(hook.result.current.state.phase).toBe('finished');
        act(() => hook.result.current.actions.playAgain());
        expect(hook.result.current.state.phase).toBe('idle');
    });
});
