import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/api/errors';
import {
    parseMessages,
    parsePurchaseResult,
    parseShop,
    parseSolveResult,
    parseStartGame,
} from '../../src/api/schemas';
import { loadFixture } from '../support/fixtures';

describe('parseStartGame', () => {
    it('parses a real response', () => {
        const session = parseStartGame(loadFixture('start-game.json'));
        expect(session.lives).toBe(3);
        expect(typeof session.gameId).toBe('string');
        expect(session.turn).toBe(0);
    });

    it('rejects a missing gameId and a non-numeric field', () => {
        expect(() =>
            parseStartGame({ lives: 3, gold: 0, level: 0, score: 0, highScore: 0, turn: 0 }),
        ).toThrow(ValidationError);
        expect(() =>
            parseStartGame({
                gameId: 'a',
                lives: 'three',
                gold: 0,
                level: 0,
                score: 0,
                highScore: 0,
                turn: 0,
            }),
        ).toThrow(ValidationError);
    });
});

describe('parseMessages', () => {
    it('parses plain, Base64 and ROT13 ads', () => {
        for (const name of [
            'messages-plain.json',
            'messages-encrypted-1.json',
            'messages-encrypted-2.synthetic.json',
        ]) {
            const ads = parseMessages(loadFixture(name));
            expect(ads.length).toBeGreaterThan(0);
            for (const ad of ads) expect(typeof ad.reward).toBe('number');
        }
    });

    it('reports the encryption kind of each fixture', () => {
        expect(
            parseMessages(loadFixture('messages-plain.json')).every((ad) => ad.encrypted === null),
        ).toBe(true);
        expect(
            parseMessages(loadFixture('messages-encrypted-1.json')).every(
                (ad) => ad.encrypted === 1,
            ),
        ).toBe(true);
        expect(
            parseMessages(loadFixture('messages-encrypted-2.synthetic.json')).every(
                (ad) => ad.encrypted === 2,
            ),
        ).toBe(true);
    });

    it('accepts a reward given as a numeric string and a missing encrypted field', () => {
        const ads = parseMessages([
            { adId: 'a', message: 'm', reward: '12', expiresIn: 3, probability: 'Sure thing' },
        ]);
        expect(ads[0]?.reward).toBe(12);
        expect(ads[0]?.encrypted).toBeNull();
    });

    it.each([
        [
            'unknown encrypted value',
            [{ adId: 'a', message: 'm', reward: 1, expiresIn: 3, encrypted: 3, probability: 'x' }],
        ],
        [
            'negative reward',
            [
                {
                    adId: 'a',
                    message: 'm',
                    reward: -3,
                    expiresIn: 3,
                    encrypted: null,
                    probability: 'x',
                },
            ],
        ],
        [
            'fractional reward',
            [
                {
                    adId: 'a',
                    message: 'm',
                    reward: 1.5,
                    expiresIn: 3,
                    encrypted: null,
                    probability: 'x',
                },
            ],
        ],
        ['not an array', { ads: [] }],
        ['null body', null],
    ])('rejects %s', (_name, body) => {
        expect(() => parseMessages(body)).toThrow(ValidationError);
    });

    it('strips unknown fields and accepts an empty list', () => {
        const ads = parseMessages([
            {
                adId: 'a',
                message: 'm',
                reward: 1,
                expiresIn: 3,
                encrypted: null,
                probability: 'x',
                extra: true,
            },
        ]);
        expect(ads[0]).not.toHaveProperty('extra');
        expect(parseMessages([])).toEqual([]);
    });
});

describe('parseShop', () => {
    it('parses a real response', () => {
        const items = parseShop(loadFixture('shop.json'));
        expect(items.some((item) => item.id === 'hpot' && item.cost === 50)).toBe(true);
    });

    it('rejects an item without a cost', () => {
        expect(() => parseShop([{ id: 'x', name: 'X' }])).toThrow(ValidationError);
    });
});

describe('parseSolveResult', () => {
    it('parses a real response', () => {
        const result = parseSolveResult(loadFixture('solve-result.json'));
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.message).toBe('string');
    });

    it('rejects a missing success flag and accepts negative numbers', () => {
        expect(() =>
            parseSolveResult({ lives: 3, gold: 0, score: 0, highScore: 0, turn: 1, message: 'x' }),
        ).toThrow(ValidationError);
        expect(
            parseSolveResult({
                success: false,
                lives: -1,
                gold: 0,
                score: 0,
                highScore: 0,
                turn: 1,
                message: 'x',
            }).lives,
        ).toBe(-1);
    });
});

describe('parsePurchaseResult', () => {
    it('parses a real response and accepts shoppingSuccess as a string', () => {
        expect(parsePurchaseResult(loadFixture('purchase-result.json'))).toEqual({
            shoppingSuccess: true,
            gold: 229,
            lives: 3,
            level: 0,
            turn: 11,
        });
        expect(
            parsePurchaseResult({ shoppingSuccess: 'false', gold: 1, lives: 1, level: 0, turn: 2 })
                .shoppingSuccess,
        ).toBe(false);
    });
});
