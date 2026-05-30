const LOCAL_API_BASE_URL = 'http://localhost:8000';
const PRODUCTION_API_BASE_URL = 'https://promptivity-51894490688.asia-southeast2.run.app';

function normalizeApiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function getFallbackApiBaseUrl(): string {
  return process.env.NODE_ENV === 'production'
    ? PRODUCTION_API_BASE_URL
    : LOCAL_API_BASE_URL;
}

function getBrowserOrigin(): string | null {
  return typeof globalThis.location?.origin === 'string'
    ? normalizeApiBaseUrl(globalThis.location.origin)
    : null;
}

function resolveApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const fallbackUrl = getFallbackApiBaseUrl();
  const normalizedConfiguredUrl = configuredUrl ? normalizeApiBaseUrl(configuredUrl) : '';
  const browserOrigin = getBrowserOrigin();

  if (normalizedConfiguredUrl && normalizedConfiguredUrl !== browserOrigin) {
    return normalizedConfiguredUrl;
  }

  if (normalizedConfiguredUrl && normalizedConfiguredUrl === browserOrigin) {
    console.warn(
      '[Promptivity API] NEXT_PUBLIC_API_URL points to the frontend origin; using fallback API base URL:',
      fallbackUrl,
    );
  }

  return normalizeApiBaseUrl(fallbackUrl);
}

export const API_BASE_URL = resolveApiBaseUrl();

console.info('[Promptivity API] Resolved API base URL:', API_BASE_URL);

export function apiUrl(endpoint: string): string {
  if (!endpoint.startsWith('/')) {
    throw new Error(`API endpoint must start with "/": ${endpoint}`);
  }

  return `${API_BASE_URL}${endpoint}`;
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(apiUrl(endpoint), {
    ...options,
    headers,
  });
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(endpoint, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
}

export const API = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
