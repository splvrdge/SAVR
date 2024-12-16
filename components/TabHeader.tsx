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
      <View className="px-6 pb-2">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">{title}</Text>
            {subtitle ? (
              <Text className="text-gray-500 text-base mt-0.5">{subtitle}</Text>
            ) : null}
          </View>
          {rightComponent ? <View>{rightComponent}</View> : null}
        </View>

        {showSort && sortOptions.length > 0 ? (
          <View className="flex-row items-center justify-between mt-4">
            <View className="flex-1">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 0 }}
              >
                <View className="flex-row">
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => onSortChange(option.id)}
                      className={selectedSort === option.id 
                        ? 'mr-3 px-4 py-2.5 rounded-xl flex-row items-center bg-blue-50 border border-blue-100'
                        : 'mr-3 px-4 py-2.5 rounded-xl flex-row items-center bg-gray-50'
                      }
                    >
                      {option.icon ? (
                        <MaterialCommunityIcons
                          name={option.icon === 'sort-ascending' ? 'calendar-week' : option.icon === 'sort-descending' ? 'calendar-month' : option.icon}
                          size={18}
                          color={selectedSort === option.id ? themeColor : '#666666'}
                          style={{ marginRight: 6 }}
                        />
                      ) : null}
                      <Text
                        className={selectedSort === option.id 
                          ? 'font-medium text-blue-600'
                          : 'font-medium text-gray-600'
                        }
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

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
        ) : null}
      </View>
    </SafeAreaView>
  );
}
