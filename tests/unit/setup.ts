import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@/shared/api/mocks/server';
import { resetSignupMockState } from '@/shared/api/mocks/signup.handlers';
import { resetTaxiPotMockState } from '@/shared/api/mocks/taxi-pots.handlers';
import { resetUserMockState } from '@/shared/api/mocks/user.handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetSignupMockState();
  resetTaxiPotMockState();
  resetUserMockState();
});
afterAll(() => server.close());
