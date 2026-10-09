import Axios, { InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';

import { toApiError } from './api-error';
import { tokenStorage } from './token-storage';

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);

api.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => {
    const apiError = toApiError(error);

    const token = tokenStorage.get();
    const authorization = Axios.isAxiosError(error)
      ? error.config?.headers.Authorization
      : undefined;

    if (
      apiError.status === 401 &&
      token &&
      authorization === `Bearer ${token}`
    ) {
      tokenStorage.clear();
      const redirectTo = `${window.location.pathname}${window.location.search}`;
      const params = new URLSearchParams({ reason: 'expired' });
      if (redirectTo && redirectTo !== '/') {
        params.set('redirectTo', redirectTo);
      }
      window.location.href = `/login?${params.toString()}`;
    }

    return Promise.reject(apiError);
  },
);
