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
