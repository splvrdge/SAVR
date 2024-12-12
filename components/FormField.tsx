import { View, Text, TextInput, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Ionicons } from '@expo/vector-icons';

interface FormFieldProps {
  title?: string;
  value: string;
  handleChangeText: (text: string) => void;
  otherStyles?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  [key: string]: any;
}

const FormField: React.FC<FormFieldProps> = ({
  title = "",
  value,
  handleChangeText,
  otherStyles,
  secureTextEntry,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const isPassword = title.toLowerCase().includes('password');

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className="text-gray-600 font-pmedium mb-2">{title}</Text>
      <View className="w-full h-14 px-4 rounded-[10px] border-[1.3px] border-gray-400 focus:border-customGreen flex flex-row items-center">
        <TextInput
          className="flex-1 text-gray-600 font-psemibold text-[16px]"
          value={value}
          onChangeText={handleChangeText}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity 
            onPress={toggleShowPassword} 
            className="ml-2 p-2"
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormField;
