import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types
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

export interface GoalContribution {
  contribution_id: number;
  goal_id: number;
  amount: number;
  date: string;
  notes?: string;
}

// API Functions
export const getAllGoals = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.GOALS.GET_ALL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createGoal = async (goalData: {
  title: string;
  description?: string;
  target_amount: number;
  target_date: string;
}) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.GOALS.ADD, goalData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateGoal = async (
  goalId: number,
  goalData: {
    title?: string;
    description?: string;
    target_amount?: number;
    target_date?: string;
  }
) => {
  try {
    const response = await axiosInstance.put(
      API_ENDPOINTS.GOALS.UPDATE.replace(':goal_id', goalId.toString()),
      goalData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteGoal = async (goalId: number) => {
  try {
    const response = await axiosInstance.delete(
      API_ENDPOINTS.GOALS.DELETE.replace(':goal_id', goalId.toString())
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addContribution = async (
  goalId: number,
  contributionData: {
    amount: number;
    notes?: string;
  }
) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.GOALS.ADD_CONTRIBUTION, {
      goal_id: goalId,
      ...contributionData,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getContributions = async (goalId: number) => {
  try {
    const response = await axiosInstance.get(
      API_ENDPOINTS.GOALS.GET_CONTRIBUTIONS.replace(':goal_id', goalId.toString())
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
