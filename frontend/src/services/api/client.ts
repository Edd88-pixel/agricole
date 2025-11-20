import { appConfig } from '@/services/config';
import { getAccessToken } from '@/services/authTokens';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const normalizePath = (path: string): string => path.replace(/^\/+/, '');

const buildUrl = (path: string, query?: Record<string, string | number | boolean | undefined>) => {
  const base = (appConfig.apiBaseUrl ?? '').replace(/\/$/, '');
  const normalized = normalizePath(path);
  const url = new URL(`${base}/${normalized}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  method?: ApiMethod;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
};

export const apiClient = {
  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = 'GET', query, body, headers, ...rest } = options;
    const url = buildUrl(path, query);

    const authToken = getAccessToken();
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders,
        ...headers
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      ...rest
    });

    if (!response.ok) {
      const details = await parseResponse<unknown>(response);
      throw new ApiError('Request failed', response.status, details);
    }

    return parseResponse<T>(response);
  },

  get<T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'GET' });
  },

  post<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  },

  put<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  },

  patch<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  },

  delete<T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
};

export type ApiClient = typeof apiClient;
