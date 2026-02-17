import axios from 'axios';
import { config } from '../shared/config';
import { useAuthStore } from '../shared/authStore';

export const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
});

// attach access token from store to requests
api.interceptors.request.use((cfg) => {
  try {
    const token = useAuthStore.getState().accessToken;
    if (token && cfg.headers) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return cfg;
});
 
 let isRefreshing = false;
 let failedQueue: Array<{ resolve: (v?: any) => void; reject: (e: any) => void; config: any }> = [];
 
 const processQueue = (error: any, token: string | null = null) => {
   failedQueue.forEach((p) => {
     if (error) p.reject(error);
     else p.resolve(token);
   });
   failedQueue = [];
 };
 
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const originalRequest = err.config;
    const requestUrl = String(originalRequest?.url ?? '');
    const isRefreshRequest = requestUrl.includes('/auth/refresh');

    if (err.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        })
          .then((token) => {
             originalRequest.headers.Authorization = `Bearer ${token}`;
             return api(originalRequest);
           })
           .catch((e) => Promise.reject(e));
       }
 
       originalRequest._retry = true;
       isRefreshing = true;
 
       try {
         const res = await api.post('/auth/refresh');
         const newToken = res.data.accessToken;
         useAuthStore.getState().setAccessToken(newToken);
         processQueue(null, newToken);
         originalRequest.headers.Authorization = `Bearer ${newToken}`;
         return api(originalRequest);
       } catch (e) {
         processQueue(e, null);
         useAuthStore.getState().setAccessToken(null);
         useAuthStore.getState().setUser(null);
         return Promise.reject(e);
       } finally {
         isRefreshing = false;
       }
     }
 
     return Promise.reject(err);
   }
 );
