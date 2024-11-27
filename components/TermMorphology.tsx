import React, { useMemo } from "react";
import { View, Text, Dimensions } from "react-native";
import RenderHTML from "react-native-render-html";

const TermMorphology = ({ title, htmlContent }) => {
  const screenWidth = Dimensions.get("window").width;
  const scaleFactor = screenWidth / 320;

  const responsiveFontSize = (size) => {
    const newSize = size * scaleFactor;
    return Math.round(newSize);
  };

  const memoizedRenderHTMLProps = useMemo(() => {
    return {
      source: { html: htmlContent },
      contentWidth: screenWidth - 40,
      tagsStyles: {
        strong: { fontWeight: "bold" },
        body: {
          color: "#454545",
          fontSize: responsiveFontSize(10),
          lineHeight: 20,
        },
        ul: {
          listStyleType: "none",
          marginTop: 8,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 0,
          marginBottom: 0,
        },
        li: {
          backgroundColor: "#EEF2FF",
          width: Dimensions.get("window").width - responsiveFontSize(40),
          paddingHorizontal: 20,
          paddingVertical: 15,
          borderRadius: 10,
          marginTop: 10,
        },
      },
    };
  }, [htmlContent, screenWidth, scaleFactor]);

  return (
    <View>
      <View>
        <Text
          className="font-semibold text-customBlue pb-2"
          style={{ fontSize: responsiveFontSize(10) }}
        >
          {title}
        </Text>
        <RenderHTML {...memoizedRenderHTMLProps} />
      </View>
    </View>
  );
};

export default React.memo(TermMorphology);
