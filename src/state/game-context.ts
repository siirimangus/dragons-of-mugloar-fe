import { createContext, useContext } from 'react';
import type { GameState } from './game-reducer';

export type GameActions = {
  /** True while an action (including its board reload) is running. */
  readonly isPending: boolean;
  startGame(): Promise<void>;
  solveAd(adId: string): Promise<void>;
  buyItem(itemId: string): Promise<void>;
  /** Repeats the action that failed, if it can be repeated. */
  retry(): Promise<void>;
  endGame(): void;
  playAgain(): void;
  dismissError(): void;
};

export const StateContext = createContext<GameState | null>(null);
export const ActionsContext = createContext<GameActions | null>(null);

function required<T>(value: T | null, hook: string): T {
  if (value === null) throw new Error(`${hook} must be used inside <GameProvider>`);
  return value;
}

export const useGameState = (): GameState => required(useContext(StateContext), 'useGameState');
export const useGameActions = (): GameActions =>
  required(useContext(ActionsContext), 'useGameActions');
