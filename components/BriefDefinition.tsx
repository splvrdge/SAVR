import React, { useMemo } from "react";
import { View, Text, Dimensions } from "react-native";
import RenderHTML from "react-native-render-html";

const BriefDefinition = ({ title, htmlContent }) => {
  const screenWidth = Dimensions.get("window").width;
  const scaleFactor = screenWidth / 320;

  const responsiveFontSize = (size) => {
    const newSize = size * scaleFactor;
    return Math.round(newSize);
  };

  const memoizedRenderHTMLProps = React.useMemo(() => {
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
          paddingLeft: 0,
          marginTop: 0,
          marginBottom: 0,
        },
      },
    };
  }, [htmlContent, screenWidth, scaleFactor]);

  return (
    <View>
      <Text
        className="pb-2 font-semibold text-customBlue"
        style={{ fontSize: responsiveFontSize(10) }}
      >
        {title}
      </Text>
      <RenderHTML {...memoizedRenderHTMLProps} />
    </View>
  );
};

export default React.memo(BriefDefinition);
