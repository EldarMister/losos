import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
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
    <BottomSheet height={350} onClose={onClose} visible={visible}>
      <View style={styles.content}>
        <View style={styles.cardsRow}>
          <LinearGradient
            accessibilityLabel={`NAKTA Coin: ${coins}`}
            colors={["#FF711A", "#FF4108"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={[styles.card, styles.coinCard]}
          >
            <Text style={styles.coinTitle}>NAKTA Coin</Text>
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" style={styles.loader} />
            ) : (
              <Text style={styles.coinValue}>{coins}</Text>
            )}
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={require("../../assets/coin.png")}
              style={styles.coinImage}
            />
          </LinearGradient>

          <LinearGradient
            accessibilityLabel={`NFT: ${nftCount}`}
            colors={["#F6F1FF", "#E9DEFF"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={[styles.card, styles.nftCard]}
          >
            <Text style={styles.nftTitle}>NFT</Text>
            {loading ? (
              <ActivityIndicator color="#7C55E8" size="small" style={styles.loader} />
            ) : (
              <Text style={styles.nftValue}>{nftCount}</Text>
            )}
            <View style={styles.nftIcon}>
              <MaterialCommunityIcons
                color="#7C55E8"
                name="hexagon-multiple-outline"
                size={26}
              />
            </View>
          </LinearGradient>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <MaterialCommunityIcons
              color="#393939"
              name="information-outline"
              size={24}
            />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Как работают NAKTA Coin и NFT</Text>
            <Text style={styles.infoText}>
              Награды начисляются за завершённые заказы, не тратятся внутри
              приложения и выводятся на ваш криптокошелёк.
            </Text>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 0,
    height: 132,
    padding: 16,
    borderRadius: 24,
    overflow: "hidden",
  },
  coinCard: {
    elevation: 5,
    shadowColor: "#C93A00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  nftCard: {
    elevation: 3,
    shadowColor: "#7C55E8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  coinTitle: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
  },
  nftTitle: {
    color: "#65558D",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
  },
  coinValue: {
    marginTop: "auto",
    color: colors.white,
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
  },
  nftValue: {
    marginTop: "auto",
    color: "#251B3F",
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
  },
  loader: {
    marginTop: "auto",
    marginRight: "auto",
    marginBottom: 10,
  },
  coinImage: {
    position: "absolute",
    right: 10,
    bottom: 12,
    width: 52,
    height: 52,
  },
  nftIcon: {
    position: "absolute",
    right: 12,
    bottom: 14,
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    elevation: 3,
    shadowColor: "#6041B6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  infoCard: {
    minHeight: 104,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "#F7F7F8",
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
  },
  infoTitle: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    lineHeight: 20,
  },
  infoText: {
    marginTop: 5,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
});
