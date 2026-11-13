import type { Dispatch } from 'react';
import type { DragonsApi } from '../api/dragons-api';
import { ApiError, friendlyMessage, isExpiredGame } from '../api/errors';
import type { GameActions } from './game-context';
import type { GameAction, GameState, RetryAction } from './game-reducer';

export type ActionDeps = {
    readonly api: DragonsApi;
    readonly state: GameState;
    readonly dispatch: Dispatch<GameAction>;
    /** Runs an async task inside a React transition and resolves when it is done. */
    readonly run: (task: () => Promise<void>) => Promise<void>;
    readonly isPending: boolean;
};

export function createGameActions({
    api,
    state,
    dispatch,
    run,
    isPending,
}: ActionDeps): GameActions {
    const failure = (error: unknown, retry: RetryAction | null): GameAction => ({
        type: 'failed',
        message: friendlyMessage(error),
        retry: isExpiredGame(error) ? null : retry,
        expired: isExpiredGame(error),
    });

    async function refreshBoard(gameId: string, includeShop: boolean): Promise<void> {
        dispatch({ type: 'boardLoading' });
        try {
            const [ads, shop] = await Promise.all([
                api.getMessages(gameId),
                includeShop ? api.getShop(gameId) : Promise.resolve(undefined),
            ]);
            dispatch({ type: 'boardLoaded', ads, shop });
        } catch (error) {
            dispatch(failure(error, { kind: 'refresh', includeShop }));
        }
    }

    function startGame(): Promise<void> {
        return run(async () => {
            try {
                const session = await api.startGame();
                const [ads, shop] = await Promise.all([
                    api.getMessages(session.gameId),
                    api.getShop(session.gameId),
                ]);
                dispatch({ type: 'gameStarted', session, ads, shop });
            } catch (error) {
                dispatch(failure(error, { kind: 'start' }));
            }
        });
    }

    function solveAd(adId: string): Promise<void> {
        const gameId = state.session?.gameId;
        if (!gameId) return Promise.resolve();
        return run(async () => {
            try {
                const result = await api.solve(gameId, adId);
                dispatch({ type: 'solved', adId, result });
                if (result.lives > 0) await refreshBoard(gameId, false);
            } catch (error) {
                if (error instanceof ApiError && error.status === 400) {
                    dispatch({ type: 'adRejected', adId });
                    await refreshBoard(gameId, false);
                    return;
                }
                dispatch(failure(error, { kind: 'solve', adId }));
            }
        });
    }

    function buyItem(itemId: string): Promise<void> {
        const gameId = state.session?.gameId;
        const item = state.shop.find((candidate) => candidate.id === itemId);
        if (!gameId || !item) return Promise.resolve();
        return run(async () => {
            try {
                const result = await api.buy(gameId, itemId);
                dispatch({ type: 'purchased', item, result });
                await refreshBoard(gameId, true);
            } catch (error) {
                dispatch(failure(error, { kind: 'buy', itemId }));
            }
        });
    }

    function retry(): Promise<void> {
        const action = state.error?.retry;
        if (!action) return Promise.resolve();
        dispatch({ type: 'errorDismissed' });
        switch (action.kind) {
            case 'start':
                return startGame();
            case 'solve':
                return solveAd(action.adId);
            case 'buy':
                return buyItem(action.itemId);
            case 'refresh': {
                const gameId = state.session?.gameId;
                return gameId
                    ? run(() => refreshBoard(gameId, action.includeShop))
                    : Promise.resolve();
            }
        }
    }

    return {
        isPending,
        startGame,
        solveAd,
        buyItem,
        retry,
        endGame: () => dispatch({ type: 'gameEnded' }),
        playAgain: () => dispatch({ type: 'reset' }),
        dismissError: () => dispatch({ type: 'errorDismissed' }),
    };
}
