import { z } from 'zod';
import type { PurchaseResult, Session, ShopItem, SolveResult } from '../domain/types';
import { ValidationError } from './errors';

const count = z.number().int();
const numericString = z
    .string()
    .regex(/^\d+$/)
    .transform((value) => Number(value))
    .pipe(z.number().int().safe());
const reward = z.union([z.number().int().nonnegative(), numericString]);
const booleanLike = z.union([
    z.boolean(),
    z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

// `highScore` is in both responses but the live API leaves it at 0 for every game, so it is not
// read. Extra keys are ignored, so it simply passes through unvalidated.
const sessionSchema = z.object({
    gameId: z.string().min(1),
    lives: count,
    gold: count,
    level: count,
    score: count,
    turn: count,
});

const adSchema = z.object({
    adId: z.string().min(1),
    message: z.string(),
    reward,
    expiresIn: count,
    encrypted: z
        .union([z.literal(1), z.literal(2)])
        .nullish()
        .transform((value) => value ?? null),
    probability: z.string(),
});

const shopItemSchema = z.object({ id: z.string().min(1), name: z.string(), cost: count });

const solveSchema = z.object({
    success: z.boolean(),
    lives: count,
    gold: count,
    score: count,
    turn: count,
    message: z.string(),
});

const purchaseSchema = z.object({
    shoppingSuccess: booleanLike,
    gold: count,
    lives: count,
    level: count,
    turn: count,
});

/** An ad exactly as the API returns it: message, label and id may be encoded. */
export type RawAd = {
    readonly adId: string;
    readonly message: string;
    readonly reward: number;
    readonly expiresIn: number;
    readonly encrypted: 1 | 2 | null;
    readonly probability: string;
};

function parse<S extends z.ZodType>(schema: S, body: unknown, what: string): z.output<S> {
    const result = schema.safeParse(body);
    if (!result.success) {
        const issues = result.error.issues
            .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('; ');
        throw new ValidationError(`Invalid ${what} response: ${issues}`);
    }
    return result.data;
}

export const parseStartGame = (body: unknown): Session => parse(sessionSchema, body, 'start game');
export const parseMessages = (body: unknown): RawAd[] => parse(z.array(adSchema), body, 'messages');
export const parseShop = (body: unknown): ShopItem[] =>
    parse(z.array(shopItemSchema), body, 'shop');
export const parseSolveResult = (body: unknown): SolveResult => parse(solveSchema, body, 'solve');
export const parsePurchaseResult = (body: unknown): PurchaseResult =>
    parse(purchaseSchema, body, 'purchase');
