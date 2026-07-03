import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚙️ DESARROLLO LOCAL: Cambiá esta IP cuando estés en otro Wi-Fi.
// ⚙️ PRODUCCIÓN: Define EXPO_PUBLIC_API_URL en tu archivo .env
const LOCAL_IP = '192.168.0.21';
const LOCAL_PORT = '3000';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  `http://${LOCAL_IP}:${LOCAL_PORT}`;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// ─── Token helpers ───────────────────────────────────────────────

async function getStoredTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync('userToken'),
    SecureStore.getItemAsync('refreshToken'),
  ]);
  return { accessToken, refreshToken };
}

async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync('userToken', accessToken),
    SecureStore.setItemAsync('refreshToken', refreshToken),
  ]);
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync('userToken'),
    SecureStore.deleteItemAsync('refreshToken'),
    SecureStore.deleteItemAsync('userRole'),
  ]);
  delete api.defaults.headers.common['Authorization'];
}

// ─── Interceptor: attach token on every request ──────────────────

api.interceptors.request.use(async (config) => {
  // Only attach if not already set (avoids overwriting a fresh token)
  if (!config.headers['Authorization']) {
    const { accessToken } = await getStoredTokens();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }
  return config;
});

// ─── Interceptor: refresh on 401 ─────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 and avoid infinite loops
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = await getStoredTokens();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token;

      await saveTokens(newAccessToken, newRefreshToken);

      // Retry the original request with the new token
      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearSession();
      // Don't redirect here — let each screen handle navigation if needed.
      // The caller will still get a 401-like rejection so they can redirect.
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

