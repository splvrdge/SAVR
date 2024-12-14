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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '@/constants/API';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import axiosInstance from '@/utils/axiosConfig';
import TabHeader from '../../components/TabHeader';
import AddButton from '../../components/AddButton';

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
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      console.log('Fetching incomes for user:', userId);
      const response = await axiosInstance.get(API_ENDPOINTS.INCOME.GET_ALL.replace(':user_id', userId));
      console.log('Income response:', response.data);

      if (response.data.success) {
        setIncomes(response.data.data);
      } else {
        setIncomes([]);
      }
    } catch (error: any) {
      console.error('Error fetching incomes:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to fetch incomes'
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
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      console.log('Submitting income:', {
        user_id: parseInt(userId),
        amount: parseFloat(amount),
        description,
        category: selectedCategory,
        ...(isEditing && { income_id: selectedIncome?.id })
      });

      const endpoint = isEditing 
        ? API_ENDPOINTS.INCOME.UPDATE
        : API_ENDPOINTS.INCOME.ADD;
      
      const response = await axiosInstance({
        method: isEditing ? 'PUT' : 'POST',
        url: endpoint,
        data: {
          user_id: parseInt(userId),
          amount: parseFloat(amount),
          description,
          category: selectedCategory,
          ...(isEditing && { income_id: selectedIncome?.id })
        }
      });

      console.log('Submit response:', response.data);

      if (response.data.success) {
        // Reset form before closing modal and fetching
        setAmount('');
        setDescription('');
        setSelectedCategory(categories[0].id);
        setSelectedIncome(null);
        setIsEditing(false);
        setShowModal(false);
        
        // Slight delay before fetching to ensure modal is closed
        setTimeout(() => {
          fetchIncomes();
          Alert.alert('Success', isEditing ? 'Income updated successfully' : 'Income added successfully');
        }, 100);
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong');
      }
    } catch (error: any) {
      console.error('Error submitting income:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to process income'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (incomeId: number) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      console.log('Deleting income:', incomeId);
      const response = await axiosInstance.delete(
        API_ENDPOINTS.INCOME.DELETE.replace(':income_id', incomeId.toString())
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
        await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to delete income'
        );
      }
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
        fetchIncomes();
      } catch (error) {
        console.error('Authentication error:', error);
        if (axiosInstance.isAxiosError(error) && error.response?.status === 401) {
          await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
          router.replace('/(auth)/sign-in');
          return;
        }
      }
    };

    checkAuthentication();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIncomes();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar backgroundColor="white" style="dark" />
      
      <TabHeader
        title="Income"
        sortOptions={[
          { id: 'date', label: 'Date' },
          { id: 'category', label: 'Category' },
          { id: 'amount', label: 'Amount' },
        ]}
        selectedSort={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onSortOrderChange={toggleSortOrder}
        themeColor="#2E8B57" // custom color for this page
      />

      {/* Add Income Button */}
      <AddButton onPress={() => {
        setIsEditing(false);
        setSelectedIncome(null);
        setAmount('');
        setDescription('');
        setSelectedCategory(categories[0].id);
        setShowModal(true);
      }}
      themeColor="#2E8B57" // custom color for this page
      />

      {/* Income List */}
      <ScrollView
        className="flex-1 px-4 pb-20 mt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" className="mt-20" color="#3B82F6" />
        ) : sortedIncomes.length > 0 ? (
          sortedIncomes.map((income) => (
            <TouchableOpacity
              key={income.id}
              onPress={() => handleIncomePress(income)}
              className="bg-white p-4 rounded-xl mb-3 border border-gray-100"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                    <MaterialCommunityIcons
                      name={getCategoryIcon(income.category)}
                      size={20}
                      color="#16a34a"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">
                      {income.description || 'Income'}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {income.category}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {formatDate(income.timestamp)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-green-600 font-semibold mr-2">
                    {formatCurrency(income.amount)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(income.id)}
                    className="p-2"
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-gray-500 text-lg">No income records found</Text>
          </View>
        )}
      </ScrollView>

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
                {isEditing ? 'Edit Income' : 'Add Income'}
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
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Description</Text>
                  <TextInput
                    className="bg-gray-50 p-4 rounded-xl text-gray-800"
                    placeholder="Enter description"
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>

                {/* Amount Input */}
                <View className="mb-4">
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
                <View className="mb-4">
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
                          selectedCategory === cat.id ? 'bg-green-100 border border-green-200' : 'bg-gray-50'
                        }`}
                        style={{ marginRight: 10 }}
                      >
                        <MaterialCommunityIcons
                          name={cat.icon}
                          size={24}
                          color={selectedCategory === cat.id ? '#16a34a' : '#666'}
                        />
                        <Text className={selectedCategory === cat.id ? 'text-green-600' : 'text-gray-600'}
                          style={{ marginLeft: 8 }}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  className="bg-green-600 p-4 rounded-xl mt-6"
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    {isEditing ? 'Update Income' : 'Add Income'}
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
                Income Details
              </Text>
              <TouchableOpacity
                onPress={() => setShowViewModal(false)}
                className="p-2"
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedIncome && (
              <View className="space-y-6">
                <View className="items-center mb-6">
                  <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-3">
                    <MaterialCommunityIcons
                      name={getCategoryIcon(selectedIncome.category)}
                      size={32}
                      color="#16a34a"
                    />
                  </View>
                  <Text className="text-3xl font-bold text-green-600">
                    {formatCurrency(selectedIncome.amount)}
                  </Text>
                </View>

                <View className="space-y-4">
                  <View>
                    <Text className="text-gray-500 text-sm mb-1">Description</Text>
                    <Text className="text-gray-800 text-lg">
                      {selectedIncome.description || 'No description'}
                    </Text>
                  </View>

                  <View>
                    <Text className="text-gray-500 text-sm mb-1">Category</Text>
                    <Text className="text-gray-800 text-lg">
                      {selectedIncome.category}
                    </Text>
                  </View>

                  <View>
                    <Text className="text-gray-500 text-sm mb-1">Date</Text>
                    <Text className="text-gray-800 text-lg">
                      {formatDate(selectedIncome.timestamp)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row space-x-4 mt-6">
                  <TouchableOpacity
                    onPress={() => {
                      setShowViewModal(false);
                      handleEditPress();
                    }}
                    className="flex-1 bg-gray-100 p-4 rounded-xl"
                  >
                    <Text className="text-center text-gray-800 font-semibold">
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowViewModal(false);
                      handleDelete(selectedIncome.id);
                    }}
                    className="flex-1 bg-green-100 p-4 rounded-xl"
                  >
                    <Text className="text-center text-green-600 font-semibold">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}