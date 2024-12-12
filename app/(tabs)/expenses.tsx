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
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_ENDPOINTS } from '@/constants/API';
import { Picker } from '@react-native-picker/picker';

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
  return category?.icon || 'dots-horizontal';
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
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return [...expenses].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const categoryA = a.category.toLowerCase();
        const categoryB = b.category.toLowerCase();
        return sortOrder === 'desc' 
          ? categoryB.localeCompare(categoryA)
          : categoryA.localeCompare(categoryB);
      }
    });
  }, [expenses, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'desc' ? 'asc' : 'desc');
  };

  const fetchExpenses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(
        `${API_URL}${API_ENDPOINTS.EXPENSE.GET_ALL.replace(':user_id', userId)}`,
        { headers }
      );

      if (response.data.success) {
        setExpenses(response.data.data);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
        return;
      }
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        
        if (!token || !userId) {
          router.replace('/(auth)/sign-in');
          return;
        }
        
        setIsAuthenticated(true);
        await fetchExpenses();
      } catch (error) {
        console.error('Authentication error:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
          router.replace('/(auth)/sign-in');
        }
      }
    };
  
    checkAuthentication();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const endpoint = isEditing ? `${API_URL}/expenses/update` : `${API_URL}/expenses/add`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await axios({
        method: method,
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: {
          user_id: userId,
          expense_id: selectedExpense?.id, // Only included when editing
          amount: parseFloat(amount),
          description,
          category: selectedCategory
        }
      });

      const { data } = response;
      
      if (data.success) {
        Alert.alert('Success', isEditing ? 'Expense updated successfully' : 'Expense added successfully');
        setShowModal(false);
        fetchExpenses(); // Refresh the list
        // Reset form
        setAmount('');
        setDescription('');
        setSelectedCategory('');
        setSelectedExpense(null);
        setIsEditing(false);
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
        return;
      }
      Alert.alert('Error', 'Failed to process expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setAmount(expense.amount.toString());
    setDescription(expense.description);
    setSelectedCategory(expense.category);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (expenseId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await axios.delete(`${API_URL}/expenses/delete/${expenseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Expense deleted successfully');
        setShowViewModal(false);
        fetchExpenses(); // Refresh the list
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
        return;
      }
      Alert.alert('Error', 'Failed to delete expense');
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

  const handleAddPress = () => {
    resetForm();
    setShowModal(true);
  };

  const handleExpensePress = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowViewModal(true);
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-red-600" edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
        style={{ position: 'relative' }}
      >
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          className="flex-1"
        >
          {/* Header and Sorting */}
          <View className="p-4 border-b border-gray-100">
            <Text className="text-2xl font-bold text-gray-800 mb-4">
              Expenses
            </Text>
            
            <View className="flex-row justify-between items-center">
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => setSortBy('date')}
                  className={`px-4 py-2 rounded-full border ${
                    sortBy === 'date' ? 'bg-red-100 border-red-200' : 'border-gray-200'
                  }`}
                >
                  <Text className={sortBy === 'date' ? 'text-red-600' : 'text-gray-600'}>
                    Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortBy('category')}
                  className={`px-4 py-2 rounded-full border ${
                    sortBy === 'category' ? 'bg-red-100 border-red-200' : 'border-gray-200'
                  }`}
                >
                  <Text className={sortBy === 'category' ? 'text-red-600' : 'text-gray-600'}>
                    Category
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                onPress={toggleSortOrder}
                className="p-2"
              >
                <MaterialCommunityIcons
                  name={sortOrder === 'desc' ? 'sort-descending' : 'sort-ascending'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Expense List */}
          {sortedExpenses.length > 0 ? (
            <View className="p-4">
              {sortedExpenses.map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  onPress={() => handleExpensePress(expense)}
                  className="bg-white p-4 rounded-xl mb-3 border border-gray-100"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                        <MaterialCommunityIcons
                          name={getCategoryIcon(expense.category)}
                          size={20}
                          color="#dc2626"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-medium">
                          {expense.description || 'Expense'}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          {expense.category}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {new Date(expense.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-red-600 font-semibold mr-2">
                        {formatCurrency(expense.amount)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDelete(expense.id)}
                        className="p-2"
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center p-4">
              <MaterialCommunityIcons name="cash-remove" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-4">
                No expenses recorded yet
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Add Button */}
        <TouchableOpacity
          onPress={handleAddPress}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          className="w-14 h-14 bg-red-600 rounded-full items-center justify-center"
        >
          <MaterialCommunityIcons name="plus" size={30} color="white" />
        </TouchableOpacity>

        {/* Add/Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          <View className="flex-1 justify-end bg-black/30">
            <View className="bg-white rounded-t-3xl p-6 h-[75%] shadow-2xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-800">
                  {isEditing ? 'Edit Expense' : 'Add Expense'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  className="p-2"
                >
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="space-y-6">
                  {/* Description Input */}
                  <View>
                    <Text className="text-gray-600 mb-2">Description</Text>
                    <TextInput
                      className="bg-gray-50 p-4 rounded-xl text-gray-800"
                      placeholder="Enter description"
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>

                  {/* Amount Input */}
                  <View>
                    <Text className="text-gray-600 mb-2">Amount</Text>
                    <TextInput
                      className="bg-gray-50 p-4 rounded-xl text-gray-800"
                      placeholder="Enter amount"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>

                  {/* Category Input */}
                  <View>
                    <Text className="text-gray-600 mb-2">Category</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      className="flex-row space-x-2"
                    >
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => setSelectedCategory(cat.id)}
                          className={`p-4 rounded-xl flex-row items-center space-x-2 ${
                            selectedCategory === cat.id ? 'bg-red-100 border border-red-200' : 'bg-gray-50'
                          }`}
                        >
                          <MaterialCommunityIcons
                            name={getCategoryIcon(cat.id)}
                            size={24}
                            color={selectedCategory === cat.id ? '#dc2626' : '#666'}
                          />
                          <Text className={selectedCategory === cat.id ? 'text-red-600' : 'text-gray-600'}>
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    className="bg-red-600 p-4 rounded-xl mt-6"
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      {isEditing ? 'Update Expense' : 'Add Expense'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
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
            <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-800">
                  Expense Details
                </Text>
                <TouchableOpacity
                  onPress={() => setShowViewModal(false)}
                  className="p-2"
                >
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedExpense && (
                <View className="space-y-6">
                  <View className="items-center mb-6">
                    <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-3">
                      <MaterialCommunityIcons
                        name={getCategoryIcon(selectedExpense.category)}
                        size={32}
                        color="#dc2626"
                      />
                    </View>
                    <Text className="text-3xl font-bold text-red-600">
                      {formatCurrency(selectedExpense.amount)}
                    </Text>
                  </View>

                  <View className="space-y-4">
                    <View>
                      <Text className="text-gray-500 text-sm mb-1">Description</Text>
                      <Text className="text-gray-800 text-lg">
                        {selectedExpense.description || 'No description'}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-gray-500 text-sm mb-1">Category</Text>
                      <Text className="text-gray-800 text-lg">
                        {selectedExpense.category}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-gray-500 text-sm mb-1">Date</Text>
                      <Text className="text-gray-800 text-lg">
                        {new Date(selectedExpense.timestamp).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row space-x-4 mt-6">
                    <TouchableOpacity
                      onPress={() => {
                        setShowViewModal(false);
                        handleEdit(selectedExpense);
                      }}
                      className="flex-1 bg-gray-100 p-4 rounded-xl flex-row justify-center items-center space-x-2"
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color="#666" />
                      <Text className="text-gray-600 font-semibold">Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(selectedExpense.id)}
                      className="flex-1 bg-red-100 p-4 rounded-xl flex-row justify-center items-center space-x-2"
                    >
                      <MaterialCommunityIcons name="trash-can" size={20} color="#dc2626" />
                      <Text className="text-red-600 font-semibold">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
