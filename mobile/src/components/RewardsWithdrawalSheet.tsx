import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

export function RewardsWithdrawalSheet({
  visible,
  coins,
  nfts,
  onClose,
  onSubmit,
}: Props) {
  const availableNfts = useMemo(
    () => nfts.filter((nft) => nft.status === "owned" || nft.status === "failed"),
    [nfts],
  );
  const [kind, setKind] = useState<WithdrawalKind | null>(null);
  const [nftId, setNftId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [coinAmount, setCoinAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setKind(null);
    setNftId("");
    setWalletAddress("");
    setCoinAmount("");
    setSubmitting(false);
    setError("");
    setSubmitted(false);
  }, [visible]);

  const chooseKind = (nextKind: WithdrawalKind) => {
    if ((nextKind === "coins" && coins <= 0) || (nextKind === "nft" && !availableNfts.length)) {
      return;
    }
    setKind(nextKind);
    setNftId(nextKind === "nft" ? availableNfts[0]?.id || "" : "");
    setWalletAddress("");
    setCoinAmount("");
    setError("");
  };

  const selectedNft = availableNfts.find((nft) => nft.id === nftId);
  const parsedCoinAmount = /^\d+$/.test(coinAmount) ? Number(coinAmount) : 0;
  const coinAmountValid = kind !== "coins"
    || (parsedCoinAmount >= 1 && parsedCoinAmount <= coins);
  const canSubmit = walletAddress.trim().length >= 16
    && kind !== null
    && coinAmountValid
    && (kind !== "nft" || Boolean(selectedNft));

  const submit = async () => {
    if (!kind || !canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        kind,
        walletAddress: walletAddress.trim(),
        amount: kind === "coins" ? parsedCoinAmount : undefined,
        nftId: kind === "nft" ? selectedNft?.id : undefined,
      });
      setSubmitted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось оставить заявку");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet height="82%" onClose={onClose} visible={visible}>
      <SwipeDismissScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {submitted ? (
          <View style={styles.success}>
            <View style={styles.successIcon}>
              <MaterialCommunityIcons color={colors.success} name="check" size={34} />
            </View>
            <Text style={styles.title}>Заявка принята</Text>
            <Text style={styles.successText}>
              Мы проверим заявку и отправим награду на указанный криптокошелёк.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.submitButtonText}>Готово</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Вывод награды</Text>
            <Text style={styles.subtitle}>Что хотите вывести?</Text>

            <View style={styles.kindRow}>
              <Pressable
                accessibilityLabel="Выбрать NAKTA Coin"
                accessibilityRole="button"
                accessibilityState={{ selected: kind === "coins", disabled: coins <= 0 }}
                disabled={coins <= 0}
                onPress={() => chooseKind("coins")}
                style={({ pressed }) => [
                  styles.kindCard,
                  styles.coinKindCard,
                  kind === "coins" && styles.coinKindCardSelected,
                  coins <= 0 && styles.kindCardDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.coinKindTitle}>NAKTA Coin</Text>
                <Text style={styles.coinKindValue}>{coins}</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Выбрать NFT"
                accessibilityRole="button"
                accessibilityState={{ selected: kind === "nft", disabled: !availableNfts.length }}
                disabled={!availableNfts.length}
                onPress={() => chooseKind("nft")}
                style={({ pressed }) => [
                  styles.kindCard,
                  styles.nftKindCard,
                  kind === "nft" && styles.nftKindCardSelected,
                  !availableNfts.length && styles.kindCardDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.nftKindTitle}>NFT</Text>
                <Text style={styles.nftKindValue}>{availableNfts.length}</Text>
              </Pressable>
            </View>

            {kind === "nft" && availableNfts.length > 1 ? (
              <View style={styles.nftSelector}>
                <Text style={styles.fieldLabel}>Выберите NFT</Text>
                {availableNfts.map((nft) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: nft.id === nftId }}
                    key={nft.id}
                    onPress={() => setNftId(nft.id)}
                    style={({ pressed }) => [
                      styles.nftOption,
                      nft.id === nftId && styles.nftOptionSelected,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <View style={styles.nftOptionIcon}>
                      <MaterialCommunityIcons
                        color="#7C55E8"
                        name="hexagon-multiple-outline"
                        size={22}
                      />
                    </View>
                    <View style={styles.nftOptionCopy}>
                      <Text style={styles.nftOptionName}>{nft.name}</Text>
                      <Text style={styles.nftOptionNetwork}>{networkLabels[nft.network]}</Text>
                    </View>
                    <MaterialCommunityIcons
                      color={nft.id === nftId ? "#7C55E8" : "#C7C2D2"}
                      name={nft.id === nftId ? "radiobox-marked" : "radiobox-blank"}
                      size={22}
                    />
                  </Pressable>
                ))}
              </View>
            ) : null}

            {kind ? (
              <View style={styles.form}>
                {kind === "nft" ? (
                  <Text style={styles.selectionHint}>
                    К выводу: {selectedNft?.name || "NFT"}
                    {selectedNft ? ` · ${networkLabels[selectedNft.network]}` : ""}
                  </Text>
                ) : null}
                {kind === "coins" ? (
                  <>
                    <Text style={styles.fieldLabel}>Количество NAKTA Coin</Text>
                    <TextInput
                      accessibilityLabel="Количество NAKTA Coin для вывода"
                      keyboardType="number-pad"
                      maxLength={10}
                      onChangeText={(value) => setCoinAmount(value.replace(/\D/g, ""))}
                      placeholder={`От 1 до ${coins}`}
                      placeholderTextColor="#999999"
                      style={styles.amountInput}
                      value={coinAmount}
                    />
                    {coinAmount && !coinAmountValid ? (
                      <Text style={styles.amountError}>Введите количество от 1 до {coins}</Text>
                    ) : null}
                  </>
                ) : null}
                <Text style={styles.fieldLabel}>Адрес криптокошелька</Text>
                <TextInput
                  accessibilityLabel="Адрес криптокошелька"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setWalletAddress}
                  placeholder="Введите адрес кошелька"
                  placeholderTextColor="#999999"
                  style={styles.walletInput}
                  value={walletAddress}
                />
                <Text style={styles.addressHint}>
                  Проверьте адрес внимательно — изменить его после отправки заявки нельзя.
                </Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmit || submitting}
                  onPress={() => void submit()}
                  style={({ pressed }) => [
                    styles.submitButton,
                    (!canSubmit || submitting) && styles.submitButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Оставить заявку</Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </SwipeDismissScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 28,
  },
  title: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 7,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
  },
  kindRow: {
    marginTop: 22,
    flexDirection: "row",
    gap: 12,
  },
  kindCard: {
    flex: 1,
    minWidth: 0,
    height: 116,
    padding: 17,
    borderWidth: 2,
    borderRadius: 22,
  },
  coinKindCard: {
    borderColor: "transparent",
    backgroundColor: "#FF5410",
  },
  coinKindCardSelected: {
    borderColor: "#111111",
  },
  nftKindCard: {
    borderColor: "transparent",
    backgroundColor: "#EEE6FF",
  },
  nftKindCardSelected: {
    borderColor: "#7C55E8",
  },
  kindCardDisabled: {
    opacity: 0.38,
  },
  coinKindTitle: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  coinKindValue: {
    marginTop: "auto",
    color: colors.white,
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    lineHeight: 40,
  },
  nftKindTitle: {
    color: "#65558D",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  nftKindValue: {
    marginTop: "auto",
    color: "#251B3F",
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    lineHeight: 40,
  },
  nftSelector: {
    marginTop: 22,
    gap: 9,
  },
  nftOption: {
    minHeight: 64,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2DDEC",
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.white,
  },
  nftOptionSelected: {
    borderColor: "#7C55E8",
    backgroundColor: "#FAF8FF",
  },
  nftOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8FF",
  },
  nftOptionCopy: {
    flex: 1,
    minWidth: 0,
  },
  nftOptionName: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  nftOptionNetwork: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  form: {
    marginTop: 22,
  },
  selectionHint: {
    marginBottom: 17,
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 19,
  },
  fieldLabel: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 19,
  },
  walletInput: {
    height: 54,
    marginTop: 9,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#DEDEE2",
    borderRadius: 17,
    backgroundColor: "#F7F7F8",
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  amountInput: {
    height: 54,
    marginTop: 9,
    marginBottom: 17,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#DEDEE2",
    borderRadius: 17,
    backgroundColor: "#F7F7F8",
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  amountError: {
    marginTop: -10,
    marginBottom: 13,
    color: colors.danger,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  addressHint: {
    marginTop: 9,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    marginTop: 10,
    color: colors.danger,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    height: 56,
    marginTop: 20,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  submitButtonDisabled: {
    opacity: 0.35,
  },
  submitButtonText: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.76,
  },
  success: {
    paddingTop: 34,
    alignItems: "center",
  },
  successIcon: {
    width: 72,
    height: 72,
    marginBottom: 22,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8EF",
  },
  successText: {
    maxWidth: 300,
    marginTop: 10,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
});
