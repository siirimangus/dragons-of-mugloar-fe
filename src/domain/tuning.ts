/** Measured success rate per difficulty label (live API, upgrades enabled). */
export const LABEL_PROBABILITY: Readonly<Record<string, number>> = {
  'Piece of cake': 0.94,
  'Walk in the park': 0.88,
  'Sure thing': 0.99,
  'Quite likely': 0.75,
  'Hmmm....': 0.65,
  Gamble: 0.55,
  Risky: 0.46,
  'Rather detrimental': 0.4,
  'Playing with fire': 0.26,
  'Suicide mission': 0.08,
  Impossible: 0,
};

export const UNKNOWN_PROBABILITY = 0.3;

/** What losing a life is worth, in gold, when valuing an ad. */
export const LIFE_VALUE = 150;

export const RISK_LOW_AT = 0.85;
export const RISK_MEDIUM_AT = 0.55;

export const GOAL_SCORE = 1000;

export const HEAL_ITEM_ID = 'hpot';
export const HEAL_THRESHOLD = 2;
/** Gold to keep after buying an upgrade. */
export const RESERVE_GOLD = 50;
/** When waiting is merely better than a bad ad, keep at least this much gold after the potion. */
export const WAIT_RESERVE_GOLD = 300;

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

/** Ads whose message matches are traps: huge reward, top label, but they cost a life. No `g` or `y` flag. */
export const TRAP_PATTERN = /super\s+awesome/i;
