import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_ENDPOINTS } from '@/constants/API';
import axiosInstance from "@/utils/axiosConfig";
import { StatusBar } from 'expo-status-bar';
import TabHeader from '../../components/TabHeader';
import AddButton from '../../components/AddButton';

interface Goal {
  goal_id: number;
  user_id: number;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  days_remaining: number;
  progress_percentage: number;
}

interface Contribution {
  contribution_id: number;
  goal_id: number;
  amount: number;
  notes?: string;
  created_at: string;
}

export default function Goals() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'progress'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isLoadingContributions, setIsLoadingContributions] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    target_date: '',
    contribution_amount: '',
    notes: ''
  });

  const sortedGoals = useMemo(() => {
    if (!goals) return [];
    
    return [...goals].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.target_date).getTime();
        const dateB = new Date(b.target_date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' 
          ? b.progress_percentage - a.progress_percentage
          : a.progress_percentage - b.progress_percentage;
      }
    });
  }, [goals, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'desc' ? 'asc' : 'desc');
  };

  // Helper function to format date input (MM-DD-YYYY)
  const formatDateInput = (text: string) => {
    // Remove any non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as MM-DD-YYYY
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return cleaned.slice(0, 2) + '-' + cleaned.slice(2);
    } else {
      const month = cleaned.slice(0, 2);
      const day = cleaned.slice(2, 4);
      const year = cleaned.slice(4, 8);
      return `${month}-${day}-${year}`;
    }
  };

  // Helper function to convert MM-DD-YYYY to YYYY-MM-DD for API
  const convertDateForAPI = (dateString: string) => {
    if (!dateString || dateString.length !== 10) return dateString;
    const [month, day, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

  // Helper function to convert YYYY-MM-DD to MM-DD-YYYY for display
  const convertDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const fetchGoals = async () => {
    try {
      console.log('Fetching goals...');
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');

      if (!userId || !token) {
        console.log('No userId or token found');
        router.replace('/(auth)/sign-in');
        return;
      }

      console.log('Making API request to:', API_ENDPOINTS.GOALS.GET_ALL);
      const response = await axiosInstance.get(
        API_ENDPOINTS.GOALS.GET_ALL,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('API Response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        const formattedGoals = response.data.data.map((goal: any) => {
          // Safely parse numbers with fallbacks
          const targetAmount = goal.target_amount ? parseFloat(goal.target_amount.toString()) : 0;
          const currentAmount = goal.current_amount ? parseFloat(goal.current_amount.toString()) : 0;
          const progressPercentage = goal.progress_percentage ? parseFloat(goal.progress_percentage.toString()) : 0;
          
          console.log('Processing goal:', goal);
          
          return {
            goal_id: goal.goal_id || 0,
            user_id: goal.user_id || 0,
            title: goal.title || '',
            description: goal.description || '',
            target_amount: targetAmount,
            current_amount: currentAmount,
            target_date: goal.target_date ? convertDateForDisplay(goal.target_date) : '',
            days_remaining: goal.days_remaining || 0,
            progress_percentage: progressPercentage
          };
        });
        
        console.log('Formatted goals:', formattedGoals);
        setGoals(formattedGoals);
      } else {
        console.log('Failed to fetch goals:', response.data.message);
        Alert.alert('Error', response.data.message || 'Failed to fetch goals');
      }
    } catch (error: any) {
      console.error('Error in fetchGoals:', error);
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert('Error', 'Failed to fetch goals');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const formatAmount = (text: string) => {
    // Remove any non-digit characters except decimal point
    const cleaned = text.replace(/[^\d.]/g, '');
    
    // Handle cases with multiple decimal points
    const parts = cleaned.split('.');
    const wholeNumber = parts[0];
    const decimal = parts.length > 1 ? parts[1] : '';

    // Don't format if empty
    if (!wholeNumber && !decimal) return '';

    // Add commas to whole number part
    const formatted = wholeNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return with decimal if it exists
    return decimal ? `${formatted}.${decimal}` : formatted;
  };

  const cleanAmount = (amount: string) => {
    return amount.replace(/,/g, '');
  };

  const handleAddGoal = async () => {
    if (!formData.title || !formData.target_amount || !formData.target_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      // Validate title length
      if (formData.title.length < 2 || formData.title.length > 100) {
        Alert.alert('Error', 'Title must be between 2 and 100 characters');
        return;
      }

      // Validate description length if provided
      if (formData.description && formData.description.length > 500) {
        Alert.alert('Error', 'Description must not exceed 500 characters');
        return;
      }

      // Validate target amount
      const targetAmount = parseFloat(cleanAmount(formData.target_amount));
      if (isNaN(targetAmount) || targetAmount <= 0) {
        Alert.alert('Error', 'Target amount must be greater than 0');
        return;
      }

      // Convert and validate date
      const targetDate = convertDateForAPI(formData.target_date);
      if (new Date(targetDate) <= new Date()) {
        Alert.alert('Error', 'Target date must be in the future');
        return;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        target_amount: targetAmount,
        target_date: targetDate
      };

      console.log('Submitting goal with payload:', payload);
      setIsSubmitting(true);
      const response = await axiosInstance.post(API_ENDPOINTS.GOALS.ADD, payload);
      console.log('Add goal response:', response.data);

      if (response.data.success) {
        setShowModal(false);
        setFormData({ title: '', description: '', target_amount: '', target_date: '', contribution_amount: '', notes: '' });
        await fetchGoals();
        Alert.alert('Success', 'Goal added successfully');
      }
    } catch (error: any) {
      console.error('Error adding goal:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;

    if (!formData.title || !formData.target_amount || !formData.target_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Validate title length
      if (formData.title.length < 2 || formData.title.length > 100) {
        Alert.alert('Error', 'Title must be between 2 and 100 characters');
        return;
      }

      // Validate description length if provided
      if (formData.description && formData.description.length > 500) {
        Alert.alert('Error', 'Description must not exceed 500 characters');
        return;
      }

      // Validate target amount
      const targetAmount = parseFloat(cleanAmount(formData.target_amount));
      if (isNaN(targetAmount) || targetAmount <= 0) {
        Alert.alert('Error', 'Target amount must be greater than 0');
        return;
      }

      // Convert and validate date
      const targetDate = convertDateForAPI(formData.target_date);
      if (new Date(targetDate) <= new Date()) {
        Alert.alert('Error', 'Target date must be in the future');
        return;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim(),
        target_amount: targetAmount,
        target_date: targetDate
      };

      console.log('Updating goal with payload:', payload);
      const response = await axiosInstance.put(
        API_ENDPOINTS.GOALS.UPDATE.replace(':goal_id', editingGoal.goal_id.toString()),
        payload
      );

      if (response.data.success) {
        setShowModal(false);
        setFormData({ title: '', description: '', target_amount: '', target_date: '', contribution_amount: '', notes: '' });
        setEditingGoal(null);
        await fetchGoals();
        Alert.alert('Success', 'Goal updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating goal:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update goal');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (editingGoal) {
      await handleUpdateGoal();
    } else {
      await handleAddGoal();
    }
    setIsSubmitting(false);
  };

  const handleDeleteGoal = async (goalId: number) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axiosInstance.delete(
                API_ENDPOINTS.GOALS.DELETE.replace(':goal_id', goalId.toString())
              );

              if (response.data.success) {
                fetchGoals();
                Alert.alert('Success', 'Goal deleted successfully');
              }
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };

  const handleAddContribution = async () => {
    try {
      if (!editingGoal) return;

      const amount = parseFloat(formData.contribution_amount.replace(/,/g, ''));
      
      // Validate amount
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount greater than 0');
        return;
      }

      // Calculate remaining amount needed
      const remainingAmount = editingGoal.target_amount - editingGoal.current_amount;
      if (amount > remainingAmount) {
        Alert.alert('Error', `Amount cannot exceed the remaining amount needed (₱${remainingAmount.toLocaleString()})`);
        return;
      }

      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('accessToken');

      const response = await axiosInstance.post(
        API_ENDPOINTS.GOALS.ADD_CONTRIBUTION,
        {
          goal_id: editingGoal.goal_id,
          amount,
          notes: formData.notes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Contribution added successfully');
        setShowContributionModal(false);
        setFormData({
          ...formData,
          contribution_amount: '',
          notes: ''
        });
        await fetchGoals();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to add contribution');
      }
    } catch (error: any) {
      console.error('Error adding contribution:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGoals();
  }, []);

  const fetchContributions = async (goalId: number) => {
    try {
      setIsLoadingContributions(true);
      const response = await axiosInstance.get(
        API_ENDPOINTS.GOALS.GET_CONTRIBUTIONS.replace(':goal_id', goalId.toString())
      );
      
      if (response.data.success) {
        setContributions(response.data.data);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch contributions');
      }
    } catch (error: any) {
      console.error('Error fetching contributions:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch contributions');
    } finally {
      setIsLoadingContributions(false);
    }
  };

  const handleShowContributions = async (goal: Goal) => {
    setSelectedGoal(goal);
    setShowContributionsModal(true);
    await fetchContributions(goal.goal_id);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar backgroundColor="white" style="dark" />
      
      <TabHeader
        title="Goals"
        sortOptions={[
          { id: 'date', label: 'Due Date' },
          { id: 'progress', label: 'Progress' },
          { id: 'amount', label: 'Amount' }
        ]}
        selectedSort={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onSortOrderChange={toggleSortOrder}
      />

      {/* Add Goal Button */}
      <AddButton onPress={() => {
        setEditingGoal(null);
        setFormData({ title: '', description: '', target_amount: '', target_date: '', contribution_amount: '', notes: '' });
        setShowModal(true);
      }} />

      {/* Goals List */}
      <ScrollView
        className="flex-1 px-4 pb-20"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" className="mt-20" color="#3B82F6" />
        ) : sortedGoals.length > 0 ? (
          sortedGoals.map((goal) => (
            <View
              key={goal.goal_id}
              className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons
                        name="target"
                        size={20}
                        color="#3B82F6"
                      />
                    </View>
                    <View className="flex-1 pr-8">
                      <Text className="text-gray-800 font-medium text-lg">
                        {goal.title}
                      </Text>
                      {goal.description && (
                        <Text className="text-gray-600 mt-1 mb-2">
                          {goal.description}
                        </Text>
                      )}
                      <Text className="text-gray-500 text-sm">
                        Target Date: {goal.target_date}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(goal.goal_id)}
                      className="p-2"
                    >
                      <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  
                  <View className="mt-3">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-600 text-sm">Progress</Text>
                      <Text className="text-gray-600 text-sm">
                        {goal.progress_percentage.toFixed(1)}%
                      </Text>
                    </View>
                    <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <View
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${goal.progress_percentage}%`
                        }}
                      />
                    </View>
                  </View>
                  
                  <View className="mt-3 flex-row justify-between items-center">
                    <View>
                      <Text className="text-gray-500 text-sm">Current Amount</Text>
                      <Text className="text-gray-800 font-semibold">
                        ₱{goal.current_amount.toLocaleString()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-sm">Target Amount</Text>
                      <Text className="text-gray-800 font-semibold">
                        ₱{goal.target_amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-4">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingGoal(goal);
                        setFormData({
                          title: goal.title,
                          description: goal.description || '',
                          target_amount: goal.target_amount.toString(),
                          target_date: goal.target_date,
                        });
                        setShowModal(true);
                      }}
                      className="flex-1 bg-gray-100 py-2 px-4 rounded-lg flex-row justify-center items-center"
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color="#4B5563" />
                      <Text className="text-gray-700 font-semibold ml-2">
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleShowContributions(goal)}
                      className="flex-1 bg-gray-100 py-2 px-4 rounded-lg flex-row justify-center items-center"
                    >
                      <MaterialCommunityIcons name="history" size={20} color="#4B5563" />
                      <Text className="text-gray-700 font-semibold ml-2">
                        History
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedGoal(goal);
                        setFormData({
                          ...formData,
                          contribution_amount: '',
                          notes: ''
                        });
                        setShowContributionModal(true);
                      }}
                      className="flex-1 bg-blue-500 py-2 px-4 rounded-lg flex-row justify-center items-center"
                    >
                      <MaterialCommunityIcons name="cash-plus" size={20} color="white" />
                      <Text className="text-white font-semibold ml-2">
                        Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-gray-500 text-lg">No goals found</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Goal Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-3xl p-6 h-[75%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-800">
                {editingGoal ? 'Edit Goal' : 'Add New Goal'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)} className="p-2">
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="space-y-6">
                {/* Title Input */}
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Title</Text>
                  <TextInput
                    className="bg-gray-50 p-4 rounded-xl text-gray-800"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholder="Enter goal title"
                  />
                </View>

                {/* Description Input */}
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Description</Text>
                  <TextInput
                    className="bg-gray-50 p-4 rounded-xl text-gray-800"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Enter goal description"
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                {/* Target Amount Input */}
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Target Amount</Text>
                  <TextInput
                    className="bg-gray-50 p-4 rounded-xl text-gray-800"
                    value={formData.target_amount}
                    onChangeText={(text) => {
                      const formatted = formatAmount(text);
                      setFormData({ ...formData, target_amount: formatted });
                    }}
                    placeholder="Enter target amount"
                    keyboardType="numeric"
                  />
                </View>

                {/* Target Date Input */}
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Target Date</Text>
                  <TextInput
                    className="bg-gray-50 p-4 rounded-xl text-gray-800"
                    value={formData.target_date}
                    onChangeText={(text) => {
                      const formatted = formatDateInput(text);
                      setFormData({ ...formData, target_date: formatted });
                    }}
                    placeholder="MM-DD-YYYY"
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className={`bg-blue-500 p-4 rounded-xl mt-6`}
                  style={{ marginTop: 20 }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-center font-semibold text-lg">
                      {editingGoal ? 'Update Goal' : 'Add Goal'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Money Modal */}
      <Modal
        visible={showContributionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContributionModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-end">
              <View className="bg-white rounded-t-3xl p-6">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-semibold">
                    Add Money to Goal
                  </Text>
                  <TouchableOpacity onPress={() => setShowContributionModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} />
                  </TouchableOpacity>
                </View>

                <View className="space-y-4">
                  <View>
                    <Text className="text-gray-600 mb-2">Amount*</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-3"
                      value={formData.contribution_amount}
                      onChangeText={(text) => {
                        // Allow empty string for clearing
                        if (text === '') {
                          setFormData({ ...formData, contribution_amount: '' });
                          return;
                        }
                        const formatted = formatAmount(text);
                        if (formatted !== null) {
                          setFormData({ ...formData, contribution_amount: formatted });
                        }
                      }}
                      placeholder="Enter amount"
                      keyboardType="numeric"
                    />
                  </View>
                  <View>
                    <Text className="text-gray-600 mb-2">Notes</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-3"
                      value={formData.notes}
                      onChangeText={(text) => setFormData({ ...formData, notes: text })}
                      placeholder="Add notes (optional)"
                      multiline
                    />
                  </View>
                </View>

                <View className="flex-row justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                  <TouchableOpacity
                    onPress={() => {
                      setShowContributionModal(false);
                      setFormData({
                        ...formData,
                        contribution_amount: '',
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-100"
                  >
                    <Text className="text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddContribution}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-lg ${
                      isSubmitting ? 'bg-blue-300' : 'bg-blue-500'
                    }`}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white">Add Money</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Contributions Modal */}
      <Modal
        visible={showContributionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContributionsModal(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-3/4">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl font-semibold">
                  Contributions History
                </Text>
                {selectedGoal && (
                  <Text className="text-gray-600 mt-1">
                    {selectedGoal.title}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowContributionsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} />
              </TouchableOpacity>
            </View>

            {isLoadingContributions ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : contributions.length > 0 ? (
              <ScrollView className="flex-1">
                {contributions.map((contribution) => (
                  <View
                    key={contribution.contribution_id}
                    className="bg-white border border-gray-100 rounded-xl p-4 mb-3"
                  >
                    <View className="flex-row justify-between items-start">
                      <View>
                        <Text className="text-gray-800 font-semibold text-lg">
                          ₱{contribution.amount.toLocaleString()}
                        </Text>
                        {contribution.notes && (
                          <Text className="text-gray-600 mt-1">
                            {contribution.notes}
                          </Text>
                        )}
                      </View>
                      <Text className="text-gray-500 text-sm">
                        {new Date(contribution.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="flex-1 items-center justify-center">
                <MaterialCommunityIcons
                  name="cash-remove"
                  size={48}
                  color="#9CA3AF"
                />
                <Text className="text-gray-500 mt-4 text-center">
                  No contributions yet
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}