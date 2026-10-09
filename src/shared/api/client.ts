const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');

export type ApiErrorDetail = { field: string; reason: string };

export type ApiErrorBody = {
  message?: string;
  error?: {
    code?: string;
    field?: string | null;
    details?: ApiErrorDetail[];
  };
};

export type ApiErrorDetail = {
  field: string;
  reason: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly field?: string | null;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, body?: ApiErrorBody) {
    super(body?.message ?? `API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.error?.code;
    this.field = body?.error?.field;
    this.details = body?.error?.details;
  }
}

export type ApiFetchOptions = RequestInit & {
  token?: string;
  skipAuthRefresh?: boolean;
};

export type AuthRefreshHandler = () => Promise<string>;

let authRefreshHandler: AuthRefreshHandler | null = null;
let authRefreshRequest: Promise<string> | null = null;

export function registerAuthRefreshHandler(handler: AuthRefreshHandler) {
  authRefreshHandler = handler;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  return response.json().catch(() => undefined);
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, skipAuthRefresh, ...init } = options;
  const response = await fetchApi(path, init, token);

  if (response.response.ok) {
    return response.body as T;
  }

  const refreshHandler = authRefreshHandler;

  if (response.response.status !== 401 || skipAuthRefresh || !refreshHandler) {
    throwApiError(response.response, response.body);
  }

  let refreshedAccessToken: string;

  try {
    refreshedAccessToken = await getRefreshedAccessToken(refreshHandler);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throwApiError(response.response, response.body);
    }

    throw error;
  }

  const retriedResponse = await fetchApi(path, init, refreshedAccessToken);

  if (!retriedResponse.response.ok) {
    throwApiError(retriedResponse.response, retriedResponse.body);
  }

  return retriedResponse.body as T;
}

async function fetchApi(path: string, init: RequestInit, token?: string) {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
  const body = await readResponseBody(response);

  return { response, body };
}

function throwApiError(response: Response, body: unknown): never {
  throw new ApiError(response.status, body as ApiErrorBody | undefined);
}

function getRefreshedAccessToken(handler: AuthRefreshHandler): Promise<string> {
  if (!authRefreshRequest) {
    authRefreshRequest = handler().finally(() => {
      authRefreshRequest = null;
    });
  }

  return authRefreshRequest;
}
