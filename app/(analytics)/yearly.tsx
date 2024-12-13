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

interface CategoryData {
  category: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export default function YearlyAnalytics() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expenseData, setExpenseData] = useState<CategoryData[]>([]);
  const [incomeData, setIncomeData] = useState<CategoryData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generate a list of years (current year and 4 previous years)
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - i);

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const [expenseResponse, incomeResponse] = await Promise.all([
        axiosInstance.get(
          `${API_ENDPOINTS.ANALYTICS.EXPENSES.replace(':user_id', userId)}?year=${String(selectedYear).padStart(4, '0')}&timeframe=year`
        ),
        axiosInstance.get(
          `${API_ENDPOINTS.ANALYTICS.INCOME.replace(':user_id', userId)}?year=${String(selectedYear).padStart(4, '0')}&timeframe=year`
        ),
      ]);

      if (expenseResponse.data.success) {
        setExpenseData(expenseResponse.data.data);
      } else {
        setError(expenseResponse.data.message || API_ERRORS.SERVER_ERROR);
      }
      
      if (incomeResponse.data.success) {
        setIncomeData(incomeResponse.data.data);
      } else {
        setError(incomeResponse.data.message || API_ERRORS.SERVER_ERROR);
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId']);
        router.replace('/(auth)/sign-in');
      } else {
        setError(error.response?.data?.message || API_ERRORS.SERVER_ERROR);
        Alert.alert('Error', 'Failed to fetch analytics data. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [router, selectedYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const expenseChartData = expenseData.map((item, index) => ({
    name: item.category,
    amount: item.total_amount,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  const incomeChartData = incomeData.map((item, index) => ({
    name: item.category,
    amount: item.total_amount,
    color: `hsl(${(index * 137.5 + 60) % 360}, 70%, 50%)`,
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={{
            backgroundColor: '#007AFF',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
      >
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Select Year
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                onPress={() => setSelectedYear(year)}
                style={{
                  padding: 10,
                  marginRight: 10,
                  backgroundColor: year === selectedYear ? '#007AFF' : '#F0F0F0',
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: year === selectedYear ? '#FFFFFF' : '#000000',
                  }}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Expense Distribution
          </Text>
          {expenseData.length > 0 ? (
            <PieChart
              data={expenseChartData}
              width={width - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={{ textAlign: 'center', color: '#666' }}>
              No expense data available for the selected year
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Income Distribution
          </Text>
          {incomeData.length > 0 ? (
            <PieChart
              data={incomeChartData}
              width={width - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={{ textAlign: 'center', color: '#666' }}>
              No income data available for the selected year
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
