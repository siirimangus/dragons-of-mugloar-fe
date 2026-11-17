/**
 * Measured success rate per difficulty label, with the sample each number came from.
 *
 * Calibrated on the live API over 40 games (Nov 2026) in the backend project. Dragon level does
 * not change these rates, so runs with and without upgrades are pooled; what level changes is the
 * reward the board offers (see `LIFE_VALUE`). `Impossible` is never attempted, so its 0 is an
 * assumption rather than a measurement.
 */
export const LABEL_PROBABILITY: Readonly<Record<string, number>> = {
    'Sure thing': 0.98, // 240/245
    'Piece of cake': 0.94, // 645/683
    'Walk in the park': 0.86, // 352/411
    'Quite likely': 0.79, // 177/225
    'Hmmm....': 0.67, // 109/163
    Gamble: 0.51, // 63/124
    Risky: 0.44, // 40/90
    'Rather detrimental': 0.39, // 37/96
    'Playing with fire': 0.23, // 17/75
    'Suicide mission': 0.11, // 11/100
    Impossible: 0,
};

export const UNKNOWN_PROBABILITY = 0.3;

/**
 * What losing a life is worth, in gold, when valuing an ad.
 *
 * Deliberately far above the 50 gold a healing potion costs: measured against the live API, 150
 * scores better than cheaper prices. It is also why the recommended ad is nearly always a safe
 * one. At level 0 the board pays about 28 gold on average, so the `(1 - p) x 150` term dominates
 * everything below "Quite likely"; upgrades roughly double the rewards on offer, and only then do
 * the risky ads start winning on value. The card shows both halves of the sum so the player can
 * see that happen.
 */
export const LIFE_VALUE = 150;

export const RISK_LOW_AT = 0.85;
export const RISK_MEDIUM_AT = 0.55;

export const HEAL_ITEM_ID = 'hpot';
export const HEAL_THRESHOLD = 2;
/** Gold to keep after buying an upgrade, so a healing potion stays affordable. */
export const RESERVE_GOLD = 50;

/** Cost-effective buying order: 100-gold items first, then the 300-gold ones. */
export const UPGRADE_ORDER: readonly string[] = [
    'cs',
    'gas',
    'wax',
    'tricks',
    'wingpot',
    'ch',
    'rf',
    'iron',
    'mtrix',
    'wingpotmax',
];

/** Ads whose message matches are traps: huge reward, top label, but they cost a life. */
export const TRAP_PATTERN = /super\s+awesome/i;
