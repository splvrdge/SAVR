import { useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '@/utils/axiosConfig'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_ENDPOINTS } from '@/constants/API';
import { StatusBar } from 'expo-status-bar';
import TabHeader from '../../components/TabHeader';
import AddButton from '../../components/AddButton';

interface Expense {
  id: number;
  user_id: number;
  amount: number;
  description: string;
  category: string;
  timestamp: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'food-fork-drink' },
  { id: 'transport', name: 'Transportation', icon: 'car-outline' },
  { id: 'utilities', name: 'Utilities', icon: 'lightning-bolt-outline' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-outline' },
  { id: 'entertainment', name: 'Entertainment', icon: 'gamepad-variant-outline' },
  { id: 'health', name: 'Healthcare', icon: 'hospital-box-outline' },
  { id: 'other', name: 'Other', icon: 'dots-horizontal' },
];

const getCategoryIcon = (categoryId: string) => {
  const category = categories.find((cat) => cat.id === categoryId);
  return category?.icon || 'help-circle-outline';
};

export default function Expenses() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'category' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return [...expenses].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (sortBy === 'category') {
        const categoryA = a.category.toLowerCase();
        const categoryB = b.category.toLowerCase();
        return sortOrder === 'desc' 
          ? categoryB.localeCompare(categoryA)
          : categoryA.localeCompare(categoryB);
      } else {
        const amountA = a.amount;
        const amountB = b.amount;
        return sortOrder === 'desc' ? amountB - amountA : amountA - amountB;
      }
    });
  }, [expenses, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'desc' ? 'asc' : 'desc');
  };

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const endpoint = API_ENDPOINTS.EXPENSE.GET_ALL.replace(':user_id', userId);
      console.log('Fetching expenses from:', endpoint);
      
      const response = await axiosInstance.get(endpoint);
      console.log('Fetch response:', response.data);

      if (response.data.success) {
        setExpenses(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch expenses');
      }
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to fetch expenses. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        router.replace('/(auth)/sign-in');
        return;
      }
      
      setIsAuthenticated(true);
      await fetchExpenses();
    } catch (error: any) {
      console.error('Authentication error:', error);
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  const handleEdit = (expense: Expense) => {
    try {
      setSelectedExpense(expense);
      setAmount(expense.amount.toString());
      setDescription(expense.description);
      setSelectedCategory(expense.category);
      setIsEditing(true);
      setShowModal(true);
    } catch (error) {
      console.error('Error in handleEdit:', error);
      Alert.alert('Error', 'Failed to open edit modal');
    }
  };

  const handleEditPress = () => {
    try {
      if (selectedExpense) {
        setAmount(selectedExpense.amount.toString());
        setDescription(selectedExpense.description);
        setSelectedCategory(selectedExpense.category);
        setIsEditing(true);
        setShowViewModal(false);
        setTimeout(() => setShowModal(true), 100); // Add slight delay for modal transition
      }
    } catch (error) {
      console.error('Error in handleEditPress:', error);
      Alert.alert('Error', 'Failed to open edit modal');
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const endpoint = isEditing 
        ? API_ENDPOINTS.EXPENSE.UPDATE.replace(':expense_id', selectedExpense?.id?.toString() || '')
        : API_ENDPOINTS.EXPENSE.ADD;
      
      console.log('Submitting expense to:', endpoint);
      console.log('Expense data:', {
        user_id: parseInt(userId),
        amount: parseFloat(amount),
        description,
        category: selectedCategory
      });

      const data = {
        user_id: parseInt(userId),
        amount: parseFloat(amount),
        description,
        category: selectedCategory,
        ...(isEditing && { expense_id: selectedExpense?.id })
      };

      const response = isEditing
        ? await axiosInstance.put(endpoint, data)
        : await axiosInstance.post(endpoint, data);

      console.log('Response:', response.data);

      if (response.data.success) {
        // Reset form before closing modal and fetching
        setAmount('');
        setDescription('');
        setSelectedCategory(categories[0].id);
        setSelectedExpense(null);
        setIsEditing(false);
        setShowModal(false);
        
        // Slight delay before fetching to ensure modal is closed
        setTimeout(() => {
          fetchExpenses();
          Alert.alert('Success', isEditing ? 'Expense updated successfully' : 'Expense added successfully');
        }, 100);
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong');
      }
    } catch (error: any) {
      console.error('Error submitting expense:', error);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      } else if (error.response?.status === 403) {
        Alert.alert('Error', 'You are not authorized to perform this action');
      } else if (error.message === 'Network Error') {
        Alert.alert('Connection Error', 'Please check your internet connection and try again');
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to process expense. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: number) => {
    try {
      setIsDeleting(true);
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      if (!userId || !token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      console.log('Deleting expense:', expenseId);
      const response = await axiosInstance.delete(
        API_ENDPOINTS.EXPENSE.DELETE.replace(':expense_id', expenseId.toString()),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Delete response:', response.data);

      if (response.data.success) {
        Alert.alert('Success', 'Expense deleted successfully');
        setShowViewModal(false);
        fetchExpenses(); // Refresh the list
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete expense');
      }
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to delete expense'
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSelectedCategory(categories[0].id);
    setIsEditing(false);
  };

  const handleExpensePress = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowViewModal(true);
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1f2937" />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1f2937" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="transparent" style="dark" />
      
      {/* Header */}
      <TabHeader
        title="Expenses"
        subtitle="Track your spending"
        sortOptions={[
          { id: 'date', label: 'Date', icon: 'clock-outline' },
          { id: 'amount', label: 'Amount', icon: 'cash' },
          { id: 'category', label: 'Category', icon: 'tag-outline' }
        ]}
        selectedSort={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onSortOrderChange={toggleSortOrder}
        themeColor="#1f2937"
      />

      {/* Expense List */}
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 0, paddingTop: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6">
            {isLoading ? (
              <View className="justify-center items-center py-20">
                <ActivityIndicator size="large" color="#1f2937" />
              </View>
            ) : sortedExpenses.length > 0 ? (
              <View className="space-y-4">
                {sortedExpenses.map((expense) => (
                  <TouchableOpacity
                    key={expense.id}
                    onPress={() => handleExpensePress(expense)}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-3"
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
                          <MaterialCommunityIcons
                            name={getCategoryIcon(expense.category)}
                            size={24}
                            color="#1f2937"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-800 font-bold text-base mb-0.5">
                            {expense.description || 'Expense'}
                          </Text>
                          <Text className="text-gray-500 text-sm mb-0.5 capitalize">
                            {expense.category}
                          </Text>
                          <Text className="text-gray-400 text-xs">
                            {formatDate(expense.timestamp)}
                          </Text>
                        </View>
                      </View>
                      <View>
                        <Text className="text-gray-800 font-bold text-base text-right mb-1">
                          -{formatCurrency(expense.amount)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-20">
                <View className="bg-gray-100 p-4 rounded-full mb-4">
                  <MaterialCommunityIcons name="cash-remove" size={32} color="#9ca3af" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg mb-2">No Expenses Yet</Text>
                <Text className="text-gray-500 text-center text-base">
                  Start tracking your spending by adding your first expense
                </Text>
              </View>
            )}
            <View className="h-32" />
          </View>
        </ScrollView>
      </View>

      {/* Add Expense FAB */}
      <TouchableOpacity
        onPress={() => {
          resetForm();
          setShowModal(true);
        }}
        className="absolute bottom-8 right-6 bg-gray-900 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <View className="flex-1 justify-end bg-black/30">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="bg-white rounded-t-[32px]"
          >
            <View className="p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-800">
                  {isEditing ? 'Edit Expense' : 'Add Expense'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="bg-gray-100 p-2 rounded-full"
                >
                  <MaterialCommunityIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                className="max-h-[600px]" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 0 }}
              >
                <View className="space-y-6">
                  {/* Amount Input */}
                  <View className="mb-6">
                    <Text className="text-gray-600 font-medium mb-2">Amount</Text>
                    <TextInput
                      className="bg-gray-50 px-4 py-3.5 rounded-xl text-gray-800 text-lg"
                      placeholder="₱0.00"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Description Input */}
                  <View className="mb-6">
                    <Text className="text-gray-600 font-medium mb-2">Description</Text>
                    <TextInput
                      className="bg-gray-50 px-4 py-3.5 rounded-xl text-gray-800"
                      placeholder="What's this expense for?"
                      value={description}
                      onChangeText={setDescription}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Category Selection */}
                  <View className="mb-6">
                    <Text className="text-gray-600 font-medium mb-3">Category</Text>
                    <View className="flex-1">
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 0 }}
                      >
                        <View className="flex-row">
                          {categories.map((cat) => (
                            <TouchableOpacity
                              key={cat.id}
                              onPress={() => setSelectedCategory(cat.id)}
                              className={selectedCategory === cat.id 
                                ? 'mr-3 p-4 rounded-xl flex-row items-center bg-gray-100 border border-gray-200'
                                : 'mr-3 p-4 rounded-xl flex-row items-center bg-gray-50'
                              }
                            >
                              <MaterialCommunityIcons
                                name={cat.icon}
                                size={20}
                                color={selectedCategory === cat.id ? '#1f2937' : '#666'}
                              />
                              <Text 
                                className={selectedCategory === cat.id 
                                  ? 'ml-2 font-medium text-gray-800'
                                  : 'ml-2 font-medium text-gray-600'
                                }
                              >
                                {cat.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className={isSubmitting ? 'py-4 rounded-xl mt-4 bg-gray-400' : 'py-4 rounded-xl mt-4 bg-gray-900'}
                  >
                    {isSubmitting ? (
                      <View className="flex-row justify-center items-center space-x-2">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white font-semibold text-lg">
                          {isEditing ? 'Updating...' : 'Adding...'}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white text-center font-semibold text-lg">
                        {isEditing ? 'Update Expense' : 'Add Expense'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* View Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showViewModal}
        onRequestClose={() => setShowViewModal(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-[32px] p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-800">Details</Text>
              <TouchableOpacity
                onPress={() => setShowViewModal(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <MaterialCommunityIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedExpense && (
              <View className="space-y-6">
                <View className="items-center">
                  <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                    <MaterialCommunityIcons
                      name={getCategoryIcon(selectedExpense.category)}
                      size={32}
                      color="#1f2937"
                    />
                  </View>
                  <Text className="text-3xl font-bold text-gray-800 mb-1">
                    {formatCurrency(selectedExpense.amount)}
                  </Text>
                  <Text className="text-gray-500 text-lg capitalize">
                    {selectedExpense.category}
                  </Text>
                </View>

                <View className="space-y-4">
                  <View className="bg-gray-50 p-4 rounded-xl mt-4">
                    <Text className="text-gray-500 text-sm mb-1">Description</Text>
                    <Text className="text-gray-800 font-medium">
                      {selectedExpense.description || 'No description'}
                    </Text>
                  </View>

                  <View className="bg-gray-50 p-4 rounded-xl mt-4">
                    <Text className="text-gray-500 text-sm mb-1">Date & Time</Text>
                    <Text className="text-gray-800 font-medium">
                      {formatDate(selectedExpense.timestamp)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row space-x-3 mt-4">
                  <TouchableOpacity
                    onPress={handleEditPress}
                    className="flex-1 bg-gray-900 py-4 rounded-xl"
                  >
                    <Text className="text-white text-center font-semibold">
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(selectedExpense.id)}
                    className="flex-1 bg-gray-100 py-4 rounded-xl ml-3"
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#666" />
                    ) : (
                      <Text className="text-gray-800 text-center font-semibold">
                        Delete
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}