import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@/shared/api/mocks/server';
import { resetSignupMockState } from '@/shared/api/mocks/signup.handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetSignupMockState();
});
afterAll(() => server.close());
