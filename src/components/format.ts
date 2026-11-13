export function formatPercent(probability: number): string {
    return `${Math.round(probability * 100)}%`;
}

/** "+47" or "-46"; rounds away the sign of tiny negatives. */
export function formatValue(value: number): string {
    const rounded = Math.round(Math.abs(value));
    return `${value < 0 && rounded !== 0 ? '-' : '+'}${rounded}`;
}

export function pluralize(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}
