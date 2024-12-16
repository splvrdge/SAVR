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
import { format, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenseData, setExpenseData] = useState<CategoryData[]>([]);
  const [incomeData, setIncomeData] = useState<CategoryData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);

  const handlePreviousYear = () => {
    setSelectedDate(prevDate => subYears(prevDate, 1));
  };

  const handleNextYear = () => {
    setSelectedDate(prevDate => addYears(prevDate, 1));
  };

  const handleCurrentYear = () => {
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
            timeframe: 'year',
            date: formattedDate
          }
        }),
        axiosInstance.get(API_ENDPOINTS.ANALYTICS.INCOME.replace(':user_id', userId), {
          params: {
            timeframe: 'year',
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

  const getTotalAmount = (data: CategoryData[]) => {
    return data.reduce((sum, item) => sum + item.total_amount, 0);
  };

  const getTopCategory = (data: CategoryData[]) => {
    if (data.length === 0) return null;
    return data.reduce((prev, current) => 
      current.total_amount > prev.total_amount ? current : prev
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
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
      ? ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF']  // Blue shades
      : ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#FEF2F2']; // Red shades

    return data.map((item, index) => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      amount: item.total_amount,
      percentage: item.percentage,
      color: colors[index % colors.length],
      legendFontColor: '#666666',
      legendFontSize: 12,
    }));
  };

  const totalIncome = getTotalAmount(incomeData);
  const totalExpenses = getTotalAmount(expenseData);
  const topIncomeCategory = getTopCategory(incomeData);
  const topExpenseCategory = getTopCategory(expenseData);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Year Selector */}
          <View style={styles.yearSelector}>
            <TouchableOpacity 
              onPress={handlePreviousYear} 
              style={styles.yearArrowButton}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color="#3B82F6" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleCurrentYear} 
              style={styles.yearInfoContainer}
            >
              <Text style={styles.yearDateText}>
                {format(yearStart, 'yyyy')}
              </Text>
              {format(new Date(), 'yyyy') === format(yearStart, 'yyyy') && (
                <View style={styles.currentYearBadge}>
                  <Text style={styles.currentYearText}>Current Year</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleNextYear} 
              style={styles.yearArrowButton}
            >
              <MaterialCommunityIcons name="chevron-right" size={28} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, styles.incomeCard]}>
              <View style={styles.summaryHeader}>
                <MaterialCommunityIcons name="trending-up" size={24} color="#3B82F6" />
                <Text style={styles.summaryTitle}>Total Income</Text>
              </View>
              <Text style={[styles.summaryAmount, styles.incomeAmount]}>₱{totalIncome.toFixed(2)}</Text>
              {topIncomeCategory && (
                <Text style={styles.summarySubtext}>
                  Top: {topIncomeCategory.category} (₱{topIncomeCategory.total_amount.toFixed(2)})
                </Text>
              )}
            </View>

            <View style={[styles.summaryCard, styles.expenseCard]}>
              <View style={styles.summaryHeader}>
                <MaterialCommunityIcons name="trending-down" size={24} color="#EF4444" />
                <Text style={styles.summaryTitle}>Total Expenses</Text>
              </View>
              <Text style={[styles.summaryAmount, styles.expenseAmount]}>₱{totalExpenses.toFixed(2)}</Text>
              {topExpenseCategory && (
                <Text style={styles.summarySubtext}>
                  Top: {topExpenseCategory.category} (₱{topExpenseCategory.total_amount.toFixed(2)})
                </Text>
              )}
            </View>
          </View>

          {/* Charts */}
          {expenseData.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Expense Breakdown</Text>
              <PieChart
                data={generateChartData(expenseData, 'expense')}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
              />
              <View style={styles.categoryList}>
                {expenseData.map((item, index) => (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <View 
                        style={[
                          styles.categoryDot, 
                          { backgroundColor: generateChartData(expenseData, 'expense')[index].color }
                        ]} 
                      />
                      <Text style={styles.categoryName}>{item.category}</Text>
                    </View>
                    <Text style={styles.categoryAmount}>₱{item.total_amount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {incomeData.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Income Breakdown</Text>
              <PieChart
                data={generateChartData(incomeData, 'income')}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
              />
              <View style={styles.categoryList}>
                {incomeData.map((item, index) => (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <View 
                        style={[
                          styles.categoryDot, 
                          { backgroundColor: generateChartData(incomeData, 'income')[index].color }
                        ]} 
                      />
                      <Text style={styles.categoryName}>{item.category}</Text>
                    </View>
                    <Text style={styles.categoryAmount}>₱{item.total_amount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  yearArrowButton: {
    padding: 8,
  },
  yearInfoContainer: {
    alignItems: 'center',
  },
  yearDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  currentYearBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  currentYearText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666666',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  incomeAmount: {
    color: '#3B82F6',
  },
  expenseAmount: {
    color: '#EF4444',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#666666',
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  categoryList: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    fontSize: 14,
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#666666',
  },
});
