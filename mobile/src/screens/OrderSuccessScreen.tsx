import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  const sound = useAudioPlayer(require("../../assets/order.mp3"));
  const soundStatus = useAudioPlayerStatus(sound);
  const soundPlayed = useRef(false);
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const cardTranslateY = useRef(new Animated.Value(8)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const label = order.orderNumber ? `№ ${order.orderNumber}` : `№ ${order.id.slice(0, 8)}`;

  useEffect(() => {
    if (!soundStatus.isLoaded || soundPlayed.current) return;
    soundPlayed.current = true;
    sound.play();
  }, [sound, soundStatus.isLoaded]);

  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const easing = Easing.bezier(0.16, 1, 0.3, 1);
    const showFinalState = () => {
      cardOpacity.setValue(1);
      cardScale.setValue(1);
      cardTranslateY.setValue(0);
      checkOpacity.setValue(1);
      checkScale.setValue(1);
    };
    const startAnimation = () => {
      animation = Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 480,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 480,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 480,
          easing,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(180),
          Animated.parallel([
            Animated.timing(checkOpacity, {
              toValue: 1,
              duration: 450,
              easing,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(checkScale, {
                toValue: 1.12,
                duration: 450,
                easing,
                useNativeDriver: true,
              }),
              Animated.timing(checkScale, {
                toValue: 1,
                duration: 300,
                easing,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ]);
      animation.start();
    };

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!active) return;
        if (reduceMotion) showFinalState();
        else startAnimation();
      })
      .catch(() => {
        if (active) startAnimation();
      });

    return () => {
      active = false;
      animation?.stop();
    };
  }, [cardOpacity, cardScale, cardTranslateY, checkOpacity, checkScale]);

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
      <Animated.View
        style={[
          styles.content,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.icon,
            { opacity: checkOpacity, transform: [{ scale: checkScale }] },
          ]}
        >
          <MaterialCommunityIcons name="check-bold" size={57} color={colors.orange} />
        </Animated.View>
        <Text style={styles.title}>Заказ принят!</Text>
        <Text style={styles.order}>Заказ {label}</Text>
      </Animated.View>
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
});
