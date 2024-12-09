import React, { useMemo } from "react";
import { View, Text, Dimensions } from "react-native";
import RenderHTML from "react-native-render-html";

const Roots = ({ title, htmlContent }) => {
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
          marginBottom: 0,
          paddingHorizontal: 0,
          borderLeftWidth: 3,
          borderLeftColor: "#1B42CE",
        },
        li: {
          paddingHorizontal: responsiveFontSize(16),
          marginHorizontal: 5,
          paddingVertical: 6,
          justifyContent: "space-between",
          marginRight: responsiveFontSize(20),
        },
      },
    };
  }, [htmlContent, screenWidth, scaleFactor]);

  return (
    <View>
      <View>
        <Text
          className="pb-1 font-semibold text-customGreen"
          style={{ fontSize: responsiveFontSize(10) }}
        >
          {title}
        </Text>
        <RenderHTML {...memoizedRenderHTMLProps} />
      </View>
    </View>
  );
};

export default React.memo(Roots);
