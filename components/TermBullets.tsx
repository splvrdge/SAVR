import React from "react";
import { View, Text, Dimensions } from "react-native";
import RenderHTML, {
  TRenderEngineProvider,
  RenderHTMLConfigProvider,
} from "react-native-render-html";

const TermBullets = ({ termDetails = {} }) => {
  const screenWidth = Dimensions.get("window").width;
  const scaleFactor = screenWidth / 320;

  const responsiveFontSize = (size) => {
    const newSize = size * scaleFactor;
    return Math.round(newSize);
  };

  const getTagStyles = (fontSize) => ({
    body: {
      paddingRight: responsiveFontSize(60),
      paddingLeft: responsiveFontSize(8),
      fontSize: responsiveFontSize(fontSize),
      fontWeight: "bold",
      color: "#333333",
    },
  });

  const memoizedOppositeTermProps = React.useMemo(() => {
    return {
      source: { html: termDetails.opposite_term || "" },
      contentWidth: screenWidth - 40,
      tagsStyles: getTagStyles(10),
    };
  }, [termDetails.opposite_term, screenWidth]);

  const memoizedActualTermProps = React.useMemo(() => {
    return {
      source: { html: termDetails.actual_term || "" },
      contentWidth: screenWidth - 40,
      tagsStyles: getTagStyles(10),
    };
  }, [termDetails.actual_term, screenWidth]);

  const memoizedFocusProps = React.useMemo(() => {
    return {
      source: { html: termDetails.focus || "" },
      contentWidth: screenWidth - 40,
      tagsStyles: getTagStyles(10),
    };
  }, [termDetails.focus, screenWidth]);

  const memoizedPluralFormProps = React.useMemo(() => {
    return {
      source: { html: termDetails.plural_form || "" },
      contentWidth: screenWidth - 40,
      tagsStyles: getTagStyles(10),
    };
  }, [termDetails.plural_form, screenWidth]);

  return (
    <TRenderEngineProvider>
      <RenderHTMLConfigProvider>
        <View
          className="px-5 rounded-[12px] py-2 mt-8"
          style={{ backgroundColor: "#EEF2FF" }}
        >
          <View style={{ marginTop: 10 }}>
            {termDetails?.opposite_term && (
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{ fontSize: responsiveFontSize(10), color: "#4B5563" }}
                >
                  Opposite Term:
                </Text>
                <RenderHTML {...memoizedOppositeTermProps} />
              </View>
            )}
            {termDetails?.actual_term && (
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{ fontSize: responsiveFontSize(10), color: "#4B5563" }}
                >
                  Actual Term:
                </Text>
                <RenderHTML {...memoizedActualTermProps} />
              </View>
            )}
            {termDetails?.focus && (
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{ fontSize: responsiveFontSize(10), color: "#4B5563" }}
                >
                  Word in Focus:
                </Text>
                <RenderHTML {...memoizedFocusProps} />
              </View>
            )}
          </View>
        </View>
      </RenderHTMLConfigProvider>
    </TRenderEngineProvider>
  );
};

export default React.memo(TermBullets);
