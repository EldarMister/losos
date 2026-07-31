import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveImageUrl, WEB_URL } from "../api";
import { colors, radii } from "../theme";
import type { Promotion } from "../types";

type Props = {
  promotions: Promotion[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

export function PromotionViewer({
  promotions,
  initialIndex,
  visible,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [initialIndex, visible]);

  const promotion = promotions[index];
  if (!promotion) return null;

  const move = (direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0) return;
    if (next >= promotions.length) {
      onClose();
      return;
    }
    setIndex(next);
  };

  const openCta = () => {
    if (promotion.ctaUrl) {
      const target = /(?:^|\.)mnogolososya\.ru/i.test(promotion.ctaUrl)
        ? `${WEB_URL}/support`
        : promotion.ctaUrl.startsWith("/")
          ? `${WEB_URL}${promotion.ctaUrl}`
          : promotion.ctaUrl;
      Linking.openURL(target).catch(() => undefined);
    } else {
      move(1);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      visible={visible}
    >
      <ImageBackground
        resizeMode="cover"
        resizeMethod="resize"
        source={{ uri: resolveImageUrl(promotion.image) }}
        style={styles.root}
      >
        <View style={[styles.safe, { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.progressRow}>
            {promotions.map((item, itemIndex) => (
              <View
                key={item.id}
                style={[styles.progress, itemIndex <= index && styles.progressActive]}
              />
            ))}
          </View>
          <View style={styles.topRow}>
            <Pressable accessibilityLabel="Закрыть акцию" hitSlop={8} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={29} color={colors.white} />
            </Pressable>
          </View>
          <View style={styles.tapZones}>
            <Pressable accessibilityLabel="Предыдущая акция" onPress={() => move(-1)} style={styles.tapZone} />
            <Pressable accessibilityLabel="Следующая акция" onPress={() => move(1)} style={styles.tapZone} />
          </View>
          {promotion.cta?.trim() ? (
            <Pressable
              accessibilityRole="button"
              onPress={openCta}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            >
              <Text style={styles.ctaText}>{promotion.cta}</Text>
            </Pressable>
          ) : null}
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.orange,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 18,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
  },
  progress: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  progressActive: {
    backgroundColor: colors.white,
  },
  topRow: {
    minHeight: 36,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  tapZones: {
    flex: 1,
    marginHorizontal: -18,
    flexDirection: "row",
  },
  tapZone: {
    flex: 1,
  },
  cta: {
    minHeight: 54,
    borderRadius: radii.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  ctaPressed: {
    transform: [{ scale: 0.985 }],
  },
  ctaText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
});
