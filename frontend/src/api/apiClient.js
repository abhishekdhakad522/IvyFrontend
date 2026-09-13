import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  const token = localStorage.getItem('access_token');

  if (error.response?.status === 401 && token && !originalRequest._retry) {
    if (isRefreshing) {
      return new Promise(function(resolve, reject) {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const refreshUrl = localStorage.getItem('refresh_url');

      if (!refreshToken || !refreshUrl) {
        throw new Error('No refresh token available');
      }

      // Use a new axios instance for refresh to avoid interceptor loops
      const refreshAxios = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      });

      const refreshResponse = await refreshAxios.post(refreshUrl, {
        refresh_token: refreshToken
      });

      const refreshData = refreshResponse.data;

      localStorage.setItem('access_token', refreshData.access_token);
      if (refreshData.refresh_token) {
        localStorage.setItem('refresh_token', refreshData.refresh_token);
      }
      if (refreshData.refresh_url) {
        localStorage.setItem('refresh_url', refreshData.refresh_url);
      }

      processQueue(null, refreshData.access_token);
      isRefreshing = false;

      originalRequest.headers['Authorization'] = `Bearer ${refreshData.access_token}`;
      return apiClient(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError, null);
      isRefreshing = false;
      
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('refresh_url');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
});
