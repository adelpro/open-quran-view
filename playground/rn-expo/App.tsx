import { OpenQuranViewRN } from "open-quran-view/view/rn";
import { View } from "react-native";

/**
 * Playground entry for the React Native view. Renders page 1 of
 * Al-Fatiha using hafs-v2 (the default QCF v2 Mushaf).
 */
export default function Home() {
  return (
    <View style={{ flex: 1 }}>
      <OpenQuranViewRN page={1} theme="light" />
    </View>
  );
}