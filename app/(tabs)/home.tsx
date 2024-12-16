import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { API_URL, API_ENDPOINTS } from '@/constants/API';
import axiosInstance from "@/utils/axiosConfig";
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FinancialSummary {
  current_balance: number;
  net_savings: number;
  total_expenses: number;
}

interface Transaction {
  id: number;
  amount: number;
  description: string;
  category: string;
  timestamp: string;
  type: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [latestTransactions, setLatestTransactions] = useState<Transaction[]>([]);
  const [userName, setUserName] = useState<string>('');
  const router = useRouter();

  // Income Categories
  const incomeCategories = {
    salary: { name: 'Salary', icon: 'cash-multiple' },
    business: { name: 'Business', icon: 'store-outline' },
    investment: { name: 'Investment', icon: 'trending-up' },
    freelance: { name: 'Freelance', icon: 'laptop' },
    gift: { name: 'Gift', icon: 'gift-outline' },
    other: { name: 'Other', icon: 'dots-horizontal' }
  };

  // Expense Categories
  const expenseCategories = {
    food: { name: 'Food & Dining', icon: 'food-fork-drink' },
    transport: { name: 'Transportation', icon: 'car-outline' },
    utilities: { name: 'Utilities', icon: 'lightning-bolt-outline' },
    shopping: { name: 'Shopping', icon: 'shopping-outline' },
    entertainment: { name: 'Entertainment', icon: 'gamepad-variant-outline' },
    health: { name: 'Healthcare', icon: 'hospital-box-outline' },
    other: { name: 'Other', icon: 'dots-horizontal' }
  };

  const getCategoryIcon = (category: string, type: 'income' | 'expense') => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    return categories[category]?.icon || 'help-circle-outline';
  };

  const fetchFinancialData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      setUserName(name || '');
      
      if (!userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      try {
        // Fetch financial summary and transactions in parallel
        const [summaryResponse, incomeResponse, expenseResponse] = await Promise.all([
          axiosInstance.get(API_ENDPOINTS.FINANCIAL.GET_SUMMARY.replace(':user_id', userId)),
          axiosInstance.get(API_ENDPOINTS.INCOME.GET_ALL.replace(':user_id', userId)),
          axiosInstance.get(API_ENDPOINTS.EXPENSE.GET_ALL.replace(':user_id', userId))
        ]);

        console.log('Income response:', incomeResponse.data);
        console.log('Expense response:', expenseResponse.data);

        let latestTransactions: Transaction[] = [];

        if (incomeResponse.data.success && incomeResponse.data.data) {
          latestTransactions = [
            ...latestTransactions,
            ...incomeResponse.data.data.map((income: any) => ({
              id: income.income_id,
              amount: parseFloat(income.amount),
              description: income.description,
              category: income.category,
              timestamp: income.timestamp,
              type: 'income'
            }))
          ];
        }

        if (expenseResponse.data.success && expenseResponse.data.data) {
          latestTransactions = [
            ...latestTransactions,
            ...expenseResponse.data.data.map((expense: any) => ({
              id: expense.expense_id,
              amount: parseFloat(expense.amount),
              description: expense.description,
              category: expense.category,
              timestamp: expense.timestamp,
              type: 'expense'
            }))
          ];
        }

        // Sort transactions by date and get latest 5
        latestTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLatestTransactions(latestTransactions.slice(0, 5));

        // Set financial summary from backend
        if (summaryResponse.data.success && summaryResponse.data.data) {
          setFinancialSummary({
            current_balance: parseFloat(summaryResponse.data.data.current_balance),
            net_savings: parseFloat(summaryResponse.data.data.net_savings),
            total_expenses: parseFloat(summaryResponse.data.data.total_expenses)
          });
        } else {
          throw new Error('Failed to fetch financial summary');
        }

      } catch (error: any) {
        console.error('Error fetching data:', error.response?.data || error.message);
        // Set default values on error
        setFinancialSummary({
          current_balance: 0,
          net_savings: 0,
          total_expenses: 0
        });
        setLatestTransactions([]);
      }

    } catch (error: any) {
      console.error('Error in fetchFinancialData:', error);
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchFinancialData();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinancialData();
    setRefreshing(false);
  };

  const formatCurrency = (value?: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(value || 0);
  };

  const handleProfilePress = () => {
    router.push('/(profile)/profile');
  };

  const testFinancialEndpoints = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');
      
      console.log('Testing with:', {
        userId,
        tokenExists: !!token,
        summaryUrl: `${API_URL}${API_ENDPOINTS.FINANCIAL.GET_SUMMARY.replace(':user_id', userId || '')}`,
        historyUrl: `${API_URL}${API_ENDPOINTS.FINANCIAL.GET_HISTORY.replace(':user_id', userId || '')}`
      });

      // Test direct axios call to summary endpoint
      try {
        const summaryResponse = await axios.get(
          `${API_URL}${API_ENDPOINTS.FINANCIAL.GET_SUMMARY.replace(':user_id', userId || '')}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Direct summary response:', summaryResponse.data);
      } catch (error: any) {
        console.error('Summary error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }

      // Test direct axios call to history endpoint
      try {
        const historyResponse = await axios.get(
          `${API_URL}${API_ENDPOINTS.FINANCIAL.GET_HISTORY.replace(':user_id', userId || '')}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Direct history response:', historyResponse.data);
      } catch (error: any) {
        console.error('History error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
    } catch (error) {
      console.error('Test function error:', error);
    }
  };

  useEffect(() => {
    testFinancialEndpoints();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar backgroundColor="transparent" style="dark" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        className="flex-1"
      >
        {/* Header Section */}
        <View className="px-6 pt-4">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-gray-800 text-2xl font-bold mb-1">
                {userName ? `Hi, ${userName.split(' ')[0]} 👋` : 'Welcome 👋'}
              </Text>
              <Text className="text-gray-500 text-base">Let's manage your finances</Text>
            </View>
            <TouchableOpacity 
              onPress={handleProfilePress}
              className="bg-gray-100 p-2.5 rounded-xl"
            >
              <MaterialCommunityIcons name="account" size={24} color="#1f2937" />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View className="bg-blue-600 p-6 rounded-[24px] mb-6 shadow-2xl">
            <Text className="text-white/80 text-sm font-medium mb-2">Total Balance</Text>
            <Text className="text-white text-3xl font-bold mb-4">
              {formatCurrency(financialSummary?.current_balance)}
            </Text>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="bg-white/20 p-2 rounded-full mr-3">
                  <MaterialCommunityIcons name="trending-up" size={16} color="#fff" />
                </View>
                <View>
                  <Text className="text-white/60 text-xs">Net Savings</Text>
                  <Text className="text-white font-semibold text-2xl">
                    {formatCurrency(financialSummary?.net_savings)}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="bg-white/20 p-2 rounded-full mr-3">
                  <MaterialCommunityIcons name="trending-down" size={16} color="#fff" />
                </View>
                <View>
                  <Text className="text-white/60 text-xs">Total Expenses</Text>
                  <Text className="text-white font-semibold text-2xl">
                    {formatCurrency(financialSummary?.total_expenses)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-8">
            <Text className="text-lg font-bold text-gray-800 mb-4">Quick Actions</Text>
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/income')}
                className="flex-1 flex-row items-center justify-center bg-blue-50 py-4 rounded-2xl mr-3"
              >
                <MaterialCommunityIcons name="cash-plus" size={20} color="#2563eb" style={{ marginRight: 8 }} />
                <Text className="text-blue-600 font-medium">Add Income</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/expenses')}
                className="flex-1 flex-row items-center justify-center bg-red-50 py-4 rounded-2xl"
              >
                <MaterialCommunityIcons name="cash-minus" size={20} color="#dc2626" style={{ marginRight: 8 }} />
                <Text className="text-red-600 font-medium">Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Transactions */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">Recent Activity</Text>
              <TouchableOpacity>
                <Text className="text-blue-600 text-sm font-medium">See All</Text>
              </TouchableOpacity>
            </View>
            
            {latestTransactions.length > 0 ? (
              latestTransactions.map((transaction, index) => (
                <TouchableOpacity 
                  key={`transaction-${transaction.id}-${index}`} 
                  className="flex-row justify-between items-center mb-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100"
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        transaction.type === 'income' ? 'bg-blue-100' : 'bg-gray-200'
                      }`}
                    >
                      <MaterialCommunityIcons
                        name={getCategoryIcon(transaction.category, transaction.type)}
                        size={20}
                        color={transaction.type === 'income' ? '#2563eb' : '#1f2937'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-800">
                        {transaction.description || capitalizeFirstLetter(transaction.category)}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        {new Date(transaction.timestamp).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text
                      className={`font-bold text-right ${
                        transaction.type === 'income' ? 'text-blue-600' : 'text-gray-800'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                    <Text className="text-xs text-gray-500 text-right mt-0.5">
                      {capitalizeFirstLetter(transaction.category)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center py-8 bg-gray-50 rounded-2xl">
                <View className="bg-gray-100 p-4 rounded-full mb-3">
                  <MaterialCommunityIcons name="currency-usd-off" size={24} color="#9ca3af" />
                </View>
                <Text className="text-gray-800 font-medium mb-1">No Transactions Yet</Text>
                <Text className="text-gray-500 text-sm text-center">
                  Start tracking your income and expenses
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}