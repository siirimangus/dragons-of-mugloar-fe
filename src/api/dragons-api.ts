import type { Ad, PurchaseResult, Session, ShopItem, SolveResult } from '../domain/types';

/** What the app needs from the game server. Ads come back already decoded. */
export interface DragonsApi {
    startGame(): Promise<Session>;
    getMessages(gameId: string): Promise<Ad[]>;
    solve(gameId: string, adId: string): Promise<SolveResult>;
    getShop(gameId: string): Promise<ShopItem[]>;
    buy(gameId: string, itemId: string): Promise<PurchaseResult>;
}
