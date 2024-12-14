import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/API';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }

      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('No refresh token found');
        return config;
      }

      try {
        const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
          refreshToken
        });
        
        if (response.data.success) {
          const { accessToken } = response.data;
          await AsyncStorage.setItem('token', accessToken);
          config.headers.Authorization = `Bearer ${accessToken}`;
        } else {
          console.error('Token refresh failed:', response.data);
          // Clear tokens if refresh failed
          await AsyncStorage.multiRemove(['token', 'refreshToken']);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError.response?.data || refreshError.message);
        // Clear tokens on refresh error
        await AsyncStorage.multiRemove(['token', 'refreshToken']);
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token and we haven't tried to refresh yet
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
          refreshToken
        });

        if (response.data.success) {
          const { accessToken } = response.data;
          await AsyncStorage.setItem('token', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'userId', 'userName', 'userEmail']);
        throw new Error('Session expired. Please sign in again.');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
