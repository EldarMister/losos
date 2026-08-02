import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { formatMoney } from "../money";

type Props = {
  value: number;
  format?: (value: number) => string;
  /** Text appearance. Kept as `style` for a drop-in replacement for Text. */
  style?: StyleProp<TextStyle>;
  /** Alias for `style`, useful when the component also receives a container style. */
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  height?: number;
  duration?: number;
  accessibilityLabel?: string;
};

type DrumProps = {
  digit: number;
  digitHeight: number;
  digitWidth: number;
  duration: number;
  place: number;
  reducedMotion: boolean;
  textStyle?: TextStyle;
};

const DIGITS = Array.from({ length: 10 }, (_, digit) => String(digit));

function glyphStyle(style: TextStyle): TextStyle {
  const {
    alignSelf,
    bottom,
    flex,
    flexBasis,
    flexGrow,
    flexShrink,
    height,
    left,
    margin,
    marginBottom,
    marginEnd,
    marginHorizontal,
    marginLeft,
    marginRight,
    marginStart,
    marginTop,
    marginVertical,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    position,
    right,
    top,
    width,
    ...textOnlyStyle
  } = style;
  // The layout fields belong to the ticker as a whole. Applying minWidth to
  // every inner row clips compact one-digit counters.
  return textOnlyStyle;
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    const getReducedMotion = AccessibilityInfo.isReduceMotionEnabled;
    if (typeof getReducedMotion === "function") {
      void getReducedMotion().then((enabled) => {
        if (mounted) setReducedMotion(enabled);
      });
    }

    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reducedMotion;
}

/** One vertical slot-machine reel. It is keyed by the digit's place value. */
const DigitDrum = memo(function DigitDrum({
  digit,
  digitHeight,
  digitWidth,
  duration,
  place,
  reducedMotion,
  textStyle,
}: DrumProps) {
  const translateY = useSharedValue(-digit * digitHeight);
  const previousDigit = useRef(digit);
  const previousHeight = useRef(digitHeight);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    const target = -digit * digitHeight;
    const changed = previousDigit.current !== digit || previousHeight.current !== digitHeight;
    previousDigit.current = digit;
    previousHeight.current = digitHeight;

    if (!changed || reducedMotion) {
      cancelAnimation(translateY);
      translateY.value = target;
      return undefined;
    }

    translateY.value = withTiming(target, {
      duration,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    return () => cancelAnimation(translateY);
  }, [digit, digitHeight, duration, reducedMotion, translateY]);

  return (
    <View style={[styles.drum, { width: digitWidth, height: digitHeight }]}>
      <Animated.View style={animatedStyle} testID={`number-ticker-digit-${place}`}>
        {DIGITS.map((item) => (
          <Text
            key={item}
            accessible={false}
            style={[
              styles.digit,
              textStyle,
              {
                width: digitWidth,
                height: digitHeight,
                lineHeight: digitHeight,
              },
            ]}
          >
            {item}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
});

/**
 * Animates each numerical character independently while keeping currency and
 * separators static. Digits are keyed from right to left, so a new thousands
 * position does not remount the existing hundreds, tens and units reels.
 */
export function NumberTicker({
  value,
  format = formatMoney,
  style,
  textStyle,
  containerStyle,
  height,
  duration = 600,
  accessibilityLabel,
}: Props) {
  const reducedMotion = useReducedMotion();
  const formatted = format(value);
  const resolvedTextStyle = useMemo(() => [style, textStyle], [style, textStyle]);
  const flatStyle = StyleSheet.flatten(resolvedTextStyle) || {};
  const drumTextStyle = useMemo(() => glyphStyle(flatStyle), [flatStyle]);
  const fontSize = typeof flatStyle.fontSize === "number" ? flatStyle.fontSize : 16;
  const digitHeight = height
    ?? (typeof flatStyle.lineHeight === "number" ? flatStyle.lineHeight : Math.ceil(fontSize * 1.25));
  // Inter supports tabular figures. The explicit width is a safe fallback on Android fonts.
  // A compact tabular cell: enough room for Inter's widest digit on Android,
  // without turning a normal amount into visibly spaced-out characters.
  const digitWidth = Math.ceil(fontSize * 0.67);
  const digitCount = (formatted.match(/\d/g) || []).length;
  const justifyContent = flatStyle.textAlign === "center"
    ? "center"
    : flatStyle.textAlign === "right"
      ? "flex-end"
      : "flex-start";
  let digitPosition = digitCount - 1;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? formatted}
      accessibilityRole="text"
      style={[
        styles.container,
        { minHeight: digitHeight, justifyContent },
        // Text styles often carry layout properties such as width or flex.
        // Applying them here preserves the drop-in behaviour of a Text amount.
        style as StyleProp<ViewStyle>,
        containerStyle,
      ]}
    >
      {Array.from(formatted).map((character, index) => {
        if (/\d/.test(character)) {
          const place = digitPosition;
          digitPosition -= 1;
          return (
            <DigitDrum
              key={`digit-${place}`}
              digit={Number(character)}
              digitHeight={digitHeight}
              digitWidth={digitWidth}
              duration={duration}
              place={place}
              reducedMotion={reducedMotion}
              textStyle={drumTextStyle}
            />
          );
        }

        return (
          <Text key={`character-${index}-${character}`} accessible={false} style={[styles.staticCharacter, drumTextStyle]}>
            {character}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    overflow: "visible",
  },
  drum: {
    overflow: "hidden",
  },
  digit: {
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  staticCharacter: {
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
  },
});
