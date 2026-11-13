import { describe, expect, it } from 'vitest';
import { DecodeError, decodeBase64, decodeField, rot13 } from '../../src/api/decode';

const encode64 = (text: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)));

describe('rot13', () => {
  it('decodes a known label', () => {
    expect(rot13('Vzcbffvoyr')).toBe('Impossible');
  });

  it('is its own inverse and leaves non-letters alone', () => {
    const text = 'Help Trudy Badcock to fix their house 42!';
    expect(rot13(rot13(text))).toBe(text);
    expect(rot13('Hmmm....')).toBe('Uzzz....');
  });

  it('handles the empty string and the alphabet wrap', () => {
    expect(rot13('')).toBe('');
    expect(rot13('Z')).toBe('M');
    expect(rot13('z')).toBe('m');
  });
});

describe('decodeBase64', () => {
  it.each([
    ['U3VpY2lkZSBtaXNzaW9u', 'Suicide mission'],
    ['Umlza3k=', 'Risky'],
    ['R2FtYmxl', 'Gamble'],
    ['SG1tbS4uLi4=', 'Hmmm....'],
  ])('decodes %s', (input, expected) => {
    expect(decodeBase64(input)).toBe(expected);
  });

  it('round-trips non-ASCII text', () => {
    expect(decodeBase64(encode64('Krešimira Woodcock'))).toBe('Krešimira Woodcock');
  });

  it('accepts the empty string', () => {
    expect(decodeBase64('')).toBe('');
  });

  it.each([['not base64!'], ['Umlza3k'], ['Umlza3k===='], ['Uml za3k='], ['Umlz-3k='], ['/w==']])(
    'rejects %j',
    (input) => {
      expect(() => decodeBase64(input)).toThrow(DecodeError);
    },
  );

  it('truncates long input in the error message', () => {
    const long = '!'.repeat(200);
    expect(() => decodeBase64(long)).toThrow(/\.\.\.$/);
  });
});

describe('decodeField', () => {
  it('passes plain values through', () => {
    expect(decodeField('Sure thing', null)).toBe('Sure thing');
  });

  it('treats encrypted=1 as Base64 and encrypted=2 as ROT13', () => {
    expect(decodeField('Umlza3k=', 1)).toBe('Risky');
    expect(decodeField('Vzcbffvoyr', 2)).toBe('Impossible');
  });

  it('rejects an unsupported kind', () => {
    expect(() => decodeField('x', 3 as never)).toThrow(DecodeError);
  });
});
