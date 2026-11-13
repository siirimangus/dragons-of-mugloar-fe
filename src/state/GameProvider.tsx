import { type ReactNode, useReducer, useTransition } from 'react';
import type { DragonsApi } from '../api/dragons-api';
import { ActionsContext, StateContext } from './game-context';
import { gameReducer, initialState } from './game-reducer';
import { createGameActions } from './use-game-actions';

export function GameProvider({
  api,
  children,
}: {
  readonly api: DragonsApi;
  readonly children: ReactNode;
}) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [isPending, startTransition] = useTransition();

  const run = (task: () => Promise<void>): Promise<void> =>
    new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          await task();
        } finally {
          resolve();
        }
      });
    });

  const actions = createGameActions({ api, state, dispatch, run, isPending });

  return (
    <StateContext value={state}>
      <ActionsContext value={actions}>{children}</ActionsContext>
    </StateContext>
  );
}
