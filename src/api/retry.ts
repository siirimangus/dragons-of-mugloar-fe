import { ApiError } from './errors';

export type RetryOptions = {
  readonly attempts: number;
  readonly baseDelayMs: number;
  readonly sleep: (ms: number) => Promise<void>;
};

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const retryable = error instanceof ApiError && error.retryable;
      if (!retryable || attempt >= options.attempts) throw error;
      await options.sleep(options.baseDelayMs * 2 ** (attempt - 1));
    }
  }
}
