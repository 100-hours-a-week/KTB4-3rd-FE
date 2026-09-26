import { authHandlers } from './auth.handlers';
import { chatRoomHandlers } from './chat-room.handlers';
import { communityCommentsHandlers } from './community-comments.handlers';
import { healthHandlers } from './health.handlers';
import { homeHandlers } from './home.handlers';
import { joinCompanionHandlers } from './join-companion.handlers';
import { kakaoLoginHandlers } from './kakao-login.handlers';
import { postCreateHandlers } from './post-create.handlers';
import { signupHandlers } from './signup.handlers';
import { taxiPotsHandlers } from './taxi-pots.handlers';

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...chatRoomHandlers,
  ...communityCommentsHandlers,
  ...kakaoLoginHandlers,
  ...signupHandlers,
  ...postCreateHandlers,
  ...taxiPotsHandlers,
  ...joinCompanionHandlers,
  ...homeHandlers,
];
