import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radii } from "../theme";

type Props = {
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
  maximum?: number;
  compact?: boolean;
};

export function QuantityControl({
  value,
  onChange,
  minimum = 0,
  maximum = 20,
  compact,
}: Props) {
  const buttonSize = compact ? 34 : 42;
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Уменьшить количество"
        disabled={value <= minimum}
        onPress={() => onChange(value - 1)}
        style={({ pressed }) => [
          styles.control,
          { width: buttonSize, height: buttonSize },
          value <= minimum && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons name="minus" size={compact ? 18 : 21} color={colors.muted} />
      </Pressable>
      <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Увеличить количество"
        disabled={value >= maximum}
        onPress={() => onChange(value + 1)}
        style={({ pressed }) => [
          styles.control,
          { width: buttonSize, height: buttonSize },
          value >= maximum && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons name="plus" size={compact ? 18 : 21} color={colors.muted} />
      </Pressable>
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
  control: {
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
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
