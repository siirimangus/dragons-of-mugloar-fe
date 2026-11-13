import type { Ad } from '../domain/types';
import { DecodeError, decodeField } from './decode';
import type { RawAd } from './schemas';

/**
 * Decodes message, label AND id. The live API answers 400 when an encrypted ad is solved
 * with its encoded id, so the rest of the app must only ever see the decoded id.
 */
export function decodeAd(raw: RawAd): Ad {
    return {
        adId: decodeField(raw.adId, raw.encrypted),
        message: decodeField(raw.message, raw.encrypted),
        reward: raw.reward,
        expiresIn: raw.expiresIn,
        probability: decodeField(raw.probability, raw.encrypted),
    };
}

/** Ads that cannot be decoded are dropped; the rest of the board still works. */
export function decodeAds(raws: readonly RawAd[]): Ad[] {
    const ads: Ad[] = [];
    for (const raw of raws) {
        try {
            ads.push(decodeAd(raw));
        } catch (error) {
            if (!(error instanceof DecodeError)) throw error;
        }
    }
    return ads;
}
