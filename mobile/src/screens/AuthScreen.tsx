import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi, WEB_URL } from "../api";
import { useStore } from "../store";
import { colors } from "../theme";
import type { AuthSession, WhatsappRequest } from "../types";

type Props = {
  onBack: () => void;
  onSuccess: (session: AuthSession) => void;
};

function normalizedPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("996")) return `+${digits.slice(0, 12)}`;
  return `+996${digits.replace(/^0/, "").slice(0, 9)}`;
}

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function AuthButton({ label, onPress, disabled, loading }: AuthButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        pressed && !disabled && !loading && styles.actionButtonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={[styles.actionButtonLabel, disabled && styles.actionButtonLabelDisabled]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function AuthScreen({ onBack, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [phone, setPhone] = useState("+996 ");
  const [step, setStep] = useState<"phone" | "code" | "whatsapp">("phone");
  const [code, setCode] = useState("");
  const [whatsapp, setWhatsapp] = useState<WhatsappRequest | null>(null);
  const [whatsappAvailable, setWhatsappAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const pollBusy = useRef(false);
  const normalized = normalizedPhone(phone);
  const validPhone = /^\+996\d{9}$/.test(normalized);

  useEffect(() => {
    authApi.methods()
      .then((methods) => setWhatsappAvailable(methods.whatsapp))
      .catch(() => setWhatsappAvailable(false));
  }, []);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => setRetryAfter((value) => Math.max(0, value - 1)), 1_000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const complete = async (session: AuthSession) => {
    await store.signIn(session);
    onSuccess(session);
  };

  const requestSms = async () => {
    if (!validPhone || loading || retryAfter > 0) return;
    setLoading(true);
    setError("");
    try {
      const response = await authApi.requestCode(normalized);
      setRetryAfter(response.retryAfterSeconds ?? 60);
      if (response.verified && response.verificationToken && response.phone) {
        await complete({
          phone: response.phone,
          verificationToken: response.verificationToken,
          expiresAt: Date.now() + response.expiresInSeconds * 1_000,
        });
        return;
      }
      setStep("code");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (code.length < 4 || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await authApi.verifyCode(normalized, code);
      await complete({
        phone: response.phone,
        verificationToken: response.verificationToken,
        expiresAt: Date.now() + response.expiresInSeconds * 1_000,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось проверить код");
    } finally {
      setLoading(false);
    }
  };

  const requestWhatsapp = async () => {
    if (!validPhone || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await authApi.requestWhatsapp(normalized);
      setWhatsapp(response);
      setRetryAfter(response.retryAfterSeconds);
      setStep("whatsapp");
      await Linking.openURL(response.whatsappUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "WhatsApp-вход сейчас недоступен");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "whatsapp" || !whatsapp) return;
    const poll = async () => {
      if (pollBusy.current) return;
      pollBusy.current = true;
      try {
        const response = await authApi.whatsappStatus(whatsapp.challengeId, whatsapp.pollToken);
        if (response.status === "verified") {
          await complete({
            phone: response.phone,
            verificationToken: response.verificationToken,
            expiresAt: Date.now() + response.expiresInSeconds * 1_000,
          });
        } else if (response.status === "expired") {
          setError("Ссылка истекла. Запросите вход ещё раз.");
          setStep("phone");
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось проверить вход");
      } finally {
        pollBusy.current = false;
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 2_500);
    return () => clearInterval(timer);
  }, [step, whatsapp]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <StatusBar backgroundColor={styles.root.backgroundColor} style="light" />
      <Pressable
        accessibilityLabel="Назад"
        hitSlop={8}
        onPress={onBack}
        style={[styles.back, { top: insets.top + 20 }]}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
      </Pressable>

      <View style={[styles.content, { paddingTop: insets.top + 30 }]}>
        <View accessibilityLabel="Накта суши" style={styles.logo}>
          <MaterialCommunityIcons name="fish" size={38} color={colors.white} />
          <Text style={styles.logoText}>НАКТА{"\n"}СУШИ</Text>
        </View>
        <Text style={styles.title}>
          {step === "code"
            ? "Введите код"
            : step === "whatsapp"
              ? "Подтвердите вход"
              : "Войдите или зарегистрируйтесь"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "code"
            ? `Мы отправили код подтверждения на номер ${normalized}`
            : step === "whatsapp"
              ? "Отправьте подготовленное сообщение в WhatsApp и вернитесь в приложение"
              : "Введите номер телефона, чтобы войти в личный кабинет"}
        </Text>

        {step === "phone" ? (
          <>
            <TextInput
              keyboardType="phone-pad"
              maxLength={18}
              onChangeText={setPhone}
              placeholder="+996 555 123 456"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={phone}
            />
            <AuthButton
              disabled={!validPhone}
              label={retryAfter > 0 ? `Отправить снова через ${retryAfter} сек.` : "Отправить код"}
              loading={loading}
              onPress={() => void requestSms()}
            />
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL(`${WEB_URL}/legal`)}
              style={styles.policyButton}
            >
              <Text style={styles.policy}>
                Нажимая кнопку «Отправить код», вы соглашаетесь с правилами обработки
                персональных данных
              </Text>
            </Pressable>
            {whatsappAvailable ? (
              <Pressable
                accessibilityRole="button"
                disabled={!validPhone || loading}
                onPress={() => void requestWhatsapp()}
                style={({ pressed }) => [
                  styles.whatsapp,
                  (!validPhone || loading) && styles.secondaryDisabled,
                  pressed && styles.secondaryPressed,
                ]}
              >
                <MaterialCommunityIcons name="whatsapp" size={20} color={colors.white} />
                <Text style={styles.whatsappText}>Войти через WhatsApp</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        {step === "code" ? (
          <>
            <TextInput
              keyboardType="number-pad"
              maxLength={8}
              onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
              placeholder="Код из SMS"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.codeInput]}
              value={code}
            />
            <AuthButton
              disabled={code.length < 4}
              label="Подтвердить"
              loading={loading}
              onPress={() => void verify()}
            />
            <Pressable
              disabled={retryAfter > 0}
              onPress={() => void requestSms()}
              style={styles.textButton}
            >
              <Text style={styles.textButtonLabel}>
                {retryAfter > 0 ? `Отправить снова через ${retryAfter} сек.` : "Отправить код снова"}
              </Text>
            </Pressable>
          </>
        ) : null}

        {step === "whatsapp" ? (
          <>
            <View style={styles.waiting}>
              <MaterialCommunityIcons
                name="message-processing-outline"
                size={28}
                color={colors.white}
              />
              <Text style={styles.waitingText}>Ждём подтверждение номера…</Text>
            </View>
            <AuthButton
              label="Открыть WhatsApp ещё раз"
              onPress={() => whatsapp && void Linking.openURL(whatsapp.whatsappUrl)}
            />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {step !== "phone" ? (
          <Pressable onPress={() => { setStep("phone"); setCode(""); setError(""); }} style={styles.textButton}>
            <Text style={styles.textButtonLabel}>Изменить номер</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FF5700",
  },
  back: {
    position: "absolute",
    zIndex: 2,
    left: 20,
    width: 40,
    height: 40,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "stretch",
  },
  logo: {
    width: 142,
    height: 44,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoText: {
    color: colors.white,
    fontFamily: "Inter_900Black",
    fontSize: 21,
    lineHeight: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  title: {
    marginTop: 63,
    marginHorizontal: 34,
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 16,
    marginHorizontal: 28,
    color: colors.white,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  input: {
    height: 52,
    marginTop: 32,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    color: colors.ink,
    backgroundColor: "#F2F2F2",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  codeInput: {
    letterSpacing: 5,
    fontSize: 20,
  },
  actionButton: {
    height: 52,
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.30)",
  },
  actionButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.40)",
  },
  actionButtonLabel: {
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  actionButtonLabelDisabled: {
    color: "rgba(255,255,255,0.50)",
  },
  policyButton: {
    marginTop: 12,
    marginHorizontal: 56,
  },
  policy: {
    color: colors.white,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  whatsapp: {
    minHeight: 44,
    marginTop: 12,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  whatsappText: {
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  secondaryDisabled: {
    opacity: 0.5,
  },
  secondaryPressed: {
    opacity: 0.7,
  },
  textButton: {
    minHeight: 44,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textButtonLabel: {
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  waiting: {
    minHeight: 72,
    marginTop: 32,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  waitingText: {
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  error: {
    marginTop: 12,
    marginHorizontal: 20,
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});
