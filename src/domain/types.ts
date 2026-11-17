export type Ad = {
    readonly adId: string;
    readonly message: string;
    readonly reward: number;
    readonly expiresIn: number;
    readonly probability: string;
};

export type ShopItem = {
    readonly id: string;
    readonly name: string;
    readonly cost: number;
};

export type Session = {
    readonly gameId: string;
    readonly lives: number;
    readonly gold: number;
    readonly level: number;
    readonly score: number;
    readonly turn: number;
};

export type SolveResult = {
    readonly success: boolean;
    readonly lives: number;
    readonly gold: number;
    readonly score: number;
    readonly turn: number;
    readonly message: string;
};

export type PurchaseResult = {
    readonly shoppingSuccess: boolean;
    readonly gold: number;
    readonly lives: number;
    readonly level: number;
    readonly turn: number;
};

export type Risk = 'low' | 'medium' | 'high';

export type AdInsight = {
    readonly probability: number;
    /** `probability x reward`: the gold this ad is worth on average. */
    readonly expectedGain: number;
    /** `(1 - probability) x LIFE_VALUE`: what the chance of failing costs, in gold. */
    readonly riskCost: number;
    /** `expectedGain - riskCost`. */
    readonly value: number;
    readonly risk: Risk;
    readonly trap: boolean;
};

/** An ad together with everything derived from it, computed once per board. */
export type BoardEntry = {
    readonly ad: Ad;
    readonly insight: AdInsight;
};

export type SortKey = 'value' | 'reward' | 'risk' | 'expiry';

export type AdviceKind = 'buy' | 'solve' | 'none';

export type Advice = {
    readonly kind: AdviceKind;
    readonly targetId: string | null;
    readonly headline: string;
    readonly reason: string;
    /** The advice costs a life on purpose, so acting on it asks for confirmation first. */
    readonly confirm: boolean;
};
