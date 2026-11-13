import { TRAP_PATTERN } from './tuning';
import type { Ad } from './types';

export function isTrap(ad: Pick<Ad, 'message'>): boolean {
    return TRAP_PATTERN.test(ad.message);
}
