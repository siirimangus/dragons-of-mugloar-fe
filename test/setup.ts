import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { FakeDragonsApi } from './support/fake-dragons-api';

// Under heavy CPU load the default 1s async timeout is too tight for multi-step flows.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
    // A failing test must not leave a request held open: pending transitions would block later tests.
    FakeDragonsApi.releaseAllInstances();
    cleanup();
});
