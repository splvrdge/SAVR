import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
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
  themeColor?: string; // New prop for customizing the theme color
}

export default function TabHeader({
  title,
  sortOptions = [],
  selectedSort = '',
  sortOrder = 'desc',
  onSortChange = () => {},
  onSortOrderChange = () => {},
  themeColor = '#0066FF', // Default color is blue
}: TabHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {sortOptions.length > 0 && (
        <View style={styles.sortContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortOptionsContainer}
          >
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => onSortChange(option.id)}
                style={[
                  styles.sortOption,
                  selectedSort === option.id && { backgroundColor: themeColor },
                ]}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    selectedSort === option.id && { color: '#FFFFFF' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={onSortOrderChange}
            style={styles.sortOrderButton}
          >
            <MaterialCommunityIcons
              name={sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'}
              size={24}
              color={themeColor}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortOptionsContainer: {
    paddingRight: 8,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  sortOrderButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
});
