import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const GradientText = ({ text }) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  maskedView: {
    height: 34,
    width: "100%",
  },
  maskContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  text: {
    fontSize: 28,
    fontStyle: "normal",
    fontWeight: "700",
    lineHeight: 34,
    margin: 0,
    padding: 0,
    color: "white",
  },
  gradient: {
    flex: 1,
  },
});

export default GradientText;
