import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@/shared/api/mocks/server';
import { resetSignupMockState } from '@/shared/api/mocks/signup.handlers';
import { resetTaxiPotMockState } from '@/shared/api/mocks/taxi-pots.handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetSignupMockState();
  resetTaxiPotMockState();
});
afterAll(() => server.close());
