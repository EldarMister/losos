import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../theme";
import type { CreatedOrder } from "../types";

type Props = {
  order: CreatedOrder;
  onDone: () => void;
};

export function OrderSuccessScreen({ order, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const label = order.orderNumber ? `№ ${order.orderNumber}` : `№ ${order.id.slice(0, 8)}`;
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.icon}>
          <MaterialCommunityIcons name="check-bold" size={57} color={colors.orange} />
        </View>
        <Text style={styles.title}>Заказ принят!</Text>
        <Text style={styles.order}>Заказ {label}</Text>
        <Text style={styles.copy}>
          Кухня уже получила заказ. Когда подключим сервер push-токенов, статус будет приходить прямо в уведомления.
        </Text>
      </View>
      <PrimaryButton label="Вернуться в каталог" onPress={onDone} tone="white" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 22,
    backgroundColor: colors.orange,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  title: {
    marginTop: 24,
    color: colors.white,
    fontSize: 32,
    fontWeight: "900",
  },
  order: {
    marginTop: 9,
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  copy: {
    maxWidth: 340,
    marginTop: 14,
    color: "rgba(255,255,255,0.84)",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
