import React from "react";
import { TouchableOpacity, Text, View, Dimensions, Image } from "react-native";

import bookmarkIcon from "../assets/icons/ribbon-filled.png";
import bookmarkBorderIcon from "../assets/icons/ribbon.png";

const screenWidth = Dimensions.get("window").width;
const scaleFactor = screenWidth / 320;

const responsiveFontSize = (size) => {
  const newSize = size * scaleFactor;
  return Math.round(newSize);
};

const TermLink = ({ title, onPress, isBookmarked, onBookmarkToggle }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.termLinkContainer}>
        <Text
          style={[
            styles.termText,
            {
              fontSize: responsiveFontSize(12),
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <TouchableOpacity
          onPress={onBookmarkToggle}
          style={styles.bookmarkButton}
        >
          <Image
            source={isBookmarked ? bookmarkIcon : bookmarkBorderIcon}
            style={{
              width: responsiveFontSize(20),
              height: responsiveFontSize(20),
              tintColor: "#4a4a4a",
            }}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  termLinkContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    height: 56,
    marginBottom: 8,
    alignItems: "center",
    flexDirection: "row",
    borderColor: "#d0d0d0",
    borderWidth: 1,
    paddingHorizontal: responsiveFontSize(12),
  },
  termText: {
    color: "#4a4a4a",
    fontWeight: "600",
    flex: 1,
    textAlign: "left",
    flexShrink: 1,
  },
  bookmarkButton: {
    marginLeft: responsiveFontSize(12),
  },
};

export default TermLink;
