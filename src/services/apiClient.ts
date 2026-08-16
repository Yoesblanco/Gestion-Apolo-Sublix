import { clientLogger } from '../utils/clientLogger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;

  const resolvedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = localStorage.getItem('apolo_token');
    if (token) {
      resolvedHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: resolvedHeaders,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = (data && data.message) || `Error HTTP ${response.status}`;
      clientLogger.warn(`API Error ${response.status} en ${endpoint}: ${errorMsg}`, { status: response.status, data });
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (error: any) {
    clientLogger.error(`Fallo en solicitud a ${endpoint}: ${error?.message || error}`, { error });
    throw error;
  }
}
