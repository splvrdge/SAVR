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

interface Goal {
  goal_id: number;
  user_id: number;
  title: string;
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
  contribution_date: string;
  notes?: string;
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

  const [formData, setFormData] = useState({
    title: '',
    target_amount: '',
    target_date: '',
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
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const response = await axiosInstance.get(API_ENDPOINTS.GOALS.GET_ALL.replace(':user_id', userId));
      
      if (response.data.success) {
        setGoals(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'userId']);
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to fetch goals');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [])
  );

  const formatAmount = (text: string) => {
    const cleaned = text.replace(/[^\d.]/g, '');
    
    const parts = cleaned.split('.');
    const wholeNumber = parts[0];
    const decimal = parts[1];

    const formatted = wholeNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
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

      const payload = {
        user_id: parseInt(userId),
        title: formData.title,
        target_amount: parseFloat(cleanAmount(formData.target_amount)),
        target_date: convertDateForAPI(formData.target_date)
      };

      const response = await axiosInstance.post(API_ENDPOINTS.GOALS.ADD, payload);

      if (response.data.success) {
        setShowModal(false);
        setFormData({ title: '', target_amount: '', target_date: '' });
        fetchGoals();
        Alert.alert('Success', 'Goal added successfully');
      }
    } catch (error: any) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add goal');
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;

    try {
      const response = await axiosInstance.put(
        API_ENDPOINTS.GOALS.UPDATE.replace(':goal_id', editingGoal.goal_id.toString()),
        formData
      );

      if (response.data.success) {
        setShowModal(false);
        setFormData({ title: '', target_amount: '', target_date: '' });
        fetchGoals();
        Alert.alert('Success', 'Goal updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating goal:', error);
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
              console.error('Error deleting goal:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };

  const handleAddContribution = async () => {
    if (!editingGoal || !formData.target_amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const response = await axiosInstance.post(API_ENDPOINTS.GOALS.ADD_CONTRIBUTION, {
        goal_id: editingGoal.goal_id,
        user_id: parseInt(userId),
        amount: parseFloat(cleanAmount(formData.target_amount)),
      });

      if (response.data.success) {
        setShowContributionModal(false);
        setFormData({ title: '', target_amount: '', target_date: '' });
        fetchGoals();
        Alert.alert('Success', 'Contribution added successfully');
      }
    } catch (error: any) {
      console.error('Error adding contribution:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add contribution');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGoals();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar backgroundColor="white" style="dark" />
      
      {/* Header and Sorting */}
      <View className="p-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          Goals
        </Text>
        
        <View className="flex-row justify-between items-center">
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setSortBy('date')}
              className={`px-4 py-2 rounded-full border ${
                sortBy === 'date' ? 'bg-blue-100 border-blue-200' : 'border-gray-200'
              }`}
            >
              <Text className={sortBy === 'date' ? 'text-blue-600' : 'text-gray-600'}>
                Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSortBy('progress')}
              className={`px-4 py-2 rounded-full border ${
                sortBy === 'progress' ? 'bg-blue-100 border-blue-200' : 'border-gray-200'
              }`}
            >
              <Text className={sortBy === 'progress' ? 'text-blue-600' : 'text-gray-600'}>
                Progress
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={toggleSortOrder} className="p-2">
            <MaterialCommunityIcons
              name={sortOrder === 'desc' ? 'sort-descending' : 'sort-ascending'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Goal Button */}
      <TouchableOpacity
        onPress={() => {
          setEditingGoal(null);
          setFormData({ title: '', target_amount: '', target_date: '' });
          setShowModal(true);
        }}
        className="absolute bottom-4 right-4 z-10 bg-blue-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
      >
        <MaterialCommunityIcons name="plus" size={30} color="white" />
      </TouchableOpacity>

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
                      <Text className="text-gray-500 text-sm">
                        Target Date: {convertDateForDisplay(goal.target_date)}
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
                        {((goal.current_amount / goal.target_amount) * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <View
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            (goal.current_amount / goal.target_amount) * 100,
                            100
                          )}%`,
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

                  <View className="flex-row space-x-2 mt-3">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingGoal(goal);
                        setFormData({
                          title: goal.title,
                          target_amount: goal.target_amount.toString(),
                          target_date: goal.target_date,
                        });
                        setShowModal(true);
                      }}
                      className="flex-1 bg-gray-100 py-2 px-4 rounded-lg"
                    >
                      <Text className="text-gray-700 text-center font-semibold">
                        Edit Goal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingGoal(goal);
                        setFormData({
                          ...formData,
                          target_amount: '',
                        });
                        setShowContributionModal(true);
                      }}
                      className="flex-1 bg-blue-500 py-2 px-4 rounded-lg"
                    >
                      <Text className="text-white text-center font-semibold">
                        Add Money
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-end">
              <View className="bg-white rounded-t-3xl p-6 h-3/4">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-semibold">
                    {editingGoal ? 'Edit Goal' : 'Add New Goal'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} />
                  </TouchableOpacity>
                </View>

                <ScrollView className="flex-1">
                  <View className="space-y-4">
                    <View>
                      <Text className="text-gray-600 mb-2">Title*</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg p-3"
                        value={formData.title}
                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                        placeholder="Enter goal title"
                      />
                    </View>

                    <View>
                      <Text className="text-gray-600 mb-2">Target Amount*</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg p-3"
                        value={formData.target_amount}
                        onChangeText={(text) => {
                          const formatted = formatAmount(text);
                          setFormData({ ...formData, target_amount: formatted });
                        }}
                        placeholder="Enter target amount"
                        keyboardType="numeric"
                      />
                    </View>

                    <View>
                      <Text className="text-gray-600 mb-2">Target Date*</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg p-3"
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
                  </View>
                </ScrollView>

                <View className="flex-row justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                  <TouchableOpacity
                    onPress={() => {
                      setShowModal(false);
                      setEditingGoal(null);
                      setFormData({ title: '', target_amount: '', target_date: '' });
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-100"
                  >
                    <Text className="text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-lg ${
                      isSubmitting ? 'bg-blue-300' : 'bg-blue-500'
                    }`}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white">
                        {editingGoal ? 'Update' : 'Add'} Goal
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
                      value={formData.target_amount}
                      onChangeText={(text) => {
                        const formatted = formatAmount(text);
                        setFormData({ ...formData, target_amount: formatted });
                      }}
                      placeholder="Enter amount"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View className="flex-row justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                  <TouchableOpacity
                    onPress={() => {
                      setShowContributionModal(false);
                      setFormData({ ...formData, target_amount: '' });
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
    </SafeAreaView>
  );
}
