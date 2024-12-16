import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WeeklyAnalytics from '../(analytics)/weekly';
import MonthlyAnalytics from '../(analytics)/monthly';
import YearlyAnalytics from '../(analytics)/yearly';
import TabHeader from '../../components/TabHeader';

export default function Analytics() {
  const [selectedTab, setSelectedTab] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const renderContent = () => {
    switch (selectedTab) {
      case 'weekly':
        return <WeeklyAnalytics />;
      case 'monthly':
        return <MonthlyAnalytics />;
      case 'yearly':
        return <YearlyAnalytics />;
      default:
        return <WeeklyAnalytics />;
    }
  };

  const tabs = [
    { id: 'weekly', label: 'Weekly', icon: 'calendar-week' },
    { id: 'monthly', label: 'Monthly', icon: 'calendar-month' },
    { id: 'yearly', label: 'Yearly', icon: 'calendar-month' },
  ];

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      <StatusBar style="dark" />
      <TabHeader 
        title="Analytics" 
        subtitle="Track your financial trends"
      />
      
      <View className="flex-row px-4 py-2 gap-2">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl gap-2 ${
              selectedTab === tab.id ? 'bg-blue-500' : 'bg-gray-100'
            }`}
            onPress={() => setSelectedTab(tab.id as 'weekly' | 'monthly' | 'yearly')}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={20}
              color={selectedTab === tab.id ? '#FFFFFF' : '#666666'}
            />
            <Text
              className={`text-sm font-medium ${
                selectedTab === tab.id ? 'text-white' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="flex-1 px-4">
        {renderContent()}
      </View>
    </View>
  );
}
