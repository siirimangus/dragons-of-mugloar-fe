import type { Ad, PurchaseResult, Session, ShopItem, SolveResult } from '../domain/types';
import { decodeAds } from './decode-ads';
import type { DragonsApi } from './dragons-api';
import { ApiError, ValidationError } from './errors';
import { type RetryOptions, withRetry } from './retry';
import {
    parseMessages,
    parsePurchaseResult,
    parseShop,
    parseSolveResult,
    parseStartGame,
} from './schemas';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export type HttpDragonsApiOptions = {
    readonly baseUrl: string;
    readonly timeoutMs: number;
    readonly retry: RetryOptions;
    readonly fetch?: FetchFn;
};

const segment = (value: string): string => encodeURIComponent(value);
const isRetryableStatus = (status: number): boolean =>
    status === 408 || status === 429 || status >= 500;

function describeNetworkFailure(error: unknown, timeoutMs: number): string {
    if ((error as { name?: unknown } | null)?.name === 'TimeoutError')
        return `timed out after ${timeoutMs}ms`;
    return error instanceof Error ? error.message : String(error);
}

export class HttpDragonsApi implements DragonsApi {
    private readonly baseUrl: string;
    private readonly timeoutMs: number;
    private readonly retry: RetryOptions;
    private readonly fetchFn: FetchFn;

    constructor(options: HttpDragonsApiOptions) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.timeoutMs = options.timeoutMs;
        this.retry = options.retry;
        this.fetchFn = options.fetch ?? ((input, init) => fetch(input, init));
    }

    startGame(): Promise<Session> {
        return this.request('POST', '/game/start', parseStartGame);
    }

    async getMessages(gameId: string): Promise<Ad[]> {
        const raws = await this.request('GET', `/${segment(gameId)}/messages`, parseMessages);
        return decodeAds(raws);
    }

    solve(gameId: string, adId: string): Promise<SolveResult> {
        return this.request('POST', `/${segment(gameId)}/solve/${segment(adId)}`, parseSolveResult);
    }

    getShop(gameId: string): Promise<ShopItem[]> {
        return this.request('GET', `/${segment(gameId)}/shop`, parseShop);
    }

    buy(gameId: string, itemId: string): Promise<PurchaseResult> {
        return this.request(
            'POST',
            `/${segment(gameId)}/shop/buy/${segment(itemId)}`,
            parsePurchaseResult,
        );
    }

    // solve and buy are retried after network errors and 5xx too: a lost response may therefore be
    // applied twice (a repeated solve gets a 400 and is treated as unavailable; a repeated buy may
    // cost one extra purchase). Accepted: the game API has no idempotency keys.
    private request<T>(
        method: 'GET' | 'POST',
        path: string,
        parse: (body: unknown) => T,
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        return withRetry(async () => {
            let response: Response;
            try {
                response = await this.fetchFn(url, {
                    method,
                    headers: { accept: 'application/json' },
                    signal: AbortSignal.timeout(this.timeoutMs),
                });
            } catch (cause) {
                throw new ApiError(
                    `${method} ${path} failed: network error (${describeNetworkFailure(cause, this.timeoutMs)})`,
                    { retryable: true, cause },
                );
            }
            if (!response.ok) {
                await response.body?.cancel().catch(() => undefined);
                throw new ApiError(`${method} ${path} failed with status ${response.status}`, {
                    status: response.status,
                    retryable: isRetryableStatus(response.status),
                });
            }
            let body: unknown;
            try {
                body = await response.json();
            } catch {
                throw new ValidationError(`${method} ${path} returned invalid JSON`);
            }
            return parse(body);
        }, this.retry);
    }
}
