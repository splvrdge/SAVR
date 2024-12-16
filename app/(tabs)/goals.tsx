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
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_ENDPOINTS } from '@/constants/API';
import axiosInstance from "@/utils/axiosConfig";
import { StatusBar } from 'expo-status-bar';
import TabHeader from '../../components/TabHeader';
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  progressContainer: {
    marginVertical: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8F0FE',
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  dateText: {
    fontSize: 14,
    color: '#666666',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#3B82F6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  contributionButton: {
    backgroundColor: '#EBF5FF',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  contributionButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  daysRemaining: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
});

export default function Goals() {
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [editingGoal, setEditingGoal] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
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

  const handleShowContributions = async (goal: any) => {
    setSelectedGoal(goal);
    setShowContributionsModal(true);
    await fetchContributions(goal.goal_id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <TabHeader 
        title="Goals" 
        subtitle={`${goals.length} active goals`}
        rightComponent={
          <TouchableOpacity onPress={toggleSortOrder} style={{ padding: 8 }}>
            <MaterialCommunityIcons 
              name={sortOrder === 'desc' ? 'sort-descending' : 'sort-ascending'} 
              size={24} 
              color="#3B82F6" 
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="target"
              size={64}
              color="#3B82F6"
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Goals Yet</Text>
            <Text style={styles.emptyDescription}>
              Start setting financial goals to track your progress and achieve your dreams.
            </Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.submitButtonText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sortedGoals.map((goal) => (
            <View key={goal.goal_id} style={styles.goalCard}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              {goal.description && (
                <Text style={styles.goalDescription}>{goal.description}</Text>
              )}
              
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <Text style={styles.amountText}>
                    ₱{goal.current_amount.toFixed(2)} / ₱{goal.target_amount.toFixed(2)}
                  </Text>
                  <Text style={styles.progressText}>
                    {goal.progress_percentage.toFixed(1)}%
                  </Text>
                </View>
                
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, goal.progress_percentage)}%` }
                    ]} 
                  />
                </View>
                
                <View style={styles.progressInfo}>
                  <Text style={styles.dateText}>Target: {goal.target_date}</Text>
                  <Text style={styles.daysRemaining}>
                    {goal.days_remaining} days remaining
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.contributionButton}
                onPress={() => {
                  setSelectedGoal(goal);
                  setShowContributionModal(true);
                }}
              >
                <MaterialCommunityIcons name="plus-circle" size={16} color="#3B82F6" />
                <Text style={styles.contributionButtonText}>Add Contribution</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {!isLoading && goals.length > 0 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Add/Edit Goal Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingGoal ? 'Edit Goal' : 'New Goal'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>

                <ScrollView>
                  <TextInput
                    style={styles.input}
                    placeholder="Goal Title"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                  />
                  <TextInput
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    placeholder="Description (Optional)"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Target Amount (₱)"
                    value={formData.target_amount}
                    onChangeText={(text) => setFormData({ ...formData, target_amount: formatAmount(text) })}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Target Date (MM-DD-YYYY)"
                    value={formData.target_date}
                    onChangeText={(text) => setFormData({ ...formData, target_date: formatDateInput(text) })}
                    keyboardType="numeric"
                    maxLength={10}
                  />

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.submitButtonText}>
                      {isSubmitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Contribution Modal */}
      <Modal
        visible={showContributionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContributionModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Contribution</Text>
                  <TouchableOpacity onPress={() => setShowContributionModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Amount (₱)"
                  value={formData.contribution_amount}
                  onChangeText={(text) => setFormData({ ...formData, contribution_amount: formatAmount(text) })}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Notes (Optional)"
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleAddContribution}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Adding...' : 'Add Contribution'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowContributionModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}