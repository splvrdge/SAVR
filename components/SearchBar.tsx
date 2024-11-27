import React from "react";
import { View, TextInput, TouchableOpacity, Text, Image } from "react-native";

const SearchBar = ({ searchTerm, setSearchTerm, onSearch }) => {
  return (
    <View className="flex-row items-center mt-4">
      <TextInput
        className="flex-1 h-12 border border-gray-400 rounded-lg px-4 text-[16px]"
        placeholder="Search for terms"
        placeholderTextColor="gray"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <TouchableOpacity onPress={onSearch}>
        <Image
          source={require("../assets/icons/search.png")}
          className="w-[50px] h-[50px] ml-3"
        />
      </TouchableOpacity>
    </View>
  );
};

export default SearchBar;
