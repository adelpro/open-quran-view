/**
 * navigation-controls.tsx — React Native equivalent of the web controls.
 *
 * Same prop surface as src/view/react/navigation-controls.tsx, except the
 * fullscreen toggle is a no-op on RN (no equivalent DOM Fullscreen API).
 * Consumers on RN can ignore that callback.
 */
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";

const clamp = (min: number, val: number, max: number) =>
  Math.max(min, Math.min(val, max));

export interface NavigationControlsProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (page: number) => void;
  theme: "light" | "dark";
  width: number;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

function NavButton({
  disabled,
  onPress,
  theme,
  children,
  accessibilityLabel,
}: {
  disabled?: boolean;
  onPress: () => void;
  theme: "light" | "dark";
  children: React.ReactNode;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor:
            theme === "dark"
              ? "rgba(255,255,255,0.2)"
              : "rgba(0,0,0,0.1)",
          color: theme === "dark" ? "#fff" : "#2c3e50",
          opacity: disabled ? 0.3 : pressed ? 0.7 : 1,
          backgroundColor: pressed
            ? theme === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.05)"
            : "transparent",
        },
      ]}
    >
      <Text
        style={{
          color: theme === "dark" ? "#fff" : "#2c3e50",
          fontSize: 18,
          includeFontPadding: false,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentPage,
  totalPages,
  onNext,
  onPrev,
  onGoTo,
  theme,
  width,
  onFullscreenToggle,
}) => {
  const [inputValue, setInputValue] = useState(String(currentPage));
  const [showInput, setShowInput] = useState(false);

  const fontSizeNav = clamp(14, width * 0.023, 18);

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const submit = () => {
    const pageNum = Number.parseInt(inputValue, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onGoTo(pageNum);
      setShowInput(false);
    } else {
      setInputValue(String(currentPage));
    }
  };

  const barStyle: ViewStyle = {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 2,
    backgroundColor:
      theme === "dark" ? "rgba(26,26,46,0.85)" : "rgba(255,255,255,0.85)",
    borderRadius: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
  };

  return (
    <View style={barStyle} pointerEvents="box-none">
      <NavButton
        disabled={currentPage <= 1}
        onPress={onPrev}
        theme={theme}
        accessibilityLabel="Previous page"
      >
        {"‹"}
      </NavButton>

      {showInput ? (
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={submit}
          onBlur={() => {
            // Close after a short delay to let submit register
            setTimeout(() => setShowInput(false), 200);
          }}
          keyboardType="number-pad"
          maxLength={3}
          autoFocus
          style={{
            width: 60,
            height: 32,
            textAlign: "center",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor:
              theme === "dark"
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)",
            borderRadius: 8,
            backgroundColor:
              theme === "dark"
                ? "rgba(255,255,255,0.05)"
                : "rgba(255,255,255,0.9)",
            color: theme === "dark" ? "#fff" : "#2c3e50",
            fontSize: fontSizeNav,
            padding: 0,
          }}
        />
      ) : (
        <Pressable
          onPress={() => setShowInput(true)}
          accessibilityRole="button"
          accessibilityLabel={`Current page ${currentPage} of ${totalPages}, tap to enter page number`}
          style={({ pressed }) => [
            {
              backgroundColor: pressed
                ? theme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.03)"
                : "transparent",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            },
          ]}
        >
          <Text
            style={{
              color:
                theme === "dark"
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(0,0,0,0.6)",
              fontSize: fontSizeNav,
              fontWeight: "500",
            }}
          >
            {currentPage} / {totalPages}
          </Text>
        </Pressable>
      )}

      <NavButton
        disabled={currentPage >= totalPages}
        onPress={onNext}
        theme={theme}
        accessibilityLabel="Next page"
      >
        {"›"}
      </NavButton>

      {onFullscreenToggle && (
        <NavButton
          onPress={onFullscreenToggle}
          theme={theme}
          accessibilityLabel="Toggle fullscreen"
        >
          {"⛶"}
        </NavButton>
      )}
    </View>
  );
};

export default NavigationControls;

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
