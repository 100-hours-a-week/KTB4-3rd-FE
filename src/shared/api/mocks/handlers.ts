import { authHandlers } from './auth.handlers';
import { healthHandlers } from './health.handlers';
import { kakaoLoginHandlers } from './kakao-login.handlers';
import { signupHandlers } from './signup.handlers';

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...kakaoLoginHandlers,
  ...signupHandlers,
];
