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
            <Text style={styles.title}>Weekly Analytics</Text>

            {/* Week Selector */}
            <View style={styles.weekSelector}>
              <TouchableOpacity onPress={handlePreviousWeek} style={styles.weekButton}>
                <MaterialIcons name="chevron-left" size={24} color="#000" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleCurrentWeek} style={styles.weekInfo}>
                <Text style={styles.weekText}>
                  {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </Text>
                <Text style={styles.currentWeekText}>
                  {format(new Date(), 'MMM d') === format(weekStart, 'MMM d')
                    ? '(Current Week)'
                    : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNextWeek} style={styles.weekButton}>
                <MaterialIcons name="chevron-right" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Expenses</Text>
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
                <Text style={styles.noDataText}>No expense data available for this week</Text>
              )}
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Income</Text>
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
                <Text style={styles.noDataText}>No income data available for this week</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
  },
  weekButton: {
    padding: 8,
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentWeekText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
});
