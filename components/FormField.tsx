import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';

import { icons } from '../constants/icons';

const FormField = ({ title = '', value, handleChangeText, otherStyles, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className='text-gray-600 font-pmedium'>{title}</Text>
      <View className='w-full h-14 px-4 rounded-[10px] border-[1.3px] border-gray-400 focus:border-customGreen flex flex-row items-center'>
        <TextInput
          className="flex-1 text-gray-600 font-psemibold text-[16px]"
          value={value}
          onChangeText={handleChangeText}
          secureTextEntry={(title === 'Password' || title === 'Confirm Password') && !showPassword}
          {...props}
        />
        {(title === 'Password' || title === 'Confirm Password') && (
          <TouchableOpacity onPress={toggleShowPassword} className="ml-2">
            <Image
              source={showPassword ? icons.eye : icons.eyeHide}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormField;
