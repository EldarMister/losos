import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError, authApi, WEB_URL } from "../api";
import { getSmsCooldownSeconds, saveSmsCooldown } from "../authCooldown";
import { CaptchaVerification } from "../components/CaptchaVerification";
import { InAppWebPage } from "../components/InAppWebPage";
import { PhoneInput } from "../components/PhoneInput";
import { useStore } from "../store";
import { colors } from "../theme";
import type { AuthSession, WhatsappRequest } from "../types";

const AUTH_ORANGE = "#FF5706";
const SMS_CODE_LENGTH = 6;
const logoAsset = require("../../assets/logo.png");

type Props = {
  onBack: () => void;
  onSuccess: (session: AuthSession) => void;
};

type LegalPage = {
  path: "/legal" | "/privacy" | "/terms";
  title: string;
};

type RequestCodeButtonProps = {
  disabled: boolean;
  label: string;
  loading: boolean;
  onPress: () => void;
};

function RequestCodeButton({ disabled, label, loading, onPress }: RequestCodeButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        disabled && styles.actionButtonDisabled,
        pressed && !disabled && !loading && styles.actionButtonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={AUTH_ORANGE} />
      ) : (
        <Text style={[styles.actionButtonLabel, disabled && styles.actionButtonLabelDisabled]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("996") && digits.length === 12) {
    return `+996 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
  }
  return phone;
}

type LegalLinksProps = {
  onOpen: (page: LegalPage) => void;
};

const LEGAL_ROWS: Array<{
  icon: "shield-account-outline" | "file-document-outline" | "clipboard-text-outline";
  page: LegalPage;
}> = [
  {
    icon: "shield-account-outline",
    page: { path: "/privacy", title: "Политика конфиденциальности" },
  },
  {
    icon: "file-document-outline",
    page: { path: "/terms", title: "Условия использования" },
  },
  {
    icon: "clipboard-text-outline",
    page: { path: "/terms", title: "Условия доставки и оплаты" },
  },
];

function LegalLinks({ onOpen }: LegalLinksProps) {
  return (
    <View style={styles.consent}>
      <Text style={styles.consentLead}>
        Нажимая «Получить код», вы соглашаетесь с
      </Text>
      <View style={styles.inlineLinks}>
        <Pressable
          accessibilityRole="link"
          onPress={() => onOpen({ path: "/legal", title: "Согласие на обработку данных" })}
        >
          <Text style={styles.consentLink}>Согласием на обработку персональных данных</Text>
        </Pressable>
        <Text style={styles.consentLead}>, </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => onOpen({ path: "/privacy", title: "Политика конфиденциальности" })}
        >
          <Text style={styles.consentLink}>Политикой конфиденциальности</Text>
        </Pressable>
        <Text style={styles.consentLead}> и </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => onOpen({ path: "/terms", title: "Условия использования" })}
        >
          <Text style={styles.consentLink}>Условиями использования</Text>
        </Pressable>
        <Text style={styles.consentLead}>.</Text>
      </View>
    </View>
  );
}

function LegalRows({ onOpen }: LegalLinksProps) {
  return (
    <View style={styles.legalRows}>
      {LEGAL_ROWS.map(({ icon, page }) => (
        <Pressable
          accessibilityRole="link"
          key={page.title}
          onPress={() => onOpen(page)}
          style={({ pressed }) => [styles.legalRow, pressed && styles.linkPressed]}
        >
          <MaterialCommunityIcons name={icon} size={24} color={colors.white} />
          <Text style={styles.legalRowText}>{page.title}</Text>
          <MaterialCommunityIcons name="chevron-right" size={25} color={colors.white} />
        </Pressable>
      ))}
    </View>
  );
}

export function AuthScreen({ onBack, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [step, setStep] = useState<"phone" | "code" | "whatsapp">("phone");
  const [code, setCode] = useState("");
  const [whatsapp, setWhatsapp] = useState<WhatsappRequest | null>(null);
  const [whatsappAvailable, setWhatsappAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null);
  const pollBusy = useRef(false);
  const normalized = `+996${phoneDigits}`;
  const validPhone = /^\+996\d{9}$/.test(normalized);

  useEffect(() => {
    authApi.methods()
      .then((methods) => setWhatsappAvailable(methods.whatsapp))
      .catch(() => setWhatsappAvailable(false));
  }, []);

  useEffect(() => {
    if (!validPhone) {
      setRetryAfter(0);
      return undefined;
    }
    let active = true;
    void getSmsCooldownSeconds(normalized).then((seconds) => {
      if (active) setRetryAfter(seconds);
    });
    return () => {
      active = false;
    };
  }, [normalized, validPhone]);

  const cooldownActive = retryAfter > 0;
  useEffect(() => {
    if (!cooldownActive) return undefined;
    const timer = setInterval(() => {
      setRetryAfter((value) => Math.max(0, value - 1));
    }, 1_000);
    return () => clearInterval(timer);
  }, [cooldownActive]);

  const complete = useCallback(async (session: AuthSession) => {
    await store.signIn(session);
    onSuccess(session);
  }, [onSuccess, store]);

  const rememberCooldown = async (seconds: number) => {
    const safeSeconds = Math.max(1, Math.ceil(seconds));
    setRetryAfter(safeSeconds);
    await saveSmsCooldown(normalized, safeSeconds);
  };

  const requestSms = async (captchaToken: string) => {
    if (!validPhone || loading || retryAfter > 0) return;
    setCaptchaVisible(false);
    setLoading(true);
    setError("");
    try {
      const response = await authApi.requestCode(normalized, captchaToken);
      await rememberCooldown(response.retryAfterSeconds ?? 60);
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
      if (reason instanceof ApiError && reason.retryAfterSeconds) {
        await rememberCooldown(reason.retryAfterSeconds);
      }
      setError(reason instanceof Error ? reason.message : "Не удалось отправить код. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const beginSmsRequest = () => {
    setPhoneTouched(true);
    setError("");
    if (!validPhone || loading || retryAfter > 0) return;
    setCaptchaVisible(true);
  };

  const verify = async () => {
    if (code.length !== SMS_CODE_LENGTH || loading) return;
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
      setError(reason instanceof Error ? reason.message : "Не удалось проверить код. Попробуйте ещё раз.");
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
      await rememberCooldown(response.retryAfterSeconds);
      setStep("whatsapp");
      await Linking.openURL(response.whatsappUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "WhatsApp-вход сейчас недоступен");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "whatsapp" || !whatsapp) return undefined;
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
  }, [complete, step, whatsapp]);

  const changeNumber = () => {
    setStep("phone");
    setCode("");
    setError("");
  };

  const handleBack = () => {
    if (step === "phone") onBack();
    else changeNumber();
  };

  const actionLabel = retryAfter > 0
    ? `Повторно через ${retryAfter} сек.`
    : "Получить код";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <StatusBar backgroundColor={AUTH_ORANGE} style="light" translucent />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 18,
            paddingBottom: Math.max(insets.bottom, 12) + 24,
          },
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <Pressable
          accessibilityLabel="Назад"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleBack}
          style={({ pressed }) => [styles.back, pressed && styles.linkPressed]}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.white} />
        </Pressable>

        <View accessibilityLabel="Накта суши" style={styles.logo}>
          <View style={styles.logoMarkViewport}>
            <Image source={logoAsset} style={styles.logoMarkImage} />
          </View>
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
            ? `Код отправлен на ${formatPhone(normalized)}`
            : step === "whatsapp"
              ? "Отправьте подготовленное сообщение в WhatsApp и вернитесь в приложение"
              : "Введите номер телефона, чтобы войти в личный кабинет"}
        </Text>

        {step === "phone" ? (
          <View style={styles.form}>
            <PhoneInput
              digits={phoneDigits}
              error={phoneTouched && phoneDigits.length > 0 && !validPhone}
              onBlur={() => setPhoneTouched(true)}
              onChangeDigits={(value) => {
                setPhoneDigits(value);
                setError("");
              }}
            />
            {phoneTouched && phoneDigits.length > 0 && !validPhone ? (
              <Text style={styles.validation}>Введите 9 цифр после +996</Text>
            ) : null}
            <RequestCodeButton
              disabled={!validPhone || retryAfter > 0}
              label={actionLabel}
              loading={loading}
              onPress={beginSmsRequest}
            />
            <LegalLinks onOpen={setLegalPage} />
            {whatsappAvailable ? (
              <Pressable
                accessibilityRole="button"
                disabled={!validPhone || loading}
                onPress={() => void requestWhatsapp()}
                style={({ pressed }) => [
                  styles.whatsapp,
                  (!validPhone || loading) && styles.secondaryDisabled,
                  pressed && styles.linkPressed,
                ]}
              >
                <MaterialCommunityIcons name="whatsapp" size={20} color={colors.white} />
                <Text style={styles.whatsappText}>Войти через WhatsApp</Text>
              </Pressable>
            ) : null}
            <LegalRows onOpen={setLegalPage} />
          </View>
        ) : null}

        {step === "code" ? (
          <View style={styles.form}>
            <TextInput
              accessibilityLabel="Код из SMS"
              autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
              keyboardType="number-pad"
              maxLength={SMS_CODE_LENGTH}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="000000"
              placeholderTextColor="#A1A3A7"
              style={styles.codeInput}
              textContentType="oneTimeCode"
              value={code}
            />
            <RequestCodeButton
              disabled={code.length !== SMS_CODE_LENGTH}
              label="Подтвердить"
              loading={loading}
              onPress={() => void verify()}
            />
            <Pressable
              accessibilityRole="button"
              disabled={retryAfter > 0 || loading}
              onPress={beginSmsRequest}
              style={styles.textButton}
            >
              <Text style={[styles.textButtonLabel, retryAfter > 0 && styles.secondaryDisabled]}>
                {retryAfter > 0
                  ? `Отправить код повторно через ${retryAfter} сек.`
                  : "Отправить код повторно"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {step === "whatsapp" ? (
          <View style={styles.form}>
            <View style={styles.waiting}>
              <MaterialCommunityIcons name="message-processing-outline" size={28} color={colors.white} />
              <Text style={styles.waitingText}>Ждём подтверждение номера…</Text>
            </View>
            <RequestCodeButton
              disabled={!whatsapp}
              label="Открыть WhatsApp ещё раз"
              loading={false}
              onPress={() => {
                if (!whatsapp) return;
                void Linking.openURL(whatsapp.whatsappUrl);
              }}
            />
          </View>
        ) : null}

        {error ? (
          <View accessibilityLiveRegion="polite" style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.white} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {step !== "phone" ? (
          <Pressable onPress={changeNumber} style={styles.changeNumber}>
            <Text style={styles.textButtonLabel}>Изменить номер</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <CaptchaVerification
        onCancel={() => setCaptchaVisible(false)}
        onError={(message) => {
          setCaptchaVisible(false);
          setError(message);
        }}
        onVerified={(token) => void requestSms(token)}
        visible={captchaVisible}
      />
      <InAppWebPage
        onClose={() => setLegalPage(null)}
        title={legalPage?.title ?? "Правовая информация"}
        url={`${WEB_URL}${legalPage?.path ?? "/legal"}`}
        visible={Boolean(legalPage)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH_ORANGE,
  },
  scroll: {
    backgroundColor: AUTH_ORANGE,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: "100%",
    paddingHorizontal: 20,
    backgroundColor: AUTH_ORANGE,
  },
  back: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  logo: {
    height: 56,
    marginTop: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logoMarkViewport: {
    width: 58,
    height: 54,
    overflow: "hidden",
  },
  logoMarkImage: {
    position: "absolute",
    top: -8,
    left: -22,
    width: 103,
    height: 94,
  },
  logoText: {
    color: colors.white,
    fontFamily: "Inter_900Black",
    fontSize: 19,
    lineHeight: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  title: {
    marginTop: 42,
    color: colors.white,
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 14,
    marginHorizontal: 4,
    color: colors.white,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  form: {
    marginTop: 30,
  },
  validation: {
    marginTop: 7,
    marginHorizontal: 6,
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 17,
  },
  actionButton: {
    width: "100%",
    height: 60,
    marginTop: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  actionButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  actionButtonPressed: {
    opacity: 0.82,
  },
  actionButtonLabel: {
    color: AUTH_ORANGE,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
  },
  actionButtonLabelDisabled: {
    color: "rgba(255,255,255,0.62)",
  },
  consent: {
    marginTop: 22,
    marginHorizontal: 8,
    alignItems: "center",
  },
  consentLead: {
    color: colors.white,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  inlineLinks: {
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  consentLink: {
    color: colors.white,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  whatsapp: {
    minHeight: 42,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  whatsappText: {
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  secondaryDisabled: { opacity: 0.5 },
  legalRows: {
    marginTop: 22,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  legalRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  legalRowText: {
    flex: 1,
    color: colors.white,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  linkPressed: { opacity: 0.62 },
  codeInput: {
    width: "100%",
    height: 68,
    paddingHorizontal: 20,
    borderRadius: 22,
    color: colors.ink,
    backgroundColor: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "600",
    letterSpacing: 9,
    textAlign: "center",
  },
  textButton: {
    minHeight: 48,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textButtonLabel: {
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  waiting: {
    minHeight: 78,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  waitingText: {
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  errorBox: {
    marginTop: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(110,0,0,0.18)",
  },
  error: {
    flex: 1,
    color: colors.white,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 17,
  },
  changeNumber: {
    minHeight: 48,
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
