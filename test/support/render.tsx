import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import type { DragonsApi } from '../../src/api/dragons-api';
import { GameProvider } from '../../src/state/GameProvider';

/** Renders a tree inside a GameProvider backed by the given API. */
export function renderWithGame(ui: ReactElement, api: DragonsApi) {
  return { user: userEvent.setup(), ...render(<GameProvider api={api}>{ui}</GameProvider>) };
}
