import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_ENDPOINTS } from '@/constants/API';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${API_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          { refreshToken }
        );

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await AsyncStorage.setItem('token', accessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'userId', 'userName', 'userEmail']);
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
