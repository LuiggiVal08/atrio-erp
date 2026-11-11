import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/core/auth/store';
import { useTenantStore } from '@/core/tenant/store';

type RetriableRequestConfig = InternalAxiosRequestConfig & { _authRetried?: boolean };

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(
        `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`,
        null,
        { withCredentials: true, timeout: 10000 },
      )
      .then(({ data }) => {
        if (!data.accessToken) throw new Error('Refresh response did not include an access token');
        useAuthStore.getState().setToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const tenantId = useTenantStore.getState().activeTenantId || localStorage.getItem('x-tenant-id');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config as RetriableRequestConfig | undefined;
    const url = config?.url ?? '';
    if (
      error.response?.status !== 401 ||
      !config ||
      config._authRetried ||
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout')
    ) {
      return Promise.reject(error);
    }

    config._authRetried = true;
    try {
      const token = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return await api.request(config);
    } catch (refreshError) {
      if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
        useAuthStore.getState().logout(false);
      }
      return Promise.reject(refreshError);
    }
  },
);

export default api;
