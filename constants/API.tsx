// Base URL for the API
export const API_URL = 'https://savr-backend.onrender.com';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    CHECK_EMAIL: '/api/auth/check-email',
    REFRESH_TOKEN: '/api/auth/refresh-token',
  },

  // Income endpoints
  INCOME: {
    ADD: '/api/income/add',
    GET_ALL: '/api/income/:user_id',
    UPDATE: '/api/income/update',
    DELETE: '/api/income/delete/:income_id',
  },

  // Expense endpoints
  EXPENSE: {
    ADD: '/api/expense/add',
    GET_ALL: '/api/expense/:user_id',
    UPDATE: '/api/expense/update',
    DELETE: '/api/expense/delete/:expense_id',
  },

  // Financial endpoints
  FINANCIAL: {
    GET_SUMMARY: '/api/financial/summary/:user_id',
    GET_HISTORY: '/api/financial/history/:user_id',
  },

  // User endpoints
  USER: {
    UPDATE_PROFILE: '/api/users/:userId',
    GET_PROFILE: '/api/users/:userId',
  },
};

// API Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// API Error Messages
export const API_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};
