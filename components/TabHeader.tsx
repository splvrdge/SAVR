import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SortOption {
  id: string;
  label: string;
}

interface TabHeaderProps {
  title: string;
  sortOptions?: SortOption[];
  selectedSort?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortId: string) => void;
  onSortOrderChange?: () => void;
}

export default function TabHeader({
  title,
  sortOptions = [],
  selectedSort = '',
  sortOrder = 'desc',
  onSortChange = () => {},
  onSortOrderChange = () => {},
}: TabHeaderProps) {
  return (
    <View className="p-4 border-b border-gray-100">
      <Text className="text-2xl font-bold text-gray-800 mb-4">
        {title}
      </Text>
      
      {sortOptions.length > 0 && (
        <View className="flex-row justify-between items-center">
          <View className="flex-row space-x-2">
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => onSortChange(option.id)}
                className={`px-4 py-2 rounded-full border ${
                  selectedSort === option.id ? 'bg-blue-100 border-blue-200' : 'border-gray-200'
                }`}
              >
                <Text className={selectedSort === option.id ? 'text-blue-600' : 'text-gray-600'}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity onPress={onSortOrderChange} className="p-2">
            <MaterialCommunityIcons
              name={sortOrder === 'desc' ? 'sort-descending' : 'sort-ascending'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
