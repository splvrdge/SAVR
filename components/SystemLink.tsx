import React from "react";
import { TouchableOpacity, Text, Image, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const SystemLink = ({ title, status, onPress }) => {
  const isLocked = status === "locked";
  const iconSource = isLocked
    ? require("../assets/icons/padlock.png")
    : require("../assets/icons/play-button.png");

  const screenWidth = Dimensions.get("window").width;
  const scaleFactor = screenWidth / 320;

  const responsiveFontSize = (size) => {
    const newSize = size * scaleFactor;
    return Math.round(newSize);
  };

  const content = (
    <>
      <Text
        className={`text-[18px] font-semibold ${
          isLocked ? "text-gray-400" : "text-white"
        } text-left pl-4`}
        style={{ fontSize: responsiveFontSize(13) }}
      >
        {title}
      </Text>
      <Image
        source={iconSource}
        style={{ width: 24, height: 24, marginRight: 16 }}
      />
    </>
  );

  return isLocked ? (
    <View className="bg-gray-200 rounded-[16px] h-14 mb-2 justify-between flex-row items-center">
      {content}
    </View>
  ) : (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={["#204BE4", "#3F67F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="bg-customGreen rounded-[16px] h-14 mb-2 justify-between flex-row items-center"
      >
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default SystemLink;
