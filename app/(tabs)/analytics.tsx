import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Tabs } from 'expo-router';
import WeeklyAnalytics from '../(analytics)/weekly';
import MonthlyAnalytics from '../(analytics)/monthly';
import YearlyAnalytics from '../(analytics)/yearly';

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Analytics</Text>
      </View>
      <View style={{ flexDirection: 'row', padding: 16, paddingTop: 0 }}>
        {['weekly', 'monthly', 'yearly'].map((tab) => (
          <View
            key={tab}
            style={{
              flex: 1,
              marginRight: tab !== 'yearly' ? 8 : 0,
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: selectedTab === tab ? '#7C3AED' : '#F0F0F0',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => setSelectedTab(tab as 'weekly' | 'monthly' | 'yearly')}
            >
              <Text
                style={{
                  color: selectedTab === tab ? '#FFFFFF' : '#000000',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}
