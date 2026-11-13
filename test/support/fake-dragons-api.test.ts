import { describe, expect, it } from 'vitest';
import { FakeDragonsApi } from './fake-dragons-api';

describe('FakeDragonsApi holds', () => {
  it('releaseAll lets every held call through, and releasing twice is harmless', async () => {
    const api = new FakeDragonsApi();
    const release = api.hold('startGame');
    let finished = false;
    const pending = api.startGame().then(() => (finished = true));
    await Promise.resolve();
    expect(finished).toBe(false);

    api.releaseAll();
    await pending;
    expect(finished).toBe(true);

    release();
    api.releaseAll();
    await expect(api.startGame()).resolves.toMatchObject({ gameId: 'fake-game' });
  });
});
