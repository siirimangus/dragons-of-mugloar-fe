import { describe, expect, it } from 'vitest';
import { ApiError, ValidationError } from '../../src/api/errors';
import { withRetry } from '../../src/api/retry';

function setup(attempts = 3) {
  const delays: number[] = [];
  const options = {
    attempts,
    baseDelayMs: 100,
    sleep: async (ms: number) => {
      delays.push(ms);
    },
  };
  return { delays, options };
}

const transient = () => new ApiError('boom', { retryable: true, status: 503 });

describe('withRetry', () => {
  it('returns immediately on success', async () => {
    const { delays, options } = setup();
    await expect(withRetry(async () => 'ok', options)).resolves.toBe('ok');
    expect(delays).toEqual([]);
  });

  it('retries retryable errors with exponential backoff', async () => {
    const { delays, options } = setup();
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      if (calls < 3) throw transient();
      return 'ok';
    }, options);
    expect(result).toBe('ok');
    expect(delays).toEqual([100, 200]);
  });

  it('gives up after the configured attempts and rethrows the last error', async () => {
    const { delays, options } = setup(3);
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls += 1;
        throw transient();
      }, options),
    ).rejects.toThrow('boom');
    expect(calls).toBe(3);
    expect(delays).toEqual([100, 200]);
  });

  it('does not retry non-retryable API errors or validation errors', async () => {
    const { options } = setup();
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls += 1;
        throw new ApiError('not found', { retryable: false, status: 404 });
      }, options),
    ).rejects.toThrow('not found');
    await expect(
      withRetry(async () => {
        calls += 1;
        throw new ValidationError('bad shape');
      }, options),
    ).rejects.toThrow(ValidationError);
    expect(calls).toBe(2);
  });
});
