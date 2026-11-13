import { ApiError } from '../../src/api/errors';
import type { DragonsApi } from '../../src/api/dragons-api';
import type { Ad, PurchaseResult, Session, ShopItem, SolveResult } from '../../src/domain/types';
import { SHOP, TRAP_MESSAGE } from './builders';

export type FakeOptions = {
  readonly lives?: number;
  readonly gold?: number;
  readonly score?: number;
  /** Whether a normal (non-trap) solve succeeds on the given turn. Default: always. */
  readonly solveSucceeds?: (turn: number) => boolean;
};

type Method = 'startGame' | 'getMessages' | 'solve' | 'getShop' | 'buy';

/** A tiny deterministic game: three ads per turn (one good, one bad, one trap). */
export class FakeDragonsApi implements DragonsApi {
  readonly calls: string[] = [];

  private state: Session;
  private readonly solveSucceeds: (turn: number) => boolean;
  private readonly failures = new Map<Method, Error[]>();
  private readonly holds = new Map<Method, Promise<void>>();

  constructor(options: FakeOptions = {}) {
    this.solveSucceeds = options.solveSucceeds ?? (() => true);
    this.state = {
      gameId: 'fake-game',
      lives: options.lives ?? 3,
      gold: options.gold ?? 0,
      level: 0,
      score: options.score ?? 0,
      highScore: 0,
      turn: 0,
    };
  }

  /** The next `times` calls to `method` throw `error`. */
  failNext(method: Method, error: Error, times = 1): void {
    this.failures.set(
      method,
      Array.from({ length: times }, () => error),
    );
  }

  /** The next call to `method` waits until the returned function is called. */
  hold(method: Method): () => void {
    let release!: () => void;
    this.holds.set(method, new Promise<void>((resolve) => (release = resolve)));
    return release;
  }

  snapshot(): Session {
    return this.state;
  }

  async startGame(): Promise<Session> {
    await this.enter('startGame');
    return this.state;
  }

  async getMessages(gameId: string): Promise<Ad[]> {
    await this.enter('getMessages');
    this.assertGame(gameId);
    return this.board();
  }

  async getShop(gameId: string): Promise<ShopItem[]> {
    await this.enter('getShop');
    this.assertGame(gameId);
    return SHOP.map((item) => ({ ...item }));
  }

  async solve(gameId: string, adId: string): Promise<SolveResult> {
    await this.enter('solve');
    this.assertGame(gameId);
    const ad = this.board().find((candidate) => candidate.adId === adId);
    if (!ad) throw new ApiError('Bad Request', { status: 400, retryable: false });

    const trap = ad.message === TRAP_MESSAGE;
    const success = !trap && this.solveSucceeds(this.state.turn);
    this.state = {
      ...this.state,
      turn: this.state.turn + 1,
      lives: success ? this.state.lives : this.state.lives - 1,
      gold: success ? this.state.gold + ad.reward : this.state.gold,
      score: success ? this.state.score + ad.reward : this.state.score,
    };
    this.state = { ...this.state, highScore: Math.max(this.state.highScore, this.state.score) };
    return {
      success,
      lives: this.state.lives,
      gold: this.state.gold,
      score: this.state.score,
      highScore: this.state.highScore,
      turn: this.state.turn,
      message: trap
        ? 'You fell into a trap set up, by people who did not appreciate your dealings.'
        : success
          ? 'You successfully solved the mission!'
          : 'You failed on the mission!',
    };
  }

  async buy(gameId: string, itemId: string): Promise<PurchaseResult> {
    await this.enter('buy');
    this.assertGame(gameId);
    const item = SHOP.find((candidate) => candidate.id === itemId);
    if (!item) throw new ApiError('Not Found', { status: 404, retryable: false });

    const affordable = this.state.gold >= item.cost;
    this.state = {
      ...this.state,
      turn: this.state.turn + 1,
      gold: affordable ? this.state.gold - item.cost : this.state.gold,
      lives: affordable && itemId === 'hpot' ? this.state.lives + 1 : this.state.lives,
      level:
        affordable && itemId !== 'hpot'
          ? this.state.level + (item.cost >= 300 ? 2 : 1)
          : this.state.level,
    };
    return {
      shoppingSuccess: affordable,
      gold: this.state.gold,
      lives: this.state.lives,
      level: this.state.level,
      turn: this.state.turn,
    };
  }

  private board(): Ad[] {
    const turn = this.state.turn;
    return [
      {
        adId: `a${turn}-1`,
        message: 'Help Ann to fix their wagon',
        reward: 60,
        expiresIn: 5,
        probability: 'Piece of cake',
      },
      {
        adId: `a${turn}-2`,
        message: 'Escort Bob to the market',
        reward: 40,
        expiresIn: 3,
        probability: 'Gamble',
      },
      {
        adId: `a${turn}-3`,
        message: TRAP_MESSAGE,
        reward: 400,
        expiresIn: 2,
        probability: 'Sure thing',
      },
    ];
  }

  private async enter(method: Method): Promise<void> {
    this.calls.push(method);
    const hold = this.holds.get(method);
    if (hold) {
      this.holds.delete(method);
      await hold;
    }
    const queue = this.failures.get(method);
    const error = queue?.shift();
    if (error) throw error;
  }

  private assertGame(gameId: string): void {
    if (gameId !== this.state.gameId)
      throw new ApiError('Not Found', { status: 404, retryable: false });
  }
}
