// Stub for `react-native` used by vitest. The real package's index.js
// re-exports Flow type definitions (./index.js.flow) which vite can't
// transform. This shim provides just enough surface for the RN view
// components in src/view/rn/ to render under @testing-library/react.

import React from "react";

type AnyProps = { children?: React.ReactNode } & Record<string, unknown>;

const passthrough = (name: string) => {
  const Cmp = ({ children, ...rest }: AnyProps) =>
    React.createElement(name, rest, children);
  Cmp.displayName = name;
  return Cmp;
};

export const View = passthrough("View");
export const Text = passthrough("Text");
export const ActivityIndicator = passthrough("ActivityIndicator");
export const ScrollView = passthrough("ScrollView");
export const StyleSheet = {
  create: <T extends object>(s: T): T => s,
  flatten: (s: unknown) => s,
};
export const I18nManager = {
  allowRTL: () => {},
  forceRTL: () => {},
  isRTL: false,
};
export const useWindowDimensions = () => ({ width: 320, height: 640 });

// Pressable is the only one with non-trivial behavior: it must accept
// onPress and render with role="button" so testing-library can find it.
type PressableProps = AnyProps & { onPress?: () => void };
export const Pressable = ({
  children,
  onPress,
  ...rest
}: PressableProps) =>
  React.createElement(
    "div",
    { role: "button", onClick: onPress, ...rest },
    children,
  );
Pressable.displayName = "Pressable";