import { describe, expect, it } from 'vitest';
import { ApiError, friendlyMessage, isExpiredGame, ValidationError } from '../../src/api/errors';

describe('ApiError', () => {
  it('carries the status, retryable flag and cause', () => {
    const cause = new Error('boom');
    const error = new ApiError('failed', { retryable: true, status: 503, cause });
    expect(error.status).toBe(503);
    expect(error.retryable).toBe(true);
    expect(error.cause).toBe(cause);
    expect(error.name).toBe('ApiError');
  });
});

describe('isExpiredGame', () => {
  it('is true only for a 404 ApiError', () => {
    expect(isExpiredGame(new ApiError('gone', { retryable: false, status: 404 }))).toBe(true);
    expect(isExpiredGame(new ApiError('bad', { retryable: false, status: 400 }))).toBe(false);
    expect(isExpiredGame(new Error('x'))).toBe(false);
  });
});

describe('friendlyMessage', () => {
  it('explains an expired game', () => {
    expect(friendlyMessage(new ApiError('gone', { retryable: false, status: 404 }))).toBe(
      'This game has expired. Start a new one.',
    );
  });

  it('explains a network problem', () => {
    expect(friendlyMessage(new ApiError('net', { retryable: true }))).toBe(
      'Could not reach the game server. Check your connection and try again.',
    );
  });

  it('explains a refused request', () => {
    expect(friendlyMessage(new ApiError('bad', { retryable: false, status: 400 }))).toBe(
      'The game server refused that request (status 400).',
    );
  });

  it('explains an unexpected response', () => {
    expect(friendlyMessage(new ValidationError('shape'))).toBe(
      'The game server sent an unexpected response. Please try again.',
    );
  });

  it('has a fallback for anything else and never leaks the raw message', () => {
    expect(friendlyMessage(new Error('<html>secret</html>'))).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
