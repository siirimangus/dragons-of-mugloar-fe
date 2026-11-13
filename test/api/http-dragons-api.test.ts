import { describe, expect, it } from 'vitest';
import { ApiError, ValidationError } from '../../src/api/errors';
import { HttpDragonsApi, type FetchFn } from '../../src/api/http-dragons-api';
import { loadFixture } from '../support/fixtures';

type Call = { url: string; method: string };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function setup(
  handler: (call: Call, index: number, init: RequestInit) => Response | Promise<Response>,
  baseUrl = 'https://api.test/v2',
) {
  const calls: Call[] = [];
  const inits: RequestInit[] = [];
  const fetchFn: FetchFn = async (input, init) => {
    const call = { url: input, method: init?.method ?? 'GET' };
    calls.push(call);
    inits.push(init ?? {});
    return handler(call, calls.length - 1, init ?? {});
  };
  const api = new HttpDragonsApi({
    baseUrl,
    timeoutMs: 1000,
    retry: { attempts: 3, baseDelayMs: 0, sleep: async () => undefined },
    fetch: fetchFn,
  });
  return { api, calls, inits };
}

describe('HttpDragonsApi endpoints', () => {
  it('starts a game with POST /game/start', async () => {
    const { api, calls } = setup(() => json(loadFixture('start-game.json')));
    const session = await api.startGame();
    expect(calls).toEqual([{ url: 'https://api.test/v2/game/start', method: 'POST' }]);
    expect(session.lives).toBe(3);
  });

  it('fetches decoded messages with GET /:gameId/messages', async () => {
    const { api, calls } = setup(() => json(loadFixture('messages-encrypted-1.json')));
    const ads = await api.getMessages('abc');
    expect(calls).toEqual([{ url: 'https://api.test/v2/abc/messages', method: 'GET' }]);
    expect(ads.length).toBeGreaterThan(0);
    for (const ad of ads) expect(ad.adId).toMatch(/^[A-Za-z0-9]{8}$/);
  });

  it('drops ads that cannot be decoded', async () => {
    const { api } = setup(() =>
      json([
        {
          adId: 'ok',
          message: 'Help',
          reward: 5,
          expiresIn: 3,
          encrypted: null,
          probability: 'Gamble',
        },
        {
          adId: 'bad',
          message: 'not base64!',
          reward: 5,
          expiresIn: 3,
          encrypted: 1,
          probability: 'x',
        },
      ]),
    );
    expect((await api.getMessages('abc')).map((ad) => ad.adId)).toEqual(['ok']);
  });

  it('solves with POST /:gameId/solve/:adId', async () => {
    const { api, calls } = setup(() => json(loadFixture('solve-result.json')));
    await api.solve('abc', 'xyz');
    expect(calls).toEqual([{ url: 'https://api.test/v2/abc/solve/xyz', method: 'POST' }]);
  });

  it('fetches the shop and buys with POST /:gameId/shop/buy/:itemId', async () => {
    const shop = setup(() => json(loadFixture('shop.json')));
    expect((await shop.api.getShop('abc')).length).toBeGreaterThan(0);
    expect(shop.calls).toEqual([{ url: 'https://api.test/v2/abc/shop', method: 'GET' }]);

    const buy = setup(() => json(loadFixture('purchase-result.json')));
    expect((await buy.api.buy('abc', 'hpot')).shoppingSuccess).toBe(true);
    expect(buy.calls).toEqual([{ url: 'https://api.test/v2/abc/shop/buy/hpot', method: 'POST' }]);
  });

  it('strips trailing slashes from the base URL and encodes path segments', async () => {
    const { api, calls } = setup(
      () => json(loadFixture('solve-result.json')),
      'https://api.test/v2/',
    );
    await api.solve('a/b', 'c d');
    expect(calls[0]?.url).toBe('https://api.test/v2/a%2Fb/solve/c%20d');
  });

  it('sends an accept header and a fresh timeout signal per attempt', async () => {
    const { api, inits } = setup((_call, index) =>
      index === 0 ? json({}, 503) : json(loadFixture('start-game.json')),
    );
    await api.startGame();
    expect(inits).toHaveLength(2);
    expect(inits[0]?.headers).toMatchObject({ accept: 'application/json' });
    expect(inits[0]?.signal).toBeInstanceOf(AbortSignal);
    expect(inits[1]?.signal).not.toBe(inits[0]?.signal);
    expect(inits[1]?.signal?.aborted).toBe(false);
  });
});

describe('HttpDragonsApi errors', () => {
  it.each([503, 429, 408])('retries a %s response and then succeeds', async (status) => {
    const { api, calls } = setup((_call, index) =>
      index === 0 ? json({}, status) : json(loadFixture('start-game.json')),
    );
    await api.startGame();
    expect(calls).toHaveLength(2);
  });

  it('does not retry 4xx responses and exposes the status', async () => {
    const { api, calls } = setup(() => json({}, 404));
    const error = await api.solve('abc', 'xyz').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, retryable: false });
    expect(calls).toHaveLength(1);
  });

  it('retries network failures and then throws a retryable ApiError with the cause', async () => {
    const { api, calls } = setup(() => {
      throw new TypeError('Failed to fetch');
    });
    const error = await api.startGame().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ retryable: true });
    expect((error as ApiError).message).toContain('Failed to fetch');
    expect(calls).toHaveLength(3);
  });

  it('describes a timeout', async () => {
    const { api } = setup(() => {
      throw new DOMException('timed out', 'TimeoutError');
    });
    const error = await api.startGame().catch((e: unknown) => e);
    expect((error as ApiError).message).toContain('timed out after 1000ms');
  });

  it('throws ValidationError for invalid JSON, a wrong shape and a null body, without retrying', async () => {
    const html = setup(() => new Response('<html>oops</html>', { status: 200 }));
    await expect(html.api.startGame()).rejects.toThrow(ValidationError);
    expect(html.calls).toHaveLength(1);

    const shape = setup(() => json({ gameId: 'a' }));
    await expect(shape.api.startGame()).rejects.toThrow(ValidationError);

    const nothing = setup(() => json(null));
    await expect(nothing.api.startGame()).rejects.toThrow(ValidationError);
  });
});
