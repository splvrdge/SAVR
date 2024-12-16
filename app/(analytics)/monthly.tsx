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
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';
import { API_ENDPOINTS, API_ERRORS } from '@/constants/API';
import axiosInstance from '@/utils/axiosConfig';
import { format, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';

interface CategoryData {
  category: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export default function MonthlyAnalytics() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenseData, setExpenseData] = useState<CategoryData[]>([]);
  const [incomeData, setIncomeData] = useState<CategoryData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);
  const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const formattedDate = format(selectedDate, 'yyyy-MM');
      const [expenseResponse, incomeResponse] = await Promise.all([
        axiosInstance.get(
          `${API_ENDPOINTS.ANALYTICS.EXPENSES.replace(':user_id', userId)}?date=${encodeURIComponent(formattedDate)}&timeframe=month`
        ),
        axiosInstance.get(
          `${API_ENDPOINTS.ANALYTICS.INCOME.replace(':user_id', userId)}?date=${encodeURIComponent(formattedDate)}&timeframe=month`
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
  }, [router, selectedDate]);

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

  const generateChartData = (data: CategoryData[], type: 'income' | 'expense') => {
    const colors = type === 'income' 
      ? ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800']  // Green complementary
      : ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3']; // Red complementary

    return data.map((item, index) => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      amount: item.total_amount,
      percentage: item.percentage,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {error ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>
            <TouchableOpacity
              onPress={onRefresh}
              style={{
                backgroundColor: '#4CAF50',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: '#fff' }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, padding: 16 }}>
            <View style={styles.monthSelector}>
              <Text style={styles.sectionTitle}>Select Month</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {monthsInYear.map((month) => (
                  <TouchableOpacity
                    key={month.toISOString()}
                    onPress={() => setSelectedDate(month)}
                    style={[
                      styles.monthButton,
                      format(month, 'yyyy-MM') === format(selectedDate, 'yyyy-MM') && styles.selectedMonth
                    ]}
                  >
                    <Text style={[
                      styles.monthText,
                      format(month, 'yyyy-MM') === format(selectedDate, 'yyyy-MM') && styles.selectedMonthText
                    ]}>
                      {format(month, 'MMMM')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Expenses</Text>
              {expenseData.length > 0 ? (
                <>
                  <PieChart
                    data={generateChartData(expenseData, 'expense')}
                    width={width - 32}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Expenses:</Text>
                    <Text style={styles.totalAmount}>
                      ₱{expenseData.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.noDataText}>No expense data available for this month</Text>
              )}
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Income</Text>
              {incomeData.length > 0 ? (
                <>
                  <PieChart
                    data={generateChartData(incomeData, 'income')}
                    width={width - 32}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Income:</Text>
                    <Text style={[styles.totalAmount, { color: '#4CAF50' }]}>
                      ₱{incomeData.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.noDataText}>No income data available for this month</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  monthSelector: {
    marginBottom: 24,
  },
  monthButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  selectedMonth: {
    backgroundColor: '#7C3AED',
  },
  monthText: {
    fontSize: 14,
    color: '#000000',
  },
  selectedMonthText: {
    color: '#FFFFFF',
  },
  chartContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
});
