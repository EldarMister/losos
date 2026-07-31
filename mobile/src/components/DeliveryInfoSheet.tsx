import { Pressable, StyleSheet, Text, View } from "react-native";
import { useStore } from "../store";
import { colors } from "../theme";
import { Sheet } from "./Sheet";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function kitchenSchedule(
  is24Hours: boolean | undefined,
  openTime: string | undefined,
  closeTime: string | undefined,
) {
  if (is24Hours) return "Ежедневно, без выходных\nКруглосуточно";
  if (openTime && closeTime) return `Ежедневно, без выходных\n${openTime} – ${closeTime}`;
  return "График работы уточняется";
}

export function DeliveryInfoSheet({ visible, onClose }: Props) {
  const store = useStore();
  const region = store.activeRegion;
  const address = store.location?.address || "Адрес доставки пока не выбран";
  const schedule = kitchenSchedule(
    region?.deliveryIs24Hours,
    region?.deliveryOpenTime,
    region?.deliveryCloseTime,
  );

  return (
    <Sheet height={610} onClose={onClose} visible={visible}>
      <View style={styles.content}>
        <Text style={styles.address}>{address}</Text>

        <Text style={styles.deliveryTitle}>Время доставки ~35 мин</Text>
        <Text style={styles.deliveryCopy}>
          Это среднее время доставки по вашему адресу. Чаще всего укладываемся
          в него, но иногда можем привезти заказ чуть раньше или позже.
          {"\n"}Сделать заказ можно только к ближайшему времени.
        </Text>

        <Text style={styles.kitchenTitle}>Время работы кухни</Text>
        <Text style={styles.schedule}>{schedule}</Text>

        <Pressable
          accessibilityLabel="Закрыть информацию о доставке"
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <Text style={styles.closeText}>Понятно</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
  },
  address: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  deliveryTitle: {
    marginTop: 32,
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
  },
  deliveryCopy: {
    marginTop: 16,
    color: "#3E3E3E",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 20,
  },
  kitchenTitle: {
    marginTop: 27,
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
  },
  schedule: {
    marginTop: 16,
    color: "#3E3E3E",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 20,
  },
  closeButton: {
    height: 60,
    marginTop: "auto",
    marginBottom: 10,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  closeButtonPressed: {
    opacity: 0.74,
  },
  closeText: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
