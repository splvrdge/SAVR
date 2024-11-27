import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const GradientText = ({ text }) => {
  return (
    <View style={styles.container}>
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <View style={styles.maskContainer}>
            <Text style={styles.text}>{text}</Text>
          </View>
        }
      >
        <LinearGradient
          colors={["#2E8B57", "#4CAF50"]} // #2E8B57 main
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </MaskedView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  maskedView: {
    height: 34, // Match height to lineHeight to ensure gradient covers the text
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
    color: "black",
    margin: 0,
    padding: 0,
  },
  gradient: {
    flex: 1,
  },
});

export default GradientText;
