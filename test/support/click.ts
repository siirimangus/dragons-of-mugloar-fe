import { expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** Clicks once the element is enabled (a click on a disabled button is a silent no-op while a transition is pending). */
export async function clickWhenEnabled(user: UserEvent, find: () => HTMLElement) {
    await waitFor(() => expect(find()).toBeEnabled());
    await user.click(find());
}
