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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '@/constants/API';
import { StatusBar } from 'expo-status-bar';
import axiosInstance from '@/utils/axiosConfig';
import TabHeader from '../../components/TabHeader';

interface Income {
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
  { id: 'salary', name: 'Salary', icon: 'cash-multiple' },
  { id: 'business', name: 'Business', icon: 'store-outline' },
  { id: 'investment', name: 'Investment', icon: 'trending-up' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop' },
  { id: 'gift', name: 'Gift', icon: 'gift-outline' },
  { id: 'other', name: 'Other', icon: 'dots-horizontal' },
];

const getCategoryIcon = (categoryId: string) => {
  const category = categories.find((cat) => cat.id === categoryId);
  return category?.icon || 'help-circle-outline';
};

export default function IncomeScreen() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'category' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedIncomes = useMemo(() => {
    if (!incomes) return [];
    
    return [...incomes].sort((a, b) => {
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
  }, [incomes, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'desc' ? 'asc' : 'desc');
  };

  const fetchIncomes = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      if (!userId || !token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      console.log('Fetching incomes for user:', userId);
      const response = await axiosInstance.get(
        API_ENDPOINTS.INCOME.GET_ALL.replace(':user_id', userId)
      );
      console.log('Income response:', response.data);

      if (response.data.success) {
        // Format the incoming data to match our interface
        const formattedIncomes = response.data.data.map((income: any) => ({
          id: income.id,
          user_id: income.user_id,
          amount: parseFloat(income.amount),
          description: income.description || '',
          category: income.category || 'other',
          timestamp: income.timestamp
        }));
        setIncomes(formattedIncomes);
      } else {
        setIncomes([]);
      }
    } catch (error: any) {
      console.error('Error fetching incomes:', error);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      
      if (error.response?.status === 401) {
        // Let the axios interceptor handle token refresh
        throw error;
      } else if (error.message === 'Network Error') {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to fetch incomes. Please try again later.'
        );
      }
      setIncomes([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      if (!userId || !token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const data = {
        user_id: parseInt(userId),
        amount: parseFloat(amount),
        description,
        category: selectedCategory
      };

      console.log('Submitting income:', data);

      const endpoint = isEditing 
        ? `${API_ENDPOINTS.INCOME.UPDATE.replace(':income_id', selectedIncome?.id.toString() || '')}`
        : API_ENDPOINTS.INCOME.ADD;
      
      const response = await axiosInstance({
        method: isEditing ? 'PUT' : 'POST',
        url: endpoint,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Submit response:', response.data);

      if (response.data.success) {
        setAmount('');
        setDescription('');
        setSelectedCategory(categories[0].id);
        setSelectedIncome(null);
        setIsEditing(false);
        setShowModal(false);
        await fetchIncomes(); // Immediately fetch updated incomes
        Alert.alert('Success', isEditing ? 'Income updated successfully' : 'Income added successfully');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to save income');
      }
    } catch (error: any) {
      console.error('Error submitting income:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to save income'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (incomeId: number) => {
    try {
      setIsDeleting(true);
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      if (!userId || !token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      console.log('Deleting income:', incomeId);
      const response = await axiosInstance.delete(
        API_ENDPOINTS.INCOME.DELETE.replace(':income_id', incomeId.toString()),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Delete response:', response.data);

      if (response.data.success) {
        Alert.alert('Success', 'Income deleted successfully');
        setShowViewModal(false);
        fetchIncomes(); // Refresh the list
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete income');
      }
    } catch (error: any) {
      console.error('Error deleting income:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to delete income'
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (income: Income) => {
    try {
      setSelectedIncome(income);
      setAmount(income.amount.toString());
      setDescription(income.description);
      setSelectedCategory(income.category);
      setIsEditing(true);
      setShowModal(true);
    } catch (error) {
      console.error('Error in handleEdit:', error);
      Alert.alert('Error', 'Failed to open edit modal');
    }
  };

  const handleEditPress = () => {
    try {
      if (selectedIncome) {
        setAmount(selectedIncome.amount.toString());
        setDescription(selectedIncome.description);
        setSelectedCategory(selectedIncome.category);
        setIsEditing(true);
        setShowViewModal(false);
        setTimeout(() => setShowModal(true), 100); // Add slight delay for modal transition
      }
    } catch (error) {
      console.error('Error in handleEditPress:', error);
      Alert.alert('Error', 'Failed to open edit modal');
    }
  };

  const handleIncomePress = (income: Income) => {
    setSelectedIncome(income);
    setShowViewModal(true);
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

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        router.replace('/(auth)/sign-in');
        return;
      }
      
      setIsAuthenticated(true);
      await fetchIncomes();
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
    await fetchIncomes();
    setRefreshing(false);
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" edges={['top']}>
      <StatusBar backgroundColor="transparent" style="dark" />
      
      {/* Header */}
      <TabHeader
        title="Income"
        subtitle="Track your earnings"
        sortOptions={[
          { id: 'date', label: 'Date', icon: 'clock-outline' },
          { id: 'amount', label: 'Amount', icon: 'cash' },
          { id: 'category', label: 'Category', icon: 'tag-outline' }
        ]}
        selectedSort={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onSortOrderChange={toggleSortOrder}
        themeColor="#2563eb"
      />

      {/* Income List */}
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#2563eb"
              colors={["#2563eb"]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6">
            {isLoading ? (
              <View className="justify-center items-center py-20">
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : (
              sortedIncomes.length > 0 ? (
                <View className="space-y-4">
                  {sortedIncomes.map((income) => (
                    <TouchableOpacity
                      key={income.id}
                      onPress={() => handleIncomePress(income)}
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center flex-1">
                          <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-4">
                            <MaterialCommunityIcons
                              name={getCategoryIcon(income.category)}
                              size={24}
                              color="#2563eb"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-800 font-bold text-base mb-0.5">
                              {income.description || 'Income'}
                            </Text>
                            <Text className="text-gray-500 text-sm mb-0.5 capitalize">
                              {income.category}
                            </Text>
                            <Text className="text-gray-400 text-xs">
                              {formatDate(income.timestamp)}
                            </Text>
                          </View>
                        </View>
                        <View>
                          <Text className="text-blue-600 font-bold text-base text-right mb-1">
                            +{formatCurrency(income.amount)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="items-center justify-center py-20">
                  <View className="bg-gray-50 p-4 rounded-full mb-4">
                    <MaterialCommunityIcons name="cash-plus" size={32} color="#9ca3af" />
                  </View>
                  <Text className="text-gray-800 font-semibold text-lg mb-2">No Income Yet</Text>
                  <Text className="text-gray-500 text-center text-base">
                    Start tracking your earnings by adding your first income
                  </Text>
                </View>
              )
            )}
            <View className="h-32" />
          </View>
        </ScrollView>
      </View>

      {/* Add Income FAB */}
      <TouchableOpacity
        onPress={handleAddPress}
        className="absolute bottom-8 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
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
                  {isEditing ? 'Edit Income' : 'Add Income'}
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

              <ScrollView className="max-h-[600px]" showsVerticalScrollIndicator={false}>
                <View className="space-y-6">
                  {/* Amount Input */}
                  <View>
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
                  <View>
                    <Text className="text-gray-600 font-medium mb-2">Description</Text>
                    <TextInput
                      className="bg-gray-50 px-4 py-3.5 rounded-xl text-gray-800"
                      placeholder="What's this income for?"
                      value={description}
                      onChangeText={setDescription}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Category Selection */}
                  <View>
                    <Text className="text-gray-600 font-medium mb-3">Category</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      className="flex-row"
                    >
                      <View className="flex-row">
                        {categories.map((cat) => (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            className={selectedCategory === cat.id 
                              ? 'mr-3 p-4 rounded-xl flex-row items-center bg-blue-50 border border-blue-100'
                              : 'mr-3 p-4 rounded-xl flex-row items-center bg-gray-50'
                            }
                          >
                            <MaterialCommunityIcons
                              name={cat.icon}
                              size={20}
                              color={selectedCategory === cat.id ? '#2563eb' : '#666'}
                            />
                            <Text 
                              className={selectedCategory === cat.id 
                                ? 'ml-2 font-medium text-blue-600'
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

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className={isSubmitting ? 'py-4 rounded-xl mt-4 bg-blue-400' : 'py-4 rounded-xl mt-4 bg-blue-600'}
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
                        {isEditing ? 'Update Income' : 'Add Income'}
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

            {selectedIncome && (
              <View className="space-y-6">
                <View className="items-center">
                  <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
                    <MaterialCommunityIcons
                      name={getCategoryIcon(selectedIncome.category)}
                      size={32}
                      color="#2563eb"
                    />
                  </View>
                  <Text className="text-3xl font-bold text-gray-800 mb-1">
                    {formatCurrency(selectedIncome.amount)}
                  </Text>
                  <Text className="text-gray-500 text-lg capitalize">
                    {selectedIncome.category}
                  </Text>
                </View>

                <View className="space-y-4">
                  <View className="bg-gray-50 p-4 rounded-xl">
                    <Text className="text-gray-500 text-sm mb-1">Description</Text>
                    <Text className="text-gray-800 font-medium">
                      {selectedIncome.description || 'No description'}
                    </Text>
                  </View>

                  <View className="bg-gray-50 p-4 rounded-xl">
                    <Text className="text-gray-500 text-sm mb-1">Date & Time</Text>
                    <Text className="text-gray-800 font-medium">
                      {formatDate(selectedIncome.timestamp)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row space-x-3 mt-4">
                  <TouchableOpacity
                    onPress={handleEditPress}
                    className="flex-1 bg-blue-600 py-4 rounded-xl"
                  >
                    <Text className="text-white text-center font-semibold">
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(selectedIncome.id)}
                    className="flex-1 bg-gray-100 py-4 rounded-xl"
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