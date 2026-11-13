export class ApiError extends Error {
  readonly status: number | undefined;
  readonly retryable: boolean;

  constructor(message: string, options: { retryable: boolean; status?: number; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.status = options.status;
    this.retryable = options.retryable;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** The API answers 404 for a game it no longer knows. */
export function isExpiredGame(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** A short message that is safe to show to a player. Never includes raw server text. */
export function friendlyMessage(error: unknown): string {
  if (isExpiredGame(error)) return 'This game has expired. Start a new one.';
  if (error instanceof ApiError) {
    return error.status === undefined
      ? 'Could not reach the game server. Check your connection and try again.'
      : `The game server refused that request (status ${error.status}).`;
  }
  if (error instanceof ValidationError) {
    return 'The game server sent an unexpected response. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
