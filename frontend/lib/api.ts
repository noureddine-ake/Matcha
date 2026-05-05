/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const baseURL = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000"}/api`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Request deduplication cache - prevents duplicate requests in same render
const requestCache = new Map<string, Promise<any>>();

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";
        const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!refreshResponse.ok) {
          throw new Error("Refresh failed");
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        if (typeof window !== 'undefined') {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  },
);

// Deduplicate GET requests within the same render cycle
const originalGet = api.get;
api.get = function (this: typeof api, url: string, config?: any) {
  const cacheKey = `GET_${url}`;
  
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  const promise = originalGet.call(this, url, config);
  requestCache.set(cacheKey, promise);

  promise.finally(() => {
    setTimeout(() => requestCache.delete(cacheKey), 0);
  });

  return promise;
} as typeof api.get;

export default api;