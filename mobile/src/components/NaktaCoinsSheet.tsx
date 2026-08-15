import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { authApi } from "../api";
import { useStore } from "../store";
import { colors } from "../theme";
import { BottomSheet } from "./BottomSheet";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NaktaCoinsSheet({ visible, onClose }: Props) {
  const store = useStore();
  const [coins, setCoins] = useState(0);
  const [nftCount, setNftCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !store.session) {
      if (!store.session) {
        setCoins(0);
        setNftCount(0);
      }
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    authApi.profile(store.session)
      .then((profile) => {
        if (!cancelled) {
          setCoins(profile.naktaCoins);
          setNftCount(profile.nfts?.length ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCoins(0);
          setNftCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store.session, visible]);

  return (
    <BottomSheet height={430} onClose={onClose} visible={visible}>
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
        <View style={styles.nftRow}>
          <View style={styles.nftIcon}>
            <Text style={styles.nftIconText}>NFT</Text>
          </View>
          <View>
            <Text style={styles.nftLabel}>Ваши NFT</Text>
            <Text style={styles.nftCount}>{nftCount}</Text>
          </View>
        </View>
        <Text style={styles.copy}>
          NAKTA Coin и NFT начисляются за завершённые заказы, но хранятся
          отдельно. NFT можно вывести на свой криптокошелёк в разделе баланса.
        </Text>
        <Pressable
          accessibilityLabel="Закрыть баланс Накта-коинов"
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <Text style={styles.closeText}>Понятно</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  title: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -0.8,
  },
  balanceLabel: {
    marginTop: 16,
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
  nftRow: {
    minHeight: 62,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EEE8FF",
  },
  nftIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C55E8",
  },
  nftIconText: {
    color: colors.white,
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  nftLabel: {
    color: "#65558D",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  nftCount: {
    color: "#251B3F",
    fontFamily: "Inter_700Bold",
    fontSize: 21,
  },
  copy: {
    marginTop: 10,
    color: "#3E3E3E",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
  },
  closeButton: {
    height: 54,
    marginTop: 16,
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
