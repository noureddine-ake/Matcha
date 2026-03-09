<<<<<<< HEAD
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
=======
import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
>>>>>>> 7e7bb46 (feat(auth): fixed build for new changes)

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
<<<<<<< HEAD
  resolve: (value: unknown) => void;
=======
  resolve: (value?: unknown) => void;
>>>>>>> 7e7bb46 (feat(auth): fixed build for new changes)
  reject: (reason?: unknown) => void;
}> = [];

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
<<<<<<< HEAD
  (error: AxiosError): Promise<never> => Promise.reject(error)
=======
  (error: AxiosError) => Promise.reject(error),
>>>>>>> 7e7bb46 (feat(auth): fixed build for new changes)
);

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
<<<<<<< HEAD
  async (error: AxiosError): Promise<unknown> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
=======
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
>>>>>>> 7e7bb46 (feat(auth): fixed build for new changes)

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
        // Use window.location for client-side navigation
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

export default api;