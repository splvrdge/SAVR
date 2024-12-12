import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
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

  const fetchFinancialData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      setUserName(name || '');
      
      if (!token || !userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch financial summary
      try {
        const summaryResponse = await axios.get(
          `${API_URL}${API_ENDPOINTS.FINANCIAL.GET_SUMMARY.replace(':user_id', userId)}`,
          { headers }
        );

        if (summaryResponse.data.success) {
          setFinancialSummary(summaryResponse.data.data);
        } else {
          setFinancialSummary({
            current_balance: 0,
            net_savings: 0,
            total_expenses: 0
          });
        }
      } catch (error) {
        console.error('Error fetching financial summary:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
          router.replace('/(auth)/sign-in');
          return;
        }
        setFinancialSummary({
          current_balance: 0,
          net_savings: 0,
          total_expenses: 0
        });
      }

      // Fetch all transactions
      try {
        const [incomeResponse, expenseResponse] = await Promise.all([
          axios.get(`${API_URL}${API_ENDPOINTS.INCOME.GET_ALL.replace(':user_id', userId)}`, { headers }),
          axios.get(`${API_URL}${API_ENDPOINTS.EXPENSE.GET_ALL.replace(':user_id', userId)}`, { headers })
        ]);

        let allTransactions: Transaction[] = [];

        if (incomeResponse.data.success && incomeResponse.data.data) {
          allTransactions = [...allTransactions, ...incomeResponse.data.data];
        }

        if (expenseResponse.data.success && expenseResponse.data.data) {
          allTransactions = [...allTransactions, ...expenseResponse.data.data];
        }

        // Sort by timestamp and get latest 3
        const sortedTransactions = allTransactions
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3);

        setLatestTransactions(sortedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
          router.replace('/(auth)/sign-in');
          return;
        }
        setLatestTransactions([]);
      }

    } catch (error) {
      console.error('Error in fetchFinancialData:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
        return;
      }
      setFinancialSummary({
        current_balance: 0,
        net_savings: 0,
        total_expenses: 0
      });
      setLatestTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string, type: string) => {
    if (type === 'income') {
      switch (category.toLowerCase()) {
        case 'salary':
          return 'cash';
        case 'business':
          return 'store';
        case 'investment':
          return 'chart-line';
        case 'freelance':
          return 'laptop';
        case 'other':
          return 'dots-horizontal';
        default:
          return 'cash';
      }
    } else {
      switch (category.toLowerCase()) {
        case 'food':
          return 'food';
        case 'transportation':
          return 'car';
        case 'utilities':
          return 'lightning-bolt';
        case 'shopping':
          return 'shopping';
        case 'entertainment':
          return 'movie';
        case 'health':
          return 'medical-bag';
        case 'education':
          return 'school';
        case 'other':
          return 'dots-horizontal';
        default:
          return 'cash';
      }
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

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-customGreen" edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        className="flex-1"
      >
        {/* Header Section */}
        <View className="px-6 pt-4 bg-customGreen pb-12 rounded-b-[40px]">
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-white text-lg opacity-90">Welcome back,</Text>
              <Text className="text-white text-2xl font-bold">
                {userName || 'User'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleProfilePress}
              className="bg-white/20 p-2 rounded-full"
            >
              <MaterialCommunityIcons name="account" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Financial Summary Card */}
          <View className="bg-white p-6 rounded-2xl shadow-lg">
            <View className="mb-6">
              <Text className="text-gray-600 text-base mb-2">Current Balance</Text>
              <Text className="text-3xl font-bold text-customGreen">
                {formatCurrency(financialSummary?.current_balance)}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <View className="bg-green-50 p-4 rounded-xl flex-1 mr-4">
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons name="trending-up" size={20} color="#16A34A" />
                  <Text className="text-gray-600 text-sm ml-2">Net Savings</Text>
                </View>
                <Text className="text-lg font-semibold text-green-600">
                  {formatCurrency(financialSummary?.net_savings)}
                </Text>
              </View>
              <View className="bg-red-50 p-4 rounded-xl flex-1">
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons name="trending-down" size={20} color="#DC2626" />
                  <Text className="text-gray-600 text-sm ml-2">Total Expenses</Text>
                </View>
                <Text className="text-lg font-semibold text-red-500">
                  {formatCurrency(financialSummary?.total_expenses)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View className='bg-white'>
           {/* Quick Actions */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              className="bg-blue-50 p-4 rounded-xl flex-1 mr-4 items-center"
              onPress={() => router.push('/(tabs)/income')}
            >
              <MaterialCommunityIcons name="cash-plus" size={30} color="#2E8B57" />
              <Text className="text-customGreen mt-2 font-medium">View Income</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-red-50 p-4 rounded-xl flex-1 items-center"
              onPress={() => router.push('/(tabs)/expenses')}
            >
              <MaterialCommunityIcons name="cash-minus" size={30} color="#DC2626" />
              <Text className="text-red-600 mt-2 font-medium">View Expenses</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Latest Transactions */}
        <View className="px-6 py-4">
          <Text className="text-lg font-semibold mb-4">Latest Transactions</Text>
          
          {latestTransactions.length > 0 ? (
            latestTransactions.map((transaction, index) => (
              <View key={transaction.id} className="bg-gray-50 p-4 rounded-lg mb-3">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    {/* Transaction Type Indicator */}
                    <View className={`w-8 h-8 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'} items-center justify-center mr-2`}>
                      <MaterialCommunityIcons
                        name={transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}
                        size={20}
                        color={transaction.type === 'income' ? '#16a34a' : '#dc2626'}
                      />
                    </View>
                    {/* Category Icon */}
                    <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-3">
                      <MaterialCommunityIcons
                        name={getCategoryIcon(transaction.category, transaction.type)}
                        size={20}
                        color="#4b5563"
                      />
                    </View>
                    <View>
                      <Text className="text-sm text-gray-500">{capitalizeFirstLetter(transaction.category)}</Text>
                      <Text className="text-xs text-gray-400">
                        {new Date(transaction.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text className={transaction.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="text-gray-500 text-center">No transactions yet</Text>
            </View>
          )}
        </View>

        {/* Additional Features */}
        <View className="px-6 mt-8 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            More Features
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity 
              className="bg-purple-50 p-4 rounded-xl w-[48%] items-center mb-4"
              onPress={() => router.push('/(tabs)/analytics')}
            >
              <MaterialCommunityIcons name="chart-line" size={30} color="#7C3AED" />
              <Text className="text-purple-600 mt-2 font-medium">Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-orange-50 p-4 rounded-xl w-[48%] items-center mb-4"
              onPress={() => router.push('/(tabs)/budget')}
            >
              <MaterialCommunityIcons name="wallet" size={30} color="#EA580C" />
              <Text className="text-orange-600 mt-2 font-medium">Budget</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-cyan-50 p-4 rounded-xl w-[48%] items-center"
              onPress={() => router.push('/(tabs)/goals')}
            >
              <MaterialCommunityIcons name="flag" size={30} color="#0891B2" />
              <Text className="text-cyan-600 mt-2 font-medium">Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-pink-50 p-4 rounded-xl w-[48%] items-center"
              onPress={() => router.push('/(tabs)/reports')}
            >
              <MaterialCommunityIcons name="file-document" size={30} color="#DB2777" />
              <Text className="text-pink-600 mt-2 font-medium">Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
