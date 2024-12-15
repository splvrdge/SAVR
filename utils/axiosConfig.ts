import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_ENDPOINTS } from '@/constants/API';
import { router } from 'expo-router';
import { Alert } from 'react-native';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout for slow render.com startup
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    if (error.message === 'Network Error' || !error.response) {
      Alert.alert(
        'Connection Error',
        'The server is taking longer than usual to respond. This might happen when the server is starting up. Please try again in a few seconds.'
      );
    }
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.message === 'Network Error' || !error.response) {
      Alert.alert(
        'Connection Error',
        'The server is taking longer than usual to respond. This might happen when the server is starting up. Please try again in a few seconds.'
      );
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId', 'userName']);
          router.replace('/(auth)/sign-in');
          throw new Error('No refresh token found');
        }

        const response = await axios.post(`${API_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
          refresh_token: refreshToken // Changed from refreshToken to refresh_token to match backend
        }, {
          timeout: 30000 // 30 second timeout for refresh token request
        });

        if (response.data.success) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
          await AsyncStorage.multiSet([
            ['accessToken', newAccessToken],
            ['refreshToken', newRefreshToken]
          ]);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } else {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId', 'userName']);
          router.replace('/(auth)/sign-in');
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        if (refreshError.message === 'Network Error' || !refreshError.response) {
          Alert.alert(
            'Connection Error',
            'The server is taking longer than usual to respond. This might happen when the server is starting up. Please try again in a few seconds.'
          );
        } else {
          console.error('Error refreshing token:', refreshError.response?.data || refreshError.message);
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId', 'userName']);
          router.replace('/(auth)/sign-in');
        }
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
