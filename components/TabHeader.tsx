import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SortOption {
  id: string;
  label: string;
  icon?: string;
}

interface TabHeaderProps {
  title: string;
  subtitle?: string;
  sortOptions?: SortOption[];
  selectedSort?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortId: string) => void;
  onSortOrderChange?: () => void;
  themeColor?: string;
  backgroundColor?: string;
  showSort?: boolean;
  rightComponent?: React.ReactNode;
}

export default function TabHeader({
  title,
  subtitle,
  sortOptions = [],
  selectedSort = '',
  sortOrder = 'desc',
  onSortChange = () => {},
  onSortOrderChange = () => {},
  themeColor = '#2563eb',
  backgroundColor = '#ffffff',
  showSort = true,
  rightComponent,
}: TabHeaderProps) {
  return (
    <SafeAreaView edges={['top']} className="bg-white">
      <StatusBar style="dark" backgroundColor="transparent" />
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">{title}</Text>
            {subtitle && (
              <Text className="text-gray-500 text-base mt-0.5">{subtitle}</Text>
            )}
          </View>
          {rightComponent}
        </View>

        {showSort && sortOptions.length > 0 && (
          <View className="flex-row items-center justify-between mt-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row flex-1"
            >
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => onSortChange(option.id)}
                  className={`
                    mr-3 px-4 py-2.5 rounded-xl flex-row items-center
                    ${selectedSort === option.id 
                      ? 'bg-blue-50 border border-blue-100' 
                      : 'bg-gray-50'
                    }
                  `}
                >
                  {option.icon && (
                    <MaterialCommunityIcons
                      name={option.icon === 'sort-ascending' ? 'calendar-week' : option.icon === 'sort-descending' ? 'calendar-month' : option.icon}
                      size={18}
                      color={selectedSort === option.id ? themeColor : '#666666'}
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text
                    className={`font-medium ${
                      selectedSort === option.id 
                        ? 'text-blue-600' 
                        : 'text-gray-600'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={onSortOrderChange}
              className="bg-gray-50 p-2.5 rounded-xl ml-2"
            >
              <MaterialCommunityIcons
                name={sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'}
                size={22}
                color="#1f2937"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
