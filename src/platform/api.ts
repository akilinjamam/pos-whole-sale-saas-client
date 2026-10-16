import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

import { errorMessage } from '@/api/client';
import { env } from '@/config/env';

import type { ApiSuccess, Paginated } from '@shared/types';

/**
 * The platform-admin API client (SaaS phase 5) — its own axios instance and its own token, never the
 * tenant one. The two sessions are independent: an admin can be signed in to a business in one tab
 * and to the platform in another, and neither token works on the other's routes.
 *
 * The token lives in `sessionStorage`: it survives a reload but not closing the tab, and there is no
 * refresh token — after `JWT_PLATFORM_TTL` the admin signs in again.
 */

const TOKEN_KEY = 'platform.token';

export const platformTokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null): void {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Private mode with storage blocked: the session lasts until the page is reloaded.
    }
  },
};

export const platformApi = axios.create({
  baseURL: `${env.apiUrl.replace(/\/+$/, '')}/api/v1/platform`,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

platformApi.interceptors.request.use((request) => {
  const token = platformTokenStore.get();
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

/** Set by PlatformAuthProvider, so a 401 anywhere signs the admin out of the platform area. */
let onUnauthorised: (() => void) | null = null;
export function registerPlatformSignOut(handler: () => void): void {
  onUnauthorised = handler;
}

platformApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const isLogin = error.config?.url?.endsWith('/auth/login');
      if (status === 401 && !isLogin) {
        platformTokenStore.set(null);
        onUnauthorised?.();
      }
      // 422 belongs on the form; 401 on login is the form's own message.
      if (status !== 422 && !(status === 401 && !isLogin)) toast.error(errorMessage(error));
    }
    return Promise.reject(error);
  },
);

export async function pget<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await platformApi.get<ApiSuccess<T>>(url, { params });
  return data.data;
}

export async function ppage<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<Paginated<T>> {
  const { data } = await platformApi.get<ApiSuccess<T[]>>(url, { params });
  return { items: data.data, meta: data.meta! };
}

export async function ppost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await platformApi.post<ApiSuccess<T>>(url, body);
  return data?.data as T;
}

export async function ppatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await platformApi.patch<ApiSuccess<T>>(url, body);
  return data.data;
}
