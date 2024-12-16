import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    { id: 'yearly', label: 'Yearly', icon: 'calendar-year' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <TabHeader 
        title="Analytics" 
        subtitle="Track your financial trends"
      />
      
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.selectedTab
            ]}
            onPress={() => setSelectedTab(tab.id as 'weekly' | 'monthly' | 'yearly')}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={20}
              color={selectedTab === tab.id ? '#FFFFFF' : '#666666'}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.id && styles.selectedTabText
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  selectedTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});
