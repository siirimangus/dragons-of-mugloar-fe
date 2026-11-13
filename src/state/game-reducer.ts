import type { Ad, PurchaseResult, Session, ShopItem, SolveResult } from '../domain/types';

export type Phase = 'idle' | 'playing' | 'finished';
export type BoardStatus = 'idle' | 'loading' | 'ready' | 'error';

export type RetryAction =
    | { readonly kind: 'start' }
    | { readonly kind: 'solve'; readonly adId: string }
    | { readonly kind: 'buy'; readonly itemId: string }
    | { readonly kind: 'refresh'; readonly includeShop: boolean };

export type GameError = {
    readonly message: string;
    readonly retry: RetryAction | null;
    /** The server no longer knows this game. */
    readonly expired: boolean;
};

export type LogEntry = {
    readonly id: number;
    readonly turn: number;
    readonly success: boolean;
    readonly text: string;
};

export type Stats = {
    readonly solved: number;
    readonly failed: number;
    readonly goldSpent: number;
    readonly itemsBought: number;
};

export type LastResult = { readonly text: string; readonly success: boolean };

export type GameState = {
    readonly phase: Phase;
    readonly session: Session | null;
    readonly ads: readonly Ad[];
    readonly shop: readonly ShopItem[];
    readonly boardStatus: BoardStatus;
    readonly purchases: Readonly<Record<string, number>>;
    readonly unavailableAdIds: readonly string[];
    readonly lastResult: LastResult | null;
    readonly log: readonly LogEntry[];
    readonly nextLogId: number;
    readonly stats: Stats;
    readonly error: GameError | null;
};

export type GameAction =
    | { type: 'gameStarted'; session: Session; ads: readonly Ad[]; shop: readonly ShopItem[] }
    | { type: 'solved'; adId: string; result: SolveResult }
    | { type: 'purchased'; item: ShopItem; result: PurchaseResult }
    | { type: 'boardLoading' }
    | { type: 'boardLoaded'; ads: readonly Ad[]; shop?: readonly ShopItem[] }
    | { type: 'adRejected'; adId: string }
    | { type: 'failed'; message: string; retry: RetryAction | null; expired: boolean }
    | { type: 'errorDismissed' }
    | { type: 'gameEnded' }
    | { type: 'reset' };

const EMPTY_STATS: Stats = { solved: 0, failed: 0, goldSpent: 0, itemsBought: 0 };

export const initialState: GameState = {
    phase: 'idle',
    session: null,
    ads: [],
    shop: [],
    boardStatus: 'idle',
    purchases: {},
    unavailableAdIds: [],
    lastResult: null,
    log: [],
    nextLogId: 1,
    stats: EMPTY_STATS,
    error: null,
};

function logged(
    state: GameState,
    turn: number,
    success: boolean,
    text: string,
): Pick<GameState, 'log' | 'nextLogId'> {
    const entry: LogEntry = { id: state.nextLogId, turn, success, text };
    return { log: [entry, ...state.log], nextLogId: state.nextLogId + 1 };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'gameStarted':
            return {
                ...initialState,
                phase: 'playing',
                session: action.session,
                ads: action.ads,
                shop: action.shop,
                boardStatus: 'ready',
            };

        case 'solved': {
            if (!state.session) return state;
            const { result } = action;
            const ad = state.ads.find((candidate) => candidate.adId === action.adId);
            const text = `${result.success ? 'Solved' : 'Failed'}: ${ad?.message ?? 'a message'}`;
            return {
                ...state,
                ...logged(state, result.turn, result.success, text),
                session: {
                    ...state.session,
                    lives: result.lives,
                    gold: result.gold,
                    score: result.score,
                    highScore: result.highScore,
                    turn: result.turn,
                },
                phase: result.lives <= 0 ? 'finished' : state.phase,
                boardStatus: result.lives <= 0 ? state.boardStatus : 'loading',
                unavailableAdIds: [],
                lastResult: { text: result.message, success: result.success },
                stats: {
                    ...state.stats,
                    solved: state.stats.solved + (result.success ? 1 : 0),
                    failed: state.stats.failed + (result.success ? 0 : 1),
                },
                error: null,
            };
        }

        case 'purchased': {
            if (!state.session) return state;
            const { item, result } = action;
            const ok = result.shoppingSuccess;
            const text = ok
                ? `You bought ${item.name}.`
                : `The shop would not sell you ${item.name}.`;
            return {
                ...state,
                ...logged(
                    state,
                    result.turn,
                    ok,
                    ok ? `Bought ${item.name}` : `Could not buy ${item.name}`,
                ),
                session: {
                    ...state.session,
                    lives: result.lives,
                    gold: result.gold,
                    level: result.level,
                    turn: result.turn,
                },
                boardStatus: 'loading',
                unavailableAdIds: [],
                purchases: ok
                    ? { ...state.purchases, [item.id]: (state.purchases[item.id] ?? 0) + 1 }
                    : state.purchases,
                lastResult: { text, success: ok },
                stats: ok
                    ? {
                          ...state.stats,
                          goldSpent: state.stats.goldSpent + item.cost,
                          itemsBought: state.stats.itemsBought + 1,
                      }
                    : state.stats,
                error: null,
            };
        }

        case 'boardLoading':
            return { ...state, boardStatus: 'loading' };

        case 'boardLoaded':
            return {
                ...state,
                ads: action.ads,
                shop: action.shop ?? state.shop,
                boardStatus: 'ready',
                error: null,
            };

        case 'adRejected': {
            if (state.unavailableAdIds.includes(action.adId)) return state;
            const text =
                'That message could not be solved (it may have expired or already been taken).';
            return {
                ...state,
                ...logged(state, state.session?.turn ?? 0, false, text),
                unavailableAdIds: [...state.unavailableAdIds, action.adId],
                lastResult: { text, success: false },
            };
        }

        case 'failed':
            return {
                ...state,
                error: { message: action.message, retry: action.retry, expired: action.expired },
                boardStatus: state.boardStatus === 'loading' ? 'error' : state.boardStatus,
            };

        case 'errorDismissed':
            return { ...state, error: null };

        case 'gameEnded':
            return state.phase === 'playing' ? { ...state, phase: 'finished' } : state;

        case 'reset':
            return initialState;
    }
}
