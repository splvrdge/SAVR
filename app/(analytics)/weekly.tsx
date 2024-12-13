import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';
import { API_ENDPOINTS, API_ERRORS } from '@/constants/API';
import axiosInstance from '@/utils/axiosConfig';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface CategoryData {
  category: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export default function WeeklyAnalytics() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenseData, setExpenseData] = useState<CategoryData[]>([]);
  const [incomeData, setIncomeData] = useState<CategoryData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const [expenseResponse, incomeResponse] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.ANALYTICS.EXPENSES.replace(':user_id', userId), {
          params: {
            timeframe: 'week',
            date: formattedDate
          }
        }),
        axiosInstance.get(API_ENDPOINTS.ANALYTICS.INCOME.replace(':user_id', userId), {
          params: {
            timeframe: 'week',
            date: formattedDate
          }
        })
      ]);

      if (expenseResponse.data.success && incomeResponse.data.success) {
        setExpenseData(expenseResponse.data.data);
        setIncomeData(incomeResponse.data.data);
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.error || API_ERRORS.NETWORK_ERROR);
      Alert.alert('Error', 'Failed to fetch analytics data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [router, selectedDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  const generateChartData = (data: CategoryData[]) => {
    return data.map((item, index) => ({
      name: item.category,
      amount: item.total_amount,
      percentage: item.percentage,
      color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
      >
        {error ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>
            <TouchableOpacity
              onPress={onRefresh}
              style={{
                backgroundColor: '#0000ff',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: '#fff' }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
              Weekly Analytics
            </Text>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Expenses
              </Text>
              {expenseData.length > 0 ? (
                <PieChart
                  data={generateChartData(expenseData)}
                  width={width - 32}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <Text>No expense data available for this week</Text>
              )}
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Income
              </Text>
              {incomeData.length > 0 ? (
                <PieChart
                  data={generateChartData(incomeData)}
                  width={width - 32}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <Text>No income data available for this week</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
