import { authHandlers } from './auth.handlers';
import { healthHandlers } from './health.handlers';
import { signupHandlers } from './signup.handlers';

export const handlers = [...healthHandlers, ...authHandlers, ...signupHandlers];
