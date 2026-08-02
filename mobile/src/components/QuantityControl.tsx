import {
  startTransition,
} from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radii } from "../theme";
import { formatNumber } from "../money";
import { useOptimisticNumber } from "../useOptimisticNumber";
import { NumberTicker } from "./NumberTicker";
import { ImmediatePressable } from "./ImmediatePressable";

type Props = {
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
  maximum?: number;
  compact?: boolean;
  bare?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function QuantityControl({
  value,
  onChange,
  minimum = 0,
  maximum = 20,
  compact,
  bare,
  style,
}: Props) {
  const buttonWidth = bare ? 40 : compact ? 34 : 42;
  const buttonHeight = bare ? 38 : compact ? 34 : 42;
  const [displayValue, setDisplayValue] = useOptimisticNumber(value);

  const change = (delta: number) => {
    const constrained = setDisplayValue((current) => (
      Math.min(maximum, Math.max(minimum, current + delta))
    ));
    startTransition(() => onChange(constrained));
  };

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        bare && styles.containerBare,
        style,
      ]}
    >
      <ImmediatePressable
        accessibilityRole="button"
        accessibilityLabel="Уменьшить количество"
        disabled={displayValue <= minimum}
        onPress={() => change(-1)}
        style={({ pressed }) => [
          styles.control,
          bare && styles.controlBare,
          { width: buttonWidth, height: buttonHeight },
          displayValue <= minimum && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons name="minus" size={compact ? 18 : 21} color={colors.muted} />
      </ImmediatePressable>
      <NumberTicker
        accessibilityLabel={`Количество: ${displayValue}`}
        format={formatNumber}
        height={compact ? 18 : 20}
        style={[styles.value, compact && styles.valueCompact]}
        value={displayValue}
      />
      <ImmediatePressable
        accessibilityRole="button"
        accessibilityLabel="Увеличить количество"
        disabled={displayValue >= maximum}
        onPress={() => change(1)}
        style={({ pressed }) => [
          styles.control,
          bare && styles.controlBare,
          { width: buttonWidth, height: buttonHeight },
          displayValue >= maximum && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons name="plus" size={compact ? 18 : 21} color={colors.muted} />
      </ImmediatePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    padding: 4,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  containerCompact: {
    height: 40,
    gap: 5,
  },
  containerBare: {
    height: 38,
    padding: 0,
    gap: 12,
    backgroundColor: "transparent",
  },
  control: {
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  controlBare: {
    backgroundColor: colors.surface,
  },
  value: {
    minWidth: 20,
    textAlign: "center",
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  valueCompact: {
    fontSize: 14,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.65,
  },
});
