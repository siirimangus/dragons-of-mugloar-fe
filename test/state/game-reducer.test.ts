import { describe, expect, it } from 'vitest';
import type { PurchaseResult, SolveResult } from '../../src/domain/types';
import { gameReducer, initialState, type GameState } from '../../src/state/game-reducer';
import { makeAd, makeSession, SHOP } from '../support/builders';

const ads = [
    makeAd({ adId: 'a1', message: 'Help Ann' }),
    makeAd({ adId: 'a2', message: 'Help Bob' }),
];
const hpot = SHOP[0]!;
const cs = SHOP[1]!;

function started(overrides: Partial<GameState> = {}): GameState {
    const state = gameReducer(initialState, {
        type: 'gameStarted',
        session: makeSession({ gold: 200 }),
        ads,
        shop: SHOP,
    });
    return { ...state, ...overrides };
}

const solveResult = (overrides: Partial<SolveResult> = {}): SolveResult => ({
    success: true,
    lives: 3,
    gold: 250,
    score: 50,
    highScore: 0,
    turn: 1,
    message: 'You successfully solved the mission!',
    ...overrides,
});

const purchaseResult = (overrides: Partial<PurchaseResult> = {}): PurchaseResult => ({
    shoppingSuccess: true,
    gold: 150,
    lives: 4,
    level: 0,
    turn: 1,
    ...overrides,
});

describe('gameStarted', () => {
    it('moves to playing with the session, board and shop', () => {
        const state = started();
        expect(state.phase).toBe('playing');
        expect(state.session?.gold).toBe(200);
        expect(state.ads).toEqual(ads);
        expect(state.shop).toEqual(SHOP);
        expect(state.boardStatus).toBe('ready');
        expect(state.purchases).toEqual({});
        expect(state.log).toEqual([]);
        expect(state.error).toBeNull();
    });

    it('resets everything from a previous game', () => {
        const dirty = { ...started(), purchases: { cs: 2 }, unavailableAdIds: ['x'] };
        const fresh = gameReducer(dirty, {
            type: 'gameStarted',
            session: makeSession(),
            ads,
            shop: SHOP,
        });
        expect(fresh.purchases).toEqual({});
        expect(fresh.unavailableAdIds).toEqual([]);
        expect(fresh.stats).toEqual({ solved: 0, failed: 0, goldSpent: 0, itemsBought: 0 });
    });
});

describe('solved', () => {
    it('folds the result into the session and counts a success', () => {
        const state = gameReducer(started(), { type: 'solved', adId: 'a1', result: solveResult() });
        expect(state.session).toMatchObject({
            gameId: 'g1',
            gold: 250,
            score: 50,
            turn: 1,
            lives: 3,
        });
        expect(state.stats.solved).toBe(1);
        expect(state.lastResult).toEqual({
            text: 'You successfully solved the mission!',
            success: true,
        });
        expect(state.log[0]).toMatchObject({ turn: 1, success: true });
        expect(state.log[0]?.text).toContain('Help Ann');
        expect(state.boardStatus).toBe('loading');
        expect(state.phase).toBe('playing');
    });

    it('counts a failure and clears the unavailable ads', () => {
        const before = started({ unavailableAdIds: ['a2'] });
        const state = gameReducer(before, {
            type: 'solved',
            adId: 'a1',
            result: solveResult({
                success: false,
                lives: 2,
                message: 'You failed on the mission!',
            }),
        });
        expect(state.stats.failed).toBe(1);
        expect(state.session?.lives).toBe(2);
        expect(state.unavailableAdIds).toEqual([]);
        expect(state.lastResult?.success).toBe(false);
    });

    it('finishes the game when the last life is lost', () => {
        const state = gameReducer(started(), {
            type: 'solved',
            adId: 'a1',
            result: solveResult({ success: false, lives: 0 }),
        });
        expect(state.phase).toBe('finished');
    });

    it('keeps the board status when the solve ends the game, and reloads it otherwise', () => {
        const lost = gameReducer(started(), {
            type: 'solved',
            adId: 'a1',
            result: solveResult({ success: false, lives: 0 }),
        });
        expect(lost.phase).toBe('finished');
        expect(lost.boardStatus).toBe('ready');
        const alive = gameReducer(started(), {
            type: 'solved',
            adId: 'a1',
            result: solveResult({ lives: 1 }),
        });
        expect(alive.boardStatus).toBe('loading');
    });

    it('does not mutate the previous state', () => {
        const before = started();
        const snapshot = JSON.stringify(before);
        gameReducer(before, { type: 'solved', adId: 'a1', result: solveResult() });
        expect(JSON.stringify(before)).toBe(snapshot);
    });

    it('ignores a result when there is no session', () => {
        expect(
            gameReducer(initialState, { type: 'solved', adId: 'a1', result: solveResult() }),
        ).toBe(initialState);
    });
});

describe('purchased', () => {
    it('records a successful purchase', () => {
        const state = gameReducer(started(), {
            type: 'purchased',
            item: cs,
            result: purchaseResult({ lives: 3, level: 1, gold: 100 }),
        });
        expect(state.session).toMatchObject({ gold: 100, level: 1, turn: 1 });
        expect(state.purchases).toEqual({ cs: 1 });
        expect(state.stats).toMatchObject({ goldSpent: 100, itemsBought: 1 });
        expect(state.lastResult).toEqual({ text: 'You bought Claw Sharpening.', success: true });
        expect(state.boardStatus).toBe('loading');
    });

    it('counts repeated purchases of the same item', () => {
        let state = started();
        state = gameReducer(state, { type: 'purchased', item: hpot, result: purchaseResult() });
        state = gameReducer(state, {
            type: 'purchased',
            item: hpot,
            result: purchaseResult({ turn: 2 }),
        });
        expect(state.purchases).toEqual({ hpot: 2 });
        expect(state.stats).toMatchObject({ goldSpent: 100, itemsBought: 2 });
    });

    it('records a refused purchase without counting it', () => {
        const state = gameReducer(started(), {
            type: 'purchased',
            item: cs,
            result: purchaseResult({ shoppingSuccess: false, gold: 200, lives: 3 }),
        });
        expect(state.purchases).toEqual({});
        expect(state.stats.itemsBought).toBe(0);
        expect(state.lastResult).toEqual({
            text: 'The shop would not sell you Claw Sharpening.',
            success: false,
        });
        expect(state.session?.turn).toBe(1);
    });
});

describe('board and errors', () => {
    it('loads a new board and optionally a new shop', () => {
        const newAds = [makeAd({ adId: 'n1' })];
        const loading = gameReducer(started(), { type: 'boardLoading' });
        expect(loading.boardStatus).toBe('loading');
        const loaded = gameReducer(loading, { type: 'boardLoaded', ads: newAds });
        expect(loaded.ads).toEqual(newAds);
        expect(loaded.shop).toEqual(SHOP);
        expect(loaded.boardStatus).toBe('ready');
        const withShop = gameReducer(loaded, { type: 'boardLoaded', ads: newAds, shop: [hpot] });
        expect(withShop.shop).toEqual([hpot]);
    });

    it('marks an ad unavailable once and logs it', () => {
        let state = gameReducer(started(), { type: 'adRejected', adId: 'a1' });
        state = gameReducer(state, { type: 'adRejected', adId: 'a1' });
        expect(state.unavailableAdIds).toEqual(['a1']);
        const text =
            'That message could not be solved (it may have expired or already been taken).';
        expect(state.lastResult).toMatchObject({ success: false, text });
        expect(state.log[0]).toMatchObject({ success: false, text });
    });

    it('stores a failure, moves a loading board to error, and can be dismissed', () => {
        const loading = gameReducer(started(), { type: 'boardLoading' });
        const failed = gameReducer(loading, {
            type: 'failed',
            message: 'Could not reach the game server.',
            retry: { kind: 'refresh', includeShop: false },
            expired: false,
        });
        expect(failed.error).toEqual({
            message: 'Could not reach the game server.',
            retry: { kind: 'refresh', includeShop: false },
            expired: false,
        });
        expect(failed.boardStatus).toBe('error');
        expect(gameReducer(failed, { type: 'errorDismissed' }).error).toBeNull();
    });

    it('keeps the board status when a failure happens outside a board load', () => {
        const failed = gameReducer(started(), {
            type: 'failed',
            message: 'x',
            retry: null,
            expired: false,
        });
        expect(failed.boardStatus).toBe('ready');
    });
});

describe('ending', () => {
    it('ends a playing game and ignores gameEnded otherwise', () => {
        expect(gameReducer(started(), { type: 'gameEnded' }).phase).toBe('finished');
        expect(gameReducer(initialState, { type: 'gameEnded' })).toBe(initialState);
    });

    it('resets to the initial state', () => {
        expect(gameReducer(started(), { type: 'reset' })).toEqual(initialState);
    });

    it('keeps only the most recent log entries', () => {
        let state = started();
        for (let turn = 1; turn <= 40; turn++) {
            state = gameReducer(state, {
                type: 'solved',
                adId: 'a1',
                result: solveResult({ turn }),
            });
        }
        expect(state.log).toHaveLength(30);
        expect(state.log[0]?.turn).toBe(40);
    });
});
