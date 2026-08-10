import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { colors } from "../theme";

type Props = {
  digits: string;
  error?: boolean;
  onBlur?: () => void;
  onChangeDigits: (digits: string) => void;
};

export function formatKyrgyzLocalDigits(value: string) {
  const allDigits = value.replace(/\D/g, "");
  const localDigits = (
    allDigits.startsWith("996") ? allDigits.slice(3) : allDigits.replace(/^0/, "")
  ).slice(0, 9);
  return [
    localDigits.slice(0, 3),
    localDigits.slice(3, 6),
    localDigits.slice(6, 9),
  ].filter(Boolean).join(" ");
}

export function PhoneInput({ digits, error = false, onBlur, onChangeDigits }: Props) {
  const [focused, setFocused] = useState(false);
  const formatted = formatKyrgyzLocalDigits(digits);

  const changeText: NonNullable<TextInputProps["onChangeText"]> = (value) => {
    const local = value.replace(/\D/g, "");
    onChangeDigits((local.startsWith("996") ? local.slice(3) : local.replace(/^0/, "")).slice(0, 9));
  };

  return (
    <View
      style={[
        styles.shell,
        focused && styles.focused,
        error && styles.error,
      ]}
    >
      <MaterialCommunityIcons name="phone-outline" size={28} color="#33383E" />
      <View style={styles.numberRow}>
        <Text style={styles.prefix}>+996</Text>
        <TextInput
          accessibilityLabel="Номер телефона"
          autoComplete="tel"
          importantForAutofill="yes"
          keyboardType="phone-pad"
          maxLength={11}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onChangeText={changeText}
          onFocus={() => setFocused(true)}
          placeholder="000 000 000"
          placeholderTextColor="#A1A3A7"
          selectionColor="#FF5706"
          style={styles.input}
          textContentType="telephoneNumber"
          value={formatted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    height: 68,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
    backgroundColor: colors.white,
  },
  focused: {
    borderColor: "rgba(17,17,17,0.34)",
  },
  error: {
    borderColor: "#A62626",
  },
  numberRow: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prefix: {
    color: "#33383E",
    fontFamily: "Inter_500Medium",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "500",
  },
  input: {
    minWidth: 0,
    flex: 1,
    height: 64,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: "#33383E",
    fontFamily: "Inter_500Medium",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "500",
  },
});
