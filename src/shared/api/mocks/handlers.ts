import { authHandlers } from './auth.handlers';
import { carpoolReadHandlers } from './carpool-read.handlers';
import { carpoolRequestReviewHandlers } from './carpool-request-review.handlers';
import { carpoolRequestDecisionHandlers } from './carpool-request-decision.handlers';
import { carpoolJoinRequestHandlers } from './carpool-join-request.handlers';
import { chatRoomHandlers } from './chat-room.handlers';
import { chatRoomWebSocketHandlers } from './chat-room-websocket.handlers';
import { chatFeedbackHandlers } from './chat-feedback.handlers';
import { carpoolRequestsHandlers } from './carpool-requests.handlers';
import { communityCommentsHandlers } from './community-comments.handlers';
import { healthHandlers } from './health.handlers';
import { homeHandlers } from './home.handlers';
import { joinCompanionHandlers } from './join-companion.handlers';
import { kakaoLoginHandlers } from './kakao-login.handlers';
import { postCreateHandlers } from './post-create.handlers';
import { signupHandlers } from './signup.handlers';
import { taxiPotsHandlers } from './taxi-pots.handlers';
import { userHandlers } from './user.handlers';

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...carpoolRequestReviewHandlers,
  ...chatRoomHandlers,
  ...chatRoomWebSocketHandlers,
  ...chatFeedbackHandlers,
  ...carpoolRequestsHandlers,
  ...carpoolJoinRequestHandlers,
  ...communityCommentsHandlers,
  ...carpoolRequestDecisionHandlers,
  ...kakaoLoginHandlers,
  ...signupHandlers,
  ...postCreateHandlers,
  ...taxiPotsHandlers,
  ...joinCompanionHandlers,
  ...homeHandlers,
  ...carpoolReadHandlers,
  ...userHandlers,
];
