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
  { id: 'freelance', name: 'Freelance', icon: 'laptop-outline' },
  { id: 'gift', name: 'Gift', icon: 'gift-outline' },
  { id: 'other', name: 'Other', icon: 'dots-horizontal' },
];

const IncomeScreen = () => {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedIncomes = useMemo(() => {
    if (!incomes) return [];
    
    return [...incomes].sort((a, b) => {
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
  }, [incomes, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'desc' ? 'asc' : 'desc');
  };

  const fetchIncomes = async () => {
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
        `${API_URL}${API_ENDPOINTS.INCOME.GET_ALL.replace(':user_id', userId)}`,
        { headers }
      );

      if (response.data.success) {
        setIncomes(response.data.data);
      } else {
        setIncomes([]);
      }
    } catch (error) {
      console.error('Error fetching incomes:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
        return;
      }
      setIncomes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const endpoint = isEditing 
        ? `${API_URL}${API_ENDPOINTS.INCOME.UPDATE}`
        : `${API_URL}${API_ENDPOINTS.INCOME.ADD}`;
      
      const response = await axios({
        method: isEditing ? 'PUT' : 'POST',
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: {
          user_id: parseInt(userId),
          amount: parseFloat(amount),
          description,
          category: selectedCategory,
          ...(isEditing && { income_id: selectedIncome?.id })
        }
      });

      const { data } = response;
      
      if (data.success) {
        Alert.alert('Success', isEditing ? 'Income updated successfully' : 'Income added successfully');
        setShowModal(false);
        fetchIncomes(); // Refresh the list
        // Reset form
        setAmount('');
        setDescription('');
        setSelectedCategory(categories[0].id);
        setSelectedIncome(null);
        setIsEditing(false);
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
          router.replace('/(auth)/sign-in');
          return;
        }
        Alert.alert('Error', error.response?.data?.message || 'Failed to process income');
      } else {
        Alert.alert('Error', 'Failed to process income');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (income: Income) => {
    setSelectedIncome(income);
    setAmount(income.amount.toString());
    setDescription(income.description);
    setSelectedCategory(income.category);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (incomeId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await axios.delete(`${API_URL}/income/delete/${incomeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Income deleted successfully');
        setShowViewModal(false);
        fetchIncomes(); // Refresh the list
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete income');
      }
    } catch (error) {
      console.error('Error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
        return;
      }
      Alert.alert('Error', 'Failed to delete income');
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

  const handleIncomePress = (income: Income) => {
    setSelectedIncome(income);
    setShowViewModal(true);
  };

  const handleEditPress = () => {
    if (selectedIncome) {
      setAmount(selectedIncome.amount.toString());
      setDescription(selectedIncome.description);
      setSelectedCategory(selectedIncome.category);
      setIsEditing(true);
      setShowViewModal(false);
      setShowModal(true);
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
        fetchIncomes();
      } catch (error) {
        console.error('Authentication error:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
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
    <SafeAreaView className="flex-1 bg-green-600" edges={['top']}>
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
              Income
            </Text>
            
            <View className="flex-row justify-between items-center">
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => setSortBy('date')}
                  className={`px-4 py-2 rounded-full border ${
                    sortBy === 'date' ? 'bg-green-100 border-green-200' : 'border-gray-200'
                  }`}
                >
                  <Text className={sortBy === 'date' ? 'text-green-600' : 'text-gray-600'}>
                    Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortBy('category')}
                  className={`px-4 py-2 rounded-full border ${
                    sortBy === 'category' ? 'bg-green-100 border-green-200' : 'border-gray-200'
                  }`}
                >
                  <Text className={sortBy === 'category' ? 'text-green-600' : 'text-gray-600'}>
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

          {/* Income List */}
          {sortedIncomes.length > 0 ? (
            <View className="p-4">
              {sortedIncomes.map((income) => (
                <TouchableOpacity
                  key={income.id}
                  onPress={() => handleIncomePress(income)}
                  className="bg-white p-4 rounded-xl mb-3 border border-gray-100"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                        <MaterialCommunityIcons
                          name={income.category}
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
                          {new Date(income.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
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
              ))}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center p-4">
              <MaterialCommunityIcons name="cash-remove" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-4">
                No income recorded yet
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
          className="w-14 h-14 bg-green-600 rounded-full items-center justify-center"
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
                            selectedCategory === cat.id ? 'bg-green-100 border border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <MaterialCommunityIcons
                            name={cat.icon}
                            size={24}
                            color={selectedCategory === cat.id ? '#16a34a' : '#666'}
                          />
                          <Text className={selectedCategory === cat.id ? 'text-green-600' : 'text-gray-600'}>
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
                        name={selectedIncome.category}
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
                        {new Date(selectedIncome.timestamp).toLocaleDateString('en-US', {
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default IncomeScreen;
