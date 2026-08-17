import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../theme";
import type { AccountNft } from "../types";
import { BottomSheet } from "./BottomSheet";
import { SwipeDismissScrollView } from "./SwipeDismiss";

type WithdrawalKind = "coins" | "nft";
type WithdrawalStep = "form" | "scanner" | "confirm" | "success";

type Props = {
  visible: boolean;
  coins: number;
  nfts: AccountNft[];
  onClose: () => void;
  onSubmit: (input: {
    kind: WithdrawalKind;
    walletAddress: string;
    amount?: number;
    nftId?: string;
  }) => Promise<void>;
};

const networkLabels: Record<AccountNft["network"], string> = {
  polygon: "Polygon",
  ethereum: "Ethereum",
  bsc: "BNB Smart Chain",
  solana: "Solana",
  ton: "TON",
};

export function walletAddressFromQr(value: string) {
  let candidate = value.trim();
  const scheme = candidate.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();

  if (scheme === "http" || scheme === "https") {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    candidate = candidate.replace(/^[a-z][a-z0-9+.-]*:(?:\/\/)?/i, "");
    candidate = candidate.split(/[?#]/, 1)[0] || "";
    candidate = candidate.split("/").filter(Boolean).at(-1) || "";
    candidate = candidate.split("@", 1)[0] || "";
  }
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return "";
  }
  return /^\S{16,200}$/.test(candidate) ? candidate : "";
}

function GradientButton({ disabled = false, loading = false, label, onPress }: {
  disabled?: boolean;
  loading?: boolean;
  label: string;
  onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.gradientButtonWrap, (disabled || loading) && styles.buttonDisabled, pressed && styles.buttonPressed]}>
    <LinearGradient colors={["#FF731A", "#FF3E08"]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.gradientButton}>
      {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.gradientButtonText}>{label}</Text>}
    </LinearGradient>
  </Pressable>;
}

export function RewardsWithdrawalSheet({ visible, coins, nfts, onClose, onSubmit }: Props) {
  const availableNfts = useMemo(
    () => nfts.filter((nft) => nft.status === "owned" || nft.status === "failed"),
    [nfts],
  );
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<WithdrawalStep>("form");
  const [kind, setKind] = useState<WithdrawalKind | null>(null);
  const [nftId, setNftId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [coinAmount, setCoinAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [scanLocked, setScanLocked] = useState(false);
  const [scanError, setScanError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setStep("form");
    setKind(null);
    setNftId("");
    setWalletAddress("");
    setCoinAmount("");
    setSubmitting(false);
    setError("");
    setScanLocked(false);
    setScanError("");
  }, [visible]);

  const chooseKind = (nextKind: WithdrawalKind) => {
    if ((nextKind === "coins" && coins <= 0) || (nextKind === "nft" && !availableNfts.length)) return;
    setKind(nextKind);
    setNftId(nextKind === "nft" ? availableNfts[0]?.id || "" : "");
    setWalletAddress("");
    setCoinAmount("");
    setError("");
  };

  const selectedNft = availableNfts.find((nft) => nft.id === nftId);
  const parsedCoinAmount = /^\d+$/.test(coinAmount) ? Number(coinAmount) : 0;
  const coinAmountValid = kind !== "coins" || (parsedCoinAmount >= 1 && parsedCoinAmount <= coins);
  const walletAddressValid = /^\S{16,200}$/.test(walletAddress.trim());
  const canContinue = walletAddressValid && kind !== null && coinAmountValid && (kind !== "nft" || Boolean(selectedNft));

  const openScanner = async () => {
    Keyboard.dismiss();
    setScanError("");
    setScanLocked(false);
    const nextPermission = permission?.granted ? permission : await requestPermission();
    if (!nextPermission.granted) {
      setError("Разрешите доступ к камере, чтобы отсканировать QR-код");
      return;
    }
    setError("");
    setStep("scanner");
  };

  const handleQrCode = ({ data }: { data: string }) => {
    if (scanLocked) return;
    setScanLocked(true);
    const address = walletAddressFromQr(data);
    if (!address) {
      setScanError("В QR-коде не найден корректный адрес криптокошелька");
      return;
    }
    setWalletAddress(address);
    setError("");
    setStep("form");
  };

  const showConfirmation = () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    setError("");
    setStep("confirm");
  };

  const submit = async () => {
    if (!kind || !canContinue || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        kind,
        walletAddress: walletAddress.trim(),
        amount: kind === "coins" ? parsedCoinAmount : undefined,
        nftId: kind === "nft" ? selectedNft?.id : undefined,
      });
      setStep("success");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось оставить заявку");
    } finally {
      setSubmitting(false);
    }
  };

  const summaryAsset = kind === "coins" ? "NAKTA Coin" : selectedNft?.name || "NFT";
  const summaryAmount = kind === "coins" ? `${parsedCoinAmount} NAKTA Coin` : "1 NFT";

  return <BottomSheet height="88%" onClose={onClose} visible={visible}>
    {step === "scanner" ? <View style={styles.scannerPage}>
      <View style={styles.scannerHeader}>
        <Pressable accessibilityLabel="Вернуться к форме" accessibilityRole="button" onPress={() => setStep("form")} style={styles.iconButton}><MaterialCommunityIcons color={colors.ink} name="arrow-left" size={24} /></Pressable>
        <Text style={styles.scannerTitle}>Сканирование QR</Text><View style={styles.iconButtonPlaceholder} />
      </View>
      <View style={styles.cameraFrame}>
        <CameraView active={step === "scanner"} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} facing="back" onBarcodeScanned={scanLocked ? undefined : handleQrCode} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.scanTarget}>
          <View style={[styles.scanCorner, styles.scanCornerTopLeft]} /><View style={[styles.scanCorner, styles.scanCornerTopRight]} /><View style={[styles.scanCorner, styles.scanCornerBottomLeft]} /><View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
        </View>
      </View>
      <Text style={styles.scannerHelp}>Наведите камеру на QR-код с адресом криптокошелька</Text>
      {scanError ? <View style={styles.scanErrorCard}><Text style={styles.scanErrorText}>{scanError}</Text><Pressable accessibilityRole="button" onPress={() => { setScanLocked(false); setScanError(""); }} style={styles.retryScanButton}><Text style={styles.retryScanText}>Сканировать ещё раз</Text></Pressable></View> : null}
    </View> : <SwipeDismissScrollView contentContainerStyle={styles.content} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {step === "success" ? <View style={styles.success}>
        <LinearGradient colors={["#ECFFF3", "#DFF7E8"]} style={styles.successIcon}><MaterialCommunityIcons color={colors.success} name="check" size={34} /></LinearGradient>
        <Text style={styles.title}>Заявка принята</Text><Text style={styles.successText}>Мы проверим заявку и отправим награду на указанный криптокошелёк.</Text>
        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}><Text style={styles.secondaryButtonText}>Готово</Text></Pressable>
      </View> : null}

      {step === "confirm" ? <View>
        <View style={styles.pageHeadingRow}><Pressable accessibilityLabel="Изменить данные вывода" accessibilityRole="button" onPress={() => { setError(""); setStep("form"); }} style={styles.iconButton}><MaterialCommunityIcons color={colors.ink} name="arrow-left" size={24} /></Pressable><View style={styles.pageHeadingCopy}><Text style={styles.title}>Подтверждение вывода</Text><Text style={styles.subtitle}>Проверьте данные перед отправкой заявки</Text></View></View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Актив</Text><Text style={styles.summaryValue}>{summaryAsset}</Text></View><View style={styles.summaryDivider} />
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Сумма</Text><Text style={styles.summaryValue}>{summaryAmount}</Text></View><View style={styles.summaryDivider} />
          <View style={[styles.summaryRow, styles.summaryAddressRow]}><Text style={styles.summaryLabel}>Адрес кошелька</Text><Text selectable style={[styles.summaryValue, styles.summaryAddress]}>{walletAddress.trim()}</Text></View>
          {kind === "nft" && selectedNft ? <><View style={styles.summaryDivider} /><View style={styles.summaryRow}><Text style={styles.summaryLabel}>Сеть</Text><Text style={styles.summaryValue}>{networkLabels[selectedNft.network]}</Text></View></> : null}
        </View>
        <LinearGradient colors={["#FFF5F0", "#FFF0E9"]} style={styles.warningCard}><View style={styles.warningIcon}><MaterialCommunityIcons color="#FF5A1F" name="alert-outline" size={22} /></View><Text style={styles.warningText}>Проверьте адрес кошелька внимательно. После отправки заявки изменить его нельзя.</Text></LinearGradient>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <GradientButton label="Подтвердить вывод" loading={submitting} onPress={() => void submit()} />
        <Pressable accessibilityRole="button" disabled={submitting} onPress={() => { setError(""); setStep("form"); }} style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}><Text style={styles.editButtonText}>Изменить данные</Text></Pressable>
      </View> : null}

      {step === "form" ? <>
        <Text style={styles.title}>Вывод награды</Text><Text style={styles.subtitle}>Что хотите вывести?</Text>
        <View style={styles.kindRow}>
          <Pressable accessibilityLabel="Выбрать NAKTA Coin" accessibilityRole="button" accessibilityState={{ selected: kind === "coins", disabled: coins <= 0 }} disabled={coins <= 0} onPress={() => chooseKind("coins")} style={({ pressed }) => [styles.kindCardWrap, coins <= 0 && styles.buttonDisabled, pressed && styles.buttonPressed]}><LinearGradient colors={["#FF731A", "#FF3F08"]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={[styles.kindCard, kind === "coins" && styles.kindCardSelected]}><Text style={styles.coinKindTitle}>NAKTA Coin</Text><Text style={styles.coinKindValue}>{coins}</Text></LinearGradient></Pressable>
          <Pressable accessibilityLabel="Выбрать NFT" accessibilityRole="button" accessibilityState={{ selected: kind === "nft", disabled: !availableNfts.length }} disabled={!availableNfts.length} onPress={() => chooseKind("nft")} style={({ pressed }) => [styles.kindCardWrap, !availableNfts.length && styles.buttonDisabled, pressed && styles.buttonPressed]}><LinearGradient colors={["#F6F1FF", "#E9DEFF"]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={[styles.kindCard, kind === "nft" && styles.nftKindCardSelected]}><Text style={styles.nftKindTitle}>NFT</Text><Text style={styles.nftKindValue}>{availableNfts.length}</Text></LinearGradient></Pressable>
        </View>
        {kind === "nft" && availableNfts.length > 1 ? <View style={styles.nftSelector}><Text style={styles.fieldLabel}>Выберите NFT</Text>{availableNfts.map((nft) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: nft.id === nftId }} key={nft.id} onPress={() => setNftId(nft.id)} style={({ pressed }) => [styles.nftOption, nft.id === nftId && styles.nftOptionSelected, pressed && styles.buttonPressed]}><View style={styles.nftOptionIcon}><MaterialCommunityIcons color="#7C55E8" name="hexagon-multiple-outline" size={22} /></View><View style={styles.nftOptionCopy}><Text style={styles.nftOptionName}>{nft.name}</Text><Text style={styles.nftOptionNetwork}>{networkLabels[nft.network]}</Text></View><MaterialCommunityIcons color={nft.id === nftId ? "#7C55E8" : "#C7C2D2"} name={nft.id === nftId ? "radiobox-marked" : "radiobox-blank"} size={22} /></Pressable>)}</View> : null}
        {kind ? <View style={styles.form}>
          {kind === "coins" ? <><Text style={styles.fieldLabel}>Количество NAKTA Coin</Text><TextInput accessibilityLabel="Количество NAKTA Coin для вывода" keyboardType="number-pad" maxLength={10} onChangeText={(value) => setCoinAmount(value.replace(/\D/g, ""))} placeholder={`От 1 до ${coins}`} placeholderTextColor="#A3A3A9" style={styles.amountInput} value={coinAmount} />{coinAmount && !coinAmountValid ? <Text style={styles.amountError}>Введите количество от 1 до {coins}</Text> : null}</> : <Text style={styles.selectionHint}>К выводу: {selectedNft?.name || "NFT"}{selectedNft ? ` · ${networkLabels[selectedNft.network]}` : ""}</Text>}
          <Text style={styles.fieldLabel}>Адрес криптокошелька</Text>
          <View style={styles.walletField}><TextInput accessibilityLabel="Адрес криптокошелька" autoCapitalize="none" autoCorrect={false} onChangeText={(value) => { setWalletAddress(value); setError(""); }} placeholder="Введите адрес кошелька" placeholderTextColor="#A3A3A9" style={styles.walletInput} value={walletAddress} /><View style={styles.walletFieldDivider} /><Pressable accessibilityLabel="Сканировать QR-код кошелька" accessibilityRole="button" onPress={() => void openScanner()} style={({ pressed }) => [styles.qrButton, pressed && styles.buttonPressed]}><MaterialCommunityIcons color={colors.ink} name="qrcode-scan" size={25} /></Pressable></View>
          <Text style={styles.addressHint}>Введите адрес вручную или отсканируйте QR-код. После отправки заявки адрес изменить нельзя.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}<GradientButton disabled={!canContinue} label="Продолжить" onPress={showConfirmation} />
        </View> : null}
      </> : null}
    </SwipeDismissScrollView>}
  </BottomSheet>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 32 },
  title: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 28, lineHeight: 34, letterSpacing: -0.7 },
  subtitle: { marginTop: 7, color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 20 },
  kindRow: { marginTop: 22, flexDirection: "row", gap: 12 },
  kindCardWrap: { flex: 1, minWidth: 0, borderRadius: 24, elevation: 5, shadowColor: "#C34816", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 },
  kindCard: { height: 126, padding: 18, borderWidth: 2, borderColor: "transparent", borderRadius: 24 },
  kindCardSelected: { borderColor: "#171717" },
  nftKindCardSelected: { borderColor: "#7C55E8" },
  coinKindTitle: { color: colors.white, fontFamily: "Inter_600SemiBold", fontSize: 15 },
  coinKindValue: { marginTop: "auto", color: colors.white, fontFamily: "Inter_700Bold", fontSize: 39, lineHeight: 44 },
  nftKindTitle: { color: "#65558D", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  nftKindValue: { marginTop: "auto", color: "#251B3F", fontFamily: "Inter_700Bold", fontSize: 39, lineHeight: 44 },
  buttonDisabled: { opacity: 0.38 }, buttonPressed: { opacity: 0.76 },
  nftSelector: { marginTop: 22, gap: 9 },
  nftOption: { minHeight: 64, paddingHorizontal: 12, borderWidth: 1, borderColor: "#E2DDEC", borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: colors.white },
  nftOptionSelected: { borderColor: "#7C55E8", backgroundColor: "#FAF8FF" },
  nftOptionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE8FF" },
  nftOptionCopy: { flex: 1, minWidth: 0 }, nftOptionName: { color: colors.ink, fontFamily: "Inter_600SemiBold", fontSize: 14 }, nftOptionNetwork: { marginTop: 2, color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12 },
  form: { marginTop: 24 }, selectionHint: { marginBottom: 17, color: colors.ink, fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 19 }, fieldLabel: { color: colors.ink, fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 19 },
  amountInput: { height: 60, marginTop: 9, marginBottom: 18, paddingHorizontal: 17, borderWidth: 1, borderColor: "#DDDDE1", borderRadius: 19, backgroundColor: "#FAFAFB", color: colors.ink, fontFamily: "Inter_600SemiBold", fontSize: 16 },
  amountError: { marginTop: -11, marginBottom: 14, color: colors.danger, fontFamily: "Inter_400Regular", fontSize: 12 },
  walletField: { height: 62, marginTop: 9, borderWidth: 1, borderColor: "#DDDDE1", borderRadius: 19, flexDirection: "row", alignItems: "center", backgroundColor: "#FAFAFB", overflow: "hidden" },
  walletInput: { flex: 1, height: "100%", paddingHorizontal: 17, color: colors.ink, fontFamily: "Inter_400Regular", fontSize: 14 }, walletFieldDivider: { width: 1, height: 30, backgroundColor: "#DEDEE2" }, qrButton: { width: 58, height: "100%", alignItems: "center", justifyContent: "center" },
  addressHint: { marginTop: 11, color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 }, error: { marginTop: 12, color: colors.danger, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  gradientButtonWrap: { height: 58, marginTop: 22, borderRadius: 19, elevation: 6, shadowColor: "#FF4D0A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }, gradientButton: { flex: 1, borderRadius: 19, alignItems: "center", justifyContent: "center" }, gradientButtonText: { color: colors.white, fontFamily: "Inter_600SemiBold", fontSize: 16 },
  pageHeadingRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, pageHeadingCopy: { flex: 1, minWidth: 0 }, iconButton: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F4F5" }, iconButtonPlaceholder: { width: 42, height: 42 },
  summaryCard: { marginTop: 24, paddingHorizontal: 18, borderWidth: 1, borderColor: "#E2E2E5", borderRadius: 24, backgroundColor: "#FCFCFD", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 14 },
  summaryRow: { minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18 }, summaryAddressRow: { alignItems: "flex-start", paddingVertical: 16 }, summaryLabel: { color: colors.muted, fontFamily: "Inter_500Medium", fontSize: 14 }, summaryValue: { flexShrink: 1, color: colors.ink, fontFamily: "Inter_600SemiBold", fontSize: 14, textAlign: "right" }, summaryAddress: { maxWidth: "64%", lineHeight: 20 }, summaryDivider: { height: 1, backgroundColor: "#E8E8EA" },
  warningCard: { minHeight: 92, marginTop: 20, padding: 16, borderRadius: 21, flexDirection: "row", alignItems: "center", gap: 13 }, warningIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#FFE2D4" }, warningText: { flex: 1, color: "#4E413C", fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  editButton: { height: 52, marginTop: 10, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F3F4" }, editButtonText: { color: colors.ink, fontFamily: "Inter_600SemiBold", fontSize: 15 },
  success: { paddingTop: 48, alignItems: "center" }, successIcon: { width: 76, height: 76, marginBottom: 22, borderRadius: 38, alignItems: "center", justifyContent: "center" }, successText: { maxWidth: 310, marginTop: 11, color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, textAlign: "center" }, secondaryButton: { width: "100%", height: 56, marginTop: 28, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }, secondaryButtonText: { color: colors.white, fontFamily: "Inter_600SemiBold", fontSize: 16 },
  scannerPage: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }, scannerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, scannerTitle: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 20 },
  cameraFrame: { flex: 1, minHeight: 300, marginTop: 22, borderRadius: 28, overflow: "hidden", backgroundColor: "#111" }, scanTarget: { position: "absolute", top: "50%", left: "50%", width: 230, height: 230, marginTop: -115, marginLeft: -115 }, scanCorner: { position: "absolute", width: 48, height: 48, borderColor: colors.white }, scanCornerTopLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 }, scanCornerTopRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 }, scanCornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 }, scanCornerBottomRight: { right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 16 },
  scannerHelp: { marginTop: 18, color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center" }, scanErrorCard: { marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: "#FFF0ED" }, scanErrorText: { color: colors.danger, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, textAlign: "center" }, retryScanButton: { minHeight: 40, marginTop: 9, alignItems: "center", justifyContent: "center" }, retryScanText: { color: colors.ink, fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
