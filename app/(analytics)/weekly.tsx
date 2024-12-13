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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';

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

  const handlePreviousWeek = () => {
    setSelectedDate(prevDate => subWeeks(prevDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(prevDate => addWeeks(prevDate, 1));
  };

  const handleCurrentWeek = () => {
    setSelectedDate(new Date());
  };

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
                backgroundColor: '#0000ff',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: '#fff' }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, padding: 16 }}>
            {/* Week Selector */}
            <View style={styles.weekSelector}>
              <TouchableOpacity 
                onPress={handlePreviousWeek} 
                style={styles.weekArrowButton}
              >
                <MaterialIcons name="chevron-left" size={28} color="#4CAF50" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleCurrentWeek} 
                style={styles.weekInfoContainer}
              >
                <View style={styles.weekDateContainer}>
                  <Text style={styles.weekDateText}>
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </Text>
                  {format(new Date(), 'MMM d') === format(weekStart, 'MMM d') && (
                    <View style={styles.currentWeekBadge}>
                      <Text style={styles.currentWeekText}>Current Week</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleNextWeek} 
                style={styles.weekArrowButton}
              >
                <MaterialIcons name="chevron-right" size={28} color="#4CAF50" />
              </TouchableOpacity>
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
                <Text style={styles.noDataText}>No expense data available for this week</Text>
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
                    <Text style={[styles.totalAmount, { color: '#2E7D32' }]}>
                      ₱{incomeData.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.noDataText}>No income data available for this week</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  weekArrowButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weekInfoContainer: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDateContainer: {
    alignItems: 'center',
  },
  weekDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  currentWeekBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentWeekText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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
    color: '#C62828',
  },
});
