import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

import type { ApiEnvelope, HealthResponse } from "@repo/shared";

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ data: RefreshResponse }>(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/auth/refresh`,
      undefined,
      { withCredentials: true },
    );
    accessToken = data.data.accessToken;
    return accessToken;
  } catch {
    accessToken = null;
    return null;
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh()
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    const isAuthRefreshRequest =
      original?.url?.includes("/auth/refresh") ||
      original?.url?.includes("/auth/login") ||
      original?.url?.includes("/auth/register");

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthRefreshRequest
    ) {
      original._retry = true;

      const token = await refreshAccessToken();

      if (token) {
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${token}`,
        };
        return client(original);
      }

      setAccessToken(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }

    return Promise.reject(error);
  },
);

export async function fetchHealth(): Promise<ApiEnvelope<HealthResponse>> {
  const { data } = await client.get<ApiEnvelope<HealthResponse>>("/health");
  return data;
}
