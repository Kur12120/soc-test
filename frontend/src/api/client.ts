const API_BASE_URL = 'http://127.0.0.1:3000/api';
function getHeaders(includeAuth: boolean = false): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  includeAuth: boolean = false
): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    ...options,
    headers: { ...getHeaders(includeAuth), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }
  return response.json();
}
