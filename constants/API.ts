// Base URL for the API
export const API_URL = 'https://savr-backend.onrender.com';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_URL}/api/auth/login`,
    SIGNUP: `${API_URL}/api/auth/signup`,
    CHECK_EMAIL: `${API_URL}/api/auth/check-email`,
    REFRESH_TOKEN: `${API_URL}/api/auth/refresh-token`,
  },

  // Income endpoints
  INCOME: {
    ADD: `${API_URL}/api/income/add`,
    GET_ALL: `${API_URL}/api/income/:user_id`,
    UPDATE: `${API_URL}/api/income/update/:income_id`,
    DELETE: `${API_URL}/api/income/delete/:income_id`,
    CATEGORIES: `${API_URL}/api/income/categories`,
  },

  // Expense endpoints
  EXPENSE: {
    ADD: `${API_URL}/api/expense/add`,
    GET_ALL: `${API_URL}/api/expense/:user_id`,
    UPDATE: `${API_URL}/api/expense/update/:expense_id`,
    DELETE: `${API_URL}/api/expense/delete/:expense_id`,
    CATEGORIES: `${API_URL}/api/expense/categories`,
  },

  // Financial endpoints
  FINANCIAL: {
    GET_SUMMARY: `${API_URL}/api/financial/summary/:user_id`,
    GET_HISTORY: `${API_URL}/api/financial/history/:user_id`,
  },

  // Goals endpoints
  GOALS: {
    ADD: `${API_URL}/api/goals/add`,
    GET_ALL: `${API_URL}/api/goals/:user_id`,
    UPDATE: `${API_URL}/api/goals/update/:goal_id`,
    DELETE: `${API_URL}/api/goals/delete/:goal_id`,
    ADD_CONTRIBUTION: `${API_URL}/api/goals/contribution/add`,
    GET_CONTRIBUTIONS: `${API_URL}/api/goals/contributions/:goal_id`,
    DELETE_CONTRIBUTION: `${API_URL}/api/goals/contribution/:contribution_id`
  },

  // Analytics endpoints
  ANALYTICS: {
    EXPENSES: `${API_URL}/api/analytics/expenses/:user_id`,
    INCOME: `${API_URL}/api/analytics/income/:user_id`,
    TRENDS: `${API_URL}/api/analytics/trends/:user_id`,
  },

  // User endpoints
  USER: {
    UPDATE_PROFILE: `${API_URL}/api/user/profile`,
    GET_PROFILE: `${API_URL}/api/user/profile/:user_id`,
  },

  // Category endpoints
  CATEGORY: {
    GET_ALL: `${API_URL}/api/category/all`,
    GET_BY_TYPE: `${API_URL}/api/category/:type`,
    ADD: `${API_URL}/api/category/add`,
    UPDATE: `${API_URL}/api/category/update/:category_id`,
    DELETE: `${API_URL}/api/category/delete/:category_id`,
  },
};

// Common Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth Types
export interface AuthResponse extends APIResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    user_id: number;
    user_name: string;
    user_email: string;
  };
}

export interface LoginRequest {
  user_email: string;
  user_password: string;
}

export interface SignupRequest {
  user_name: string;
  user_email: string;
  user_password: string;
}

export interface CheckEmailRequest {
  user_email: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Income Types
export interface Income {
  income_id: number;
  user_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface AddIncomeRequest {
  user_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

// Expense Types
export interface Expense {
  expense_id: number;
  user_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface AddExpenseRequest {
  user_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

// Goal Types
export interface Goal {
  goal_id: number;
  user_id: number;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  is_completed: boolean;
  target_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface AddGoalRequest {
  title: string;
  description?: string;
  target_amount: number;
  target_date: string;
}

// GoalContribution Types
export interface GoalContribution {
  contribution_id: number;
  goal_id: number;
  amount: number;
  date: string;
}

// Financial Summary Types
export interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  savings: number;
  expense_categories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  income_categories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

// Analytics Types
export interface ExpenseAnalytics {
  daily_expenses: {
    date: string;
    amount: number;
  }[];
  category_breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

export interface IncomeAnalytics {
  monthly_income: {
    month: string;
    amount: number;
  }[];
  category_breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

export interface TrendAnalytics {
  savings_trend: {
    month: string;
    savings: number;
    income: number;
    expenses: number;
  }[];
  goal_progress: {
    goal_id: number;
    title: string;
    progress_percentage: number;
    remaining_days: number;
  }[];
}

// API Error Messages
export const API_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};
