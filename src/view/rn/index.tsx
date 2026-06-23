import React from "react";

// `react-native` types are added as a devDependency in Phase 4 alongside
// `expo-font`. Until then, the placeholder is JSX-typed via a local
// stub so the dts build doesn't try to resolve RN types from the
// workspace playground.
type RnTextProps = { children?: React.ReactNode };
type RnViewProps = { children?: React.ReactNode; style?: unknown };

declare const Text: React.FC<RnTextProps>;
declare const View: React.FC<RnViewProps>;

export type OpenQuranViewRNProps = {
  page?: number;
  mushafLayout?: "hafs-v2" | "hafs-v4" | "hafs-unicode";
};

/**
 * Placeholder for the React Native export. Real implementation arrives
 * in Phase 6 of the rn-view-v2 rollout.
 */
export const OpenQuranViewRN: React.FC<OpenQuranViewRNProps> = () => (
  <View>
    <Text>open-quran-view RN: not yet implemented</Text>
  </View>
);

export default OpenQuranViewRN;
