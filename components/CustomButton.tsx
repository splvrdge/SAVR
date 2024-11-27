import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const CustomButton = ({ title, handlePress, containerStyles, isLoading, disabled }) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`bg-customGreen rounded-[10px] h-12 justify-center items-center ${containerStyles} ${isLoading || disabled ? 'opacity-50' : 'opacity-100'}`}
      disabled={isLoading || disabled}
    >
      <Text className={'text-white text-[16px] font-bold'}>{title}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
