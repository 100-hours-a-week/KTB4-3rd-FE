const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');
const mockApiEnabled = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

let mockApiReady: Promise<void> | null = null;

async function waitForMockApi() {
  if (!mockApiEnabled || typeof window === 'undefined') {
    return;
  }

  mockApiReady ??= import('./mocks/browser')
    .then(({ startMockApi }) => startMockApi())
    .catch((error: unknown) => {
      mockApiReady = null;
      throw error;
    });

  await mockApiReady;
}

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

export type ApiFetchResponse<T> = {
  data: T;
  status: number;
};

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
  const { data } = await apiFetchWithStatus<T>(path, options);
  return data;
}

export async function apiFetchWithStatus<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiFetchResponse<T>> {
  const { token, skipAuthRefresh, ...init } = options;
  const response = await fetchApi(path, init, token);

  if (response.response.ok) {
    return {
      data: response.body as T,
      status: response.response.status,
    };
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

  return {
    data: retriedResponse.body as T,
    status: retriedResponse.response.status,
  };
}

async function fetchApi(path: string, init: RequestInit, token?: string) {
  await waitForMockApi();

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
