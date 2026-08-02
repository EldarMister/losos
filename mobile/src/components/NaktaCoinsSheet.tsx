import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { authApi } from "../api";
import { useStore } from "../store";
import { colors } from "../theme";
import { Sheet } from "./Sheet";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NaktaCoinsSheet({ visible, onClose }: Props) {
  const store = useStore();
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !store.session) {
      if (!store.session) setCoins(0);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    authApi.profile(store.session)
      .then((profile) => {
        if (!cancelled) setCoins(profile.naktaCoins);
      })
      .catch(() => {
        if (!cancelled) setCoins(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store.session, visible]);

  return (
    <Sheet height={420} onClose={onClose} visible={visible}>
      <View style={styles.content}>
        <Text style={styles.title}>NAKTA Coin</Text>
        <Text style={styles.balanceLabel}>Ваш баланс NAKTA Coin</Text>
        <View style={styles.balanceRow}>
          {loading ? (
            <ActivityIndicator color={colors.orange} size="small" />
          ) : (
            <Text style={styles.balance}>{coins}</Text>
          )}
          <Text style={styles.coinLabel}>коинов</Text>
        </View>
        <Text style={styles.copy}>
          Накта-коины начисляются за заказы. Использовать их можно будет при
          оформлении, когда эта возможность станет доступна.
        </Text>
        <Pressable
          accessibilityLabel="Закрыть баланс Накта-коинов"
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
    paddingTop: 28,
  },
  title: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -0.8,
  },
  balanceLabel: {
    marginTop: 30,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  balanceRow: {
    minHeight: 48,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  balance: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    letterSpacing: -1.5,
  },
  coinLabel: {
    color: colors.ink,
    fontFamily: "Inter_500Medium",
    fontSize: 17,
  },
  copy: {
    marginTop: 18,
    color: "#3E3E3E",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
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
