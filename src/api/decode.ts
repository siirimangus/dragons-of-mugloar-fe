export type EncryptionKind = 1 | 2;

export class DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecodeError';
  }
}

const MAX_ECHO = 40;
const truncate = (value: string): string =>
  value.length > MAX_ECHO ? `${value.slice(0, MAX_ECHO)}...` : value;

const utf8 = new TextDecoder('utf-8', { fatal: true });

export function rot13(input: string): string {
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

/** Strict: canonical padded Base64 that decodes to valid UTF-8. */
export function decodeBase64(input: string): string {
  let binary: string;
  try {
    binary = atob(input);
  } catch {
    throw new DecodeError(`Not valid Base64: ${truncate(input)}`);
  }
  if (btoa(binary) !== input) {
    throw new DecodeError(`Not valid Base64: ${truncate(input)}`);
  }
  try {
    return utf8.decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  } catch {
    throw new DecodeError(`Base64 is not valid UTF-8: ${truncate(input)}`);
  }
}

export function decodeField(value: string, encrypted: EncryptionKind | null): string {
  switch (encrypted) {
    case null:
      return value;
    case 1:
      return decodeBase64(value);
    case 2:
      return rot13(value);
    default: {
      const unreachable: never = encrypted;
      throw new DecodeError(`Unsupported encryption kind: ${String(unreachable)}`);
    }
  }
}
