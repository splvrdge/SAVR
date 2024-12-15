import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../constants/API';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  USER_NAME: 'userName'
};

class TokenManager {
  private static instance: TokenManager;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  private processQueue(error: any = null, token: string | null = null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token!);
      }
    });
    this.failedQueue = [];
  }

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  }

  async getUserId(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEYS.USER_ID);
  }

  async getUserName(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEYS.USER_NAME);
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      [TOKEN_KEYS.ACCESS_TOKEN, accessToken],
      [TOKEN_KEYS.REFRESH_TOKEN, refreshToken],
    ]);
  }

  async setUserInfo(userId: string, userName: string): Promise<void> {
    await AsyncStorage.multiSet([
      [TOKEN_KEYS.USER_ID, userId],
      [TOKEN_KEYS.USER_NAME, userName],
    ]);
  }

  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([
      TOKEN_KEYS.ACCESS_TOKEN,
      TOKEN_KEYS.REFRESH_TOKEN,
      TOKEN_KEYS.USER_ID,
      TOKEN_KEYS.USER_NAME,
    ]);
  }

  async refreshTokens(): Promise<string> {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
        refresh_token: refreshToken
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await this.setTokens(accessToken, newRefreshToken);
        return accessToken;
      } else {
        throw new Error(response.data.message || 'Failed to refresh token');
      }
    } catch (error) {
      await this.clearTokens();
      throw error;
    }
  }

  async handleTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const newToken = await this.refreshTokens();
      this.processQueue(null, newToken);
      return newToken;
    } catch (error) {
      this.processQueue(error, null);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }
}

export default TokenManager.getInstance();
