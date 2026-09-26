const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');

export type ApiErrorBody = {
  message?: string;
  error?: {
    code?: string;
    field?: string | null;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly field?: string | null;

  constructor(status: number, body?: ApiErrorBody) {
    super(body?.message ?? `API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.error?.code;
    this.field = body?.error?.field;
  }
}

export type ApiFetchOptions = RequestInit & {
  token?: string;
};

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  return response.json().catch(() => undefined);
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, ...init } = options;
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

  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorBody | undefined);
  }

  return body as T;
}
