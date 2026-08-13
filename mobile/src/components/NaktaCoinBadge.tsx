import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export function NaktaCoinBadge({
  amount,
  compact = false,
  style,
}: {
  amount: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return (
    <View
      accessibilityLabel={`Начислим ${amount} NAKTA Coin`}
      style={[styles.badge, compact && styles.badgeCompact, style]}
    >
      <Image
        accessibilityIgnoresInvertColors
        fadeDuration={0}
        resizeMethod="resize"
        resizeMode="contain"
        source={require("../../assets/coin.png")}
        style={[styles.coin, compact && styles.coinCompact]}
      />
      <View>
        <Text style={[styles.amount, compact && styles.amountCompact]}>+{Math.round(amount)}</Text>
        <Text style={[styles.label, compact && styles.labelCompact]}>NAKTA COIN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 35,
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: 7,
    borderWidth: 1,
    borderColor: "#F3B21A",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    shadowColor: "#B87900",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeCompact: {
    minHeight: 32,
    paddingVertical: 2,
    paddingRight: 6,
    borderRadius: 9,
    gap: 3,
  },
  coin: {
    width: 28,
    height: 28,
  },
  coinCompact: {
    width: 26,
    height: 26,
  },
  amount: {
    color: "#171717",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    lineHeight: 14,
    letterSpacing: -0.1,
  },
  amountCompact: {
    fontSize: 11,
    lineHeight: 12,
  },
  label: {
    color: "#A56B00",
    fontFamily: "Inter_700Bold",
    fontSize: 5.8,
    lineHeight: 7,
    letterSpacing: 0.3,
  },
  labelCompact: {
    fontSize: 5.2,
    lineHeight: 6,
  },
});
