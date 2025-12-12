import { COLORS } from "@/constants/colors";
import { styles } from "@/styles/home.styles";
import { ActivityIndicator, View } from "react-native";

export default function PageLoader() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}