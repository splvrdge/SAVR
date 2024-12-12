import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_ENDPOINTS } from '@/constants/API';
import axiosInstance from '@/utils/axiosConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface Goal {
  goal_id: number;
  user_id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function Goals() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    target_amount: '',
    current_amount: '0',
    description: '',
    category: '',
    status: 'pending' as const,
    target_date: null as string | null
  });

  // Goal Categories
  const goalCategories = {
    savings: { name: 'Savings', icon: 'piggy-bank' },
    investment: { name: 'Investment', icon: 'trending-up' },
    emergency: { name: 'Emergency Fund', icon: 'shield-check' },
    education: { name: 'Education', icon: 'school' },
    travel: { name: 'Travel', icon: 'airplane' },
    home: { name: 'Home', icon: 'home' },
    car: { name: 'Car', icon: 'car' },
    retirement: { name: 'Retirement', icon: 'account-clock' },
    other: { name: 'Other', icon: 'dots-horizontal' }
  };

  const fetchGoals = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const response = await axiosInstance.get(
        API_ENDPOINTS.GOALS.GET_ALL.replace(':user_id', userId)
      );

      if (response.data.success) {
        setGoals(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'userId', 'userName']);
        router.replace('/(auth)/sign-in');
        return;
      }
      Alert.alert('Error', 'Failed to fetch goals');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchGoals();
    }, [])
  );

  const handleAddGoal = async () => {
    if (!formData.title || !formData.target_amount || !formData.category) {
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
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || '0'),
        description: formData.description,
        category: formData.category,
        status: formData.status,
        target_date: formData.target_date
      };

      const response = await axiosInstance.post(API_ENDPOINTS.GOALS.ADD, payload);

      if (response.data.success) {
        setModalVisible(false);
        resetForm();
        fetchGoals();
        Alert.alert('Success', 'Goal added successfully');
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const handleUpdateGoal = async () => {
    if (!formData.title || !formData.target_amount || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId || !editingGoal) {
        return;
      }

      const payload = {
        user_id: parseInt(userId),
        title: formData.title,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || '0'),
        description: formData.description,
        category: formData.category,
        status: formData.status,
        target_date: formData.target_date
      };

      const response = await axiosInstance.put(
        API_ENDPOINTS.GOALS.UPDATE.replace(':goal_id', editingGoal.goal_id.toString()),
        payload
      );

      if (response.data.success) {
        setModalVisible(false);
        resetForm();
        fetchGoals();
        Alert.alert('Success', 'Goal updated successfully');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal');
    }
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
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      target_amount: '',
      current_amount: '0',
      description: '',
      category: '',
      status: 'pending',
      target_date: null
    });
    setEditingGoal(null);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      description: goal.description,
      category: goal.category,
      status: goal.status,
      target_date: goal.target_date
    });
    setModalVisible(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const getProgressColor = (current: number, target: number) => {
    const progress = (current / target) * 100;
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row justify-between items-center py-4">
          <Text className="text-2xl font-bold text-gray-900">Financial Goals</Text>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
            className="bg-blue-600 px-4 py-2 rounded-full"
          >
            <Text className="text-white font-semibold">Add Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Goals List */}
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchGoals} />
          }
        >
          {goals.length === 0 ? (
            <View className="flex-1 justify-center items-center py-8">
              <MaterialCommunityIcons name="target" size={48} color="#9ca3af" />
              <Text className="text-gray-500 text-lg mt-4">No goals yet</Text>
              <Text className="text-gray-400 text-base mt-2">
                Start by adding your first financial goal
              </Text>
            </View>
          ) : (
            goals.map((goal) => (
              <TouchableOpacity
                key={goal.goal_id}
                onPress={() => openEditModal(goal)}
                className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">
                      {goal.title}
                    </Text>
                    <Text className={`${getStatusColor(goal.status)} font-medium text-sm mt-1`}>
                      Status: {goal.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={goalCategories[goal.category]?.icon || 'help-circle-outline'}
                    size={24}
                    color="#4b5563"
                  />
                </View>

                {/* Progress Bar */}
                <View className="mt-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600">Progress</Text>
                    <Text className="text-gray-600">
                      ₱{goal.current_amount.toLocaleString()} / ₱{goal.target_amount.toLocaleString()}
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className={`h-full ${getProgressColor(goal.current_amount, goal.target_amount)}`}
                      style={{
                        width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%`
                      }}
                    />
                  </View>
                </View>

                <View className="mt-4 flex-row justify-between items-center">
                  <Text className="text-gray-500 text-sm">
                    {goal.description || 'No description'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteGoal(goal.goal_id)}
                    className="ml-4"
                  >
                    <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Add/Edit Goal Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            resetForm();
          }}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-6 h-4/5">
              <Text className="text-2xl font-bold text-gray-900 mb-6">
                {editingGoal ? 'Edit Goal' : 'Add New Goal'}
              </Text>

              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Form Fields */}
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
                      keyboardType="numeric"
                      value={formData.target_amount}
                      onChangeText={(text) => setFormData({ ...formData, target_amount: text })}
                      placeholder="Enter target amount"
                    />
                  </View>

                  <View>
                    <Text className="text-gray-600 mb-2">Current Amount</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-3"
                      keyboardType="numeric"
                      value={formData.current_amount}
                      onChangeText={(text) => setFormData({ ...formData, current_amount: text })}
                      placeholder="Enter current amount"
                    />
                  </View>

                  <View>
                    <Text className="text-gray-600 mb-2">Category*</Text>
                    <View className="border border-gray-300 rounded-lg p-3">
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {Object.entries(goalCategories).map(([key, { name, icon }]) => (
                          <TouchableOpacity
                            key={key}
                            onPress={() => setFormData({ ...formData, category: key })}
                            className={`mr-4 p-2 rounded-lg flex items-center ${
                              formData.category === key ? 'bg-blue-100' : 'bg-gray-50'
                            }`}
                          >
                            <MaterialCommunityIcons
                              name={icon}
                              size={24}
                              color={formData.category === key ? '#2563eb' : '#4b5563'}
                            />
                            <Text
                              className={`text-sm mt-1 ${
                                formData.category === key ? 'text-blue-600' : 'text-gray-600'
                              }`}
                            >
                              {name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View>
                    <Text className="text-gray-600 mb-2">Description</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-3"
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      placeholder="Enter description"
                      multiline
                    />
                  </View>

                  <View>
                    <Text className="text-gray-600 mb-2">Status</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          onPress={() => setFormData({ ...formData, status: status as any })}
                          className={`px-4 py-2 rounded-lg ${
                            formData.status === status ? 'bg-blue-100' : 'bg-gray-50'
                          }`}
                        >
                          <Text
                            className={
                              formData.status === status ? 'text-blue-600' : 'text-gray-600'
                            }
                          >
                            {status.replace('_', ' ').toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View className="flex-row justify-end space-x-4 mt-6 pt-2 border-t border-gray-200">
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  className="px-6 py-3 rounded-lg bg-gray-100"
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editingGoal ? handleUpdateGoal : handleAddGoal}
                  className="bg-blue-600 px-6 py-3 rounded-lg"
                >
                  <Text className="text-white font-semibold">
                    {editingGoal ? 'Update' : 'Add'} Goal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
