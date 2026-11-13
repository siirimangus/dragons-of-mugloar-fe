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
  readonly highScore: number;
  readonly turn: number;
};

export type SolveResult = {
  readonly success: boolean;
  readonly lives: number;
  readonly gold: number;
  readonly score: number;
  readonly highScore: number;
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
  readonly value: number;
  readonly risk: Risk;
  readonly trap: boolean;
};

export type SortKey = 'value' | 'reward' | 'risk' | 'expiry';

export type AdviceKind = 'buy' | 'solve' | 'none';

export type Advice = {
  readonly kind: AdviceKind;
  readonly targetId: string | null;
  readonly headline: string;
  readonly reason: string;
};
