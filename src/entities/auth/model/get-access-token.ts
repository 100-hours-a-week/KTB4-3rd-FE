import { refreshAccessToken } from '@/entities/auth/api/auth';
import { useAuthStore } from '@/entities/auth/model/auth-store';

let accessTokenRequest: Promise<string> | null = null;

export function getAccessToken(): Promise<string> {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    return Promise.resolve(accessToken);
  }

  if (!accessTokenRequest) {
    accessTokenRequest = refreshAccessToken()
      .then(({ data }) => {
        useAuthStore.getState().setAccessToken(data.access_token);
        return data.access_token;
      })
      .finally(() => {
        accessTokenRequest = null;
      });
  }

  return accessTokenRequest;
}

export class AuthViewerMismatchError extends Error {
  constructor() {
    super('현재 로그인한 사용자 정보를 확인할 수 없습니다.');
    this.name = 'AuthViewerMismatchError';
  }
}

export async function getAccessTokenForViewer(viewerId: number): Promise<string> {
  const accessToken = await getAccessToken();
  const authState = useAuthStore.getState();

  if (authState.accessToken !== accessToken || authState.verifiedViewerId !== viewerId) {
    throw new AuthViewerMismatchError();
  }

  return accessToken;
}

export function isCurrentVerifiedViewer(viewerId: number): boolean {
  const { accessToken, verifiedViewerId } = useAuthStore.getState();
  return accessToken !== null && verifiedViewerId === viewerId;
}
