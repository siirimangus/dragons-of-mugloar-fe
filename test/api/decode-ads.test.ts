import { describe, expect, it } from 'vitest';
import { decodeAd, decodeAds } from '../../src/api/decode-ads';
import { parseMessages, type RawAd } from '../../src/api/schemas';
import { LABEL_PROBABILITY } from '../../src/domain/tuning';
import { loadFixture } from '../support/fixtures';

const raw = (overrides: Partial<RawAd> = {}): RawAd => ({
    adId: 'a1',
    message: 'Help Someone to fix their wagon',
    reward: 50,
    expiresIn: 7,
    encrypted: null,
    probability: 'Sure thing',
    ...overrides,
});

describe('decodeAd', () => {
    it('keeps plain ads and drops the encrypted flag', () => {
        expect(decodeAd(raw())).toEqual({
            adId: 'a1',
            message: 'Help Someone to fix their wagon',
            reward: 50,
            expiresIn: 7,
            probability: 'Sure thing',
        });
    });

    it('decodes message, label and ad id of a Base64 ad', () => {
        const ad = decodeAd(
            raw({
                encrypted: 1,
                adId: 'VzF5cmNycGk=',
                message: btoa('Help Someone'),
                probability: 'Umlza3k=',
            }),
        );
        expect(ad).toMatchObject({
            adId: 'W1yrcrpi',
            message: 'Help Someone',
            probability: 'Risky',
        });
    });

    it('decodes message, label and ad id of a ROT13 ad', () => {
        const ad = decodeAd(
            raw({
                encrypted: 2,
                adId: 'W1yrcrpi',
                message: 'Uryc Fbzrbar',
                probability: 'Vzcbffvoyr',
            }),
        );
        expect(ad).toMatchObject({
            adId: 'J1lepecv',
            message: 'Help Someone',
            probability: 'Impossible',
        });
    });
});

describe('decodeAds', () => {
    it('drops ads that cannot be decoded and keeps the rest', () => {
        const ads = decodeAds([
            raw({ adId: 'good' }),
            raw({ adId: 'bad', encrypted: 1, message: 'not base64!' }),
        ]);
        expect(ads.map((ad) => ad.adId)).toEqual(['good']);
    });

    it('drops an ad whose encoded id is not valid Base64', () => {
        expect(
            decodeAds([
                raw({ encrypted: 1, adId: '!!!', message: btoa('x'), probability: btoa('y') }),
            ]),
        ).toEqual([]);
    });

    it('decodes every real encrypted fixture to a known label and an 8-character id', () => {
        const ads = decodeAds(parseMessages(loadFixture('messages-encrypted-1.json')));
        expect(ads.length).toBeGreaterThan(0);
        for (const ad of ads) {
            expect(Object.keys(LABEL_PROBABILITY)).toContain(ad.probability);
            expect(ad.adId).toMatch(/^[A-Za-z0-9]{8}$/);
        }
    });

    it('decodes the synthetic ROT13 fixture to known labels', () => {
        const ads = decodeAds(parseMessages(loadFixture('messages-encrypted-2.synthetic.json')));
        expect(ads.length).toBeGreaterThan(0);
        for (const ad of ads) expect(Object.keys(LABEL_PROBABILITY)).toContain(ad.probability);
    });
});
