import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@/shared/api/mocks/server';
import { resetAuthMockState } from '@/shared/api/mocks/auth.handlers';
import { resetSignupMockState } from '@/shared/api/mocks/signup.handlers';
import { resetTaxiPotMockState } from '@/shared/api/mocks/taxi-pots.handlers';
import { resetUserMockState } from '@/shared/api/mocks/user.handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetAuthMockState();
  resetSignupMockState();
  resetTaxiPotMockState();
  resetUserMockState();
});
afterAll(() => server.close());
