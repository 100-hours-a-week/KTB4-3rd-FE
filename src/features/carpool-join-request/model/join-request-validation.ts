const MAX_JOIN_REQUEST_CONTENT_LENGTH = 200;

export function isJoinRequestContentValid(content: string) {
  return content.length >= 1 && content.length <= MAX_JOIN_REQUEST_CONTENT_LENGTH;
}
