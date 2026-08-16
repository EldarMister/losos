import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi, resolveImageUrl } from "../api";
import { formatMoney } from "../money";
import { useStore } from "../store";
import { colors } from "../theme";
import type { AccountNft, NaktaCoinTransaction, ProfileData, ProfileOrder } from "../types";
import { useOrderLiveRefresh } from "../useOrderLiveRefresh";

const publicOrderNumber = (order: Pick<ProfileOrder, "id" | "orderNumber">) =>
  String(order.orderNumber || order.id.slice(0, 6).toUpperCase());

const money = formatMoney;

const statuses: Record<ProfileOrder["status"], string> = {
  new: "Принят",
  confirmed: "Подтверждён",
  preparing: "Готовим",
  ready: "Готов",
  delivering: "В пути",
  completed: "Выполнен",
  cancelled: "Отменён",
};

const nftStatusLabels: Record<AccountNft["status"], string> = {
  owned: "Доступен для вывода",
  pending: "Заявка на вывод принята",
  submitted: "Транзакция отправлена",
  withdrawn: "Выведен на кошелёк",
  failed: "Вывод не выполнен",
};

const nftNetworkLabels: Record<AccountNft["network"], string> = {
  polygon: "Polygon",
  ethereum: "Ethereum",
  bsc: "BNB Smart Chain",
  solana: "Solana",
  ton: "TON",
};

function finiteCoinAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

export function profileCoinHistory(profile: ProfileData | null): NaktaCoinTransaction[] {
  if (!profile) return [];
  const rawProfile = profile as unknown as Record<string, unknown>;
  const serverHistory = [
    rawProfile.naktaCoinHistory,
    rawProfile.naktaCoinsHistory,
    rawProfile.coinHistory,
    rawProfile.coinTransactions,
    rawProfile.transactions,
  ].find(Array.isArray) as Array<Record<string, unknown>> | undefined;

  const normalized = (serverHistory ?? []).flatMap((entry, index) => {
    const amount = finiteCoinAmount(
      entry.amount ?? entry.coins ?? entry.value ?? entry.naktaCoins,
    );
    if (!amount) return [];
    const orderId = typeof entry.orderId === "string" ? entry.orderId : undefined;
    return [{
      id: String(entry.id ?? orderId ?? `coin-${index}`),
      amount,
      createdAt: typeof (entry.createdAt ?? entry.date) === "string"
        ? String(entry.createdAt ?? entry.date)
        : undefined,
      description: String(
        entry.description
        ?? entry.title
        ?? entry.reason
        ?? (amount > 0 ? "Начисление NAKTA Coin" : "Списание NAKTA Coin"),
      ),
      orderId,
    } satisfies NaktaCoinTransaction];
  });
  if (normalized.length) return normalized;

  const orderEntries = profile.orderHistory.flatMap((order) => {
    const amount = finiteCoinAmount(order.earnedNaktaCoins ?? order.naktaCoins);
    if (!amount) return [];
    return [{
      id: `order-${order.id}`,
      amount,
      createdAt: order.createdAt,
      description: `Заказ №${publicOrderNumber(order)}`,
      orderId: order.id,
    } satisfies NaktaCoinTransaction];
  });
  if (orderEntries.length) return orderEntries;

  return profile.naktaCoins > 0 ? [{
    id: "previous-orders",
    amount: profile.naktaCoins,
    description: "Начислено за предыдущие заказы",
  }] : [];
}

type Section = "orders" | "balance" | "settings";

type Props = {
  section: Section;
  onBack: () => void;
  onOpenOrder: (orderId: string) => void;
  onLogout: () => void;
  onAccountDeleted?: () => void | Promise<void>;
};

function OrderCard({
  order,
  address,
  onPress,
}: {
  order: ProfileOrder;
  address?: string;
  onPress: () => void;
}) {
  const completed = order.status === "completed";
  const cancelled = order.status === "cancelled";

  return (
    <Pressable
      accessibilityLabel={`Заказ №${publicOrderNumber(order)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.orderCard, pressed && styles.orderPressed]}
    >
      <View
        style={[
          styles.statusPill,
          completed && styles.statusCompleted,
          cancelled && styles.statusCancelled,
        ]}
      >
        <Text style={[
          styles.statusText,
          completed && styles.statusTextCompleted,
          cancelled && styles.statusTextCancelled,
        ]}>
          {statuses[order.status]}
        </Text>
      </View>
      <View style={styles.orderMainRow}>
        <View style={styles.orderMainCopy}>
        <Text style={styles.orderTitle}>
          Заказ №{publicOrderNumber(order)}
        </Text>
        <Text numberOfLines={1} style={styles.orderSubtitle}>
          {new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(order.createdAt))}
          {" · "}
          {order.deliveryType === "pickup" ? "самовывоз" : "доставка"}
        </Text>
        </View>
        <View style={styles.orderAmountRow}>
          <Text style={styles.orderTotal}>{money(order.total)}</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#77797E" />
        </View>
      </View>

      <View style={styles.deliveryPreview}>
        <View style={styles.deliveryPreviewIcon}>
          <MaterialCommunityIcons
            name={order.deliveryType === "pickup" ? "shopping-outline" : "shopping-outline"}
            size={19}
            color={colors.orange}
          />
        </View>
        <View style={styles.deliveryPreviewCopy}>
          <Text style={styles.deliveryPreviewTitle}>
            {order.deliveryType === "pickup" ? "Самовывоз" : "Доставка"}
          </Text>
          <Text numberOfLines={1} style={styles.deliveryPreviewAddress}>
            {address || order.address || "Загружаем адрес…"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function BackHeader({
  onBack,
  top,
  backgroundColor,
}: {
  onBack: () => void;
  top: number;
  backgroundColor: string;
}) {
  return (
    <View style={{ paddingTop: top, backgroundColor }}>
      <Pressable
        accessibilityLabel="Назад"
        hitSlop={4}
        onPress={onBack}
        style={styles.back}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={20}
          color={colors.ink}
        />
      </Pressable>
    </View>
  );
}

export function ProfileScreen({
  section,
  onBack,
  onOpenOrder,
  onLogout,
  onAccountDeleted,
}: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [orderTab, setOrderTab] = useState<"active" | "history">("active");
  const [orderAddresses, setOrderAddresses] = useState<Record<string, string>>({});
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [walletDrafts, setWalletDrafts] = useState<Record<string, string>>({});
  const [withdrawingNft, setWithdrawingNft] = useState<string | null>(null);
  const [nftError, setNftError] = useState<Record<string, string>>({});
  const addressRequests = useRef(new Set<string>());

  const load = useCallback(async (refresh = false, silent = false) => {
    if (!store.session) return;
    if (!silent) {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");
    }
    try {
      setProfile(await authApi.profile(store.session));
    } catch (reason) {
      if (!silent) {
        setError(
          reason instanceof Error ? reason.message : "Не удалось загрузить профиль",
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [store.session]);

  useEffect(() => {
    void load();
  }, [load]);

  useOrderLiveRefresh(
    useCallback(() => load(false, true), [load]),
    Boolean(store.session) && (section === "orders" || section === "balance"),
  );

  const orders = useMemo(
    () => orderTab === "active"
      ? profile?.currentOrders ?? []
      : profile?.orderHistory ?? [],
    [orderTab, profile],
  );
  const coinHistory = useMemo(() => profileCoinHistory(profile), [profile]);
  const nfts = profile?.nfts ?? [];

  const withdrawNft = async (nft: AccountNft) => {
    const walletAddress = walletDrafts[nft.id]?.trim() || "";
    if (!store.session || !walletAddress || withdrawingNft) return;
    setWithdrawingNft(nft.id);
    setNftError((current) => ({ ...current, [nft.id]: "" }));
    try {
      const updated = await authApi.withdrawNft(store.session, nft.id, walletAddress);
      setProfile((current) => current ? {
        ...current,
        nfts: (current.nfts ?? []).map((item) => item.id === updated.id ? updated : item),
      } : current);
    } catch (reason) {
      setNftError((current) => ({
        ...current,
        [nft.id]: reason instanceof Error ? reason.message : "Не удалось вывести NFT",
      }));
    } finally {
      setWithdrawingNft(null);
    }
  };

  useEffect(() => {
    if (!store.session) return;
    const missing = orders.filter((order) => (
      !order.address
      && !orderAddresses[order.id]
      && !addressRequests.current.has(order.id)
    ));
    if (!missing.length) return;

    missing.forEach((order) => addressRequests.current.add(order.id));
    let cancelled = false;
    void Promise.all(missing.map(async (order) => {
      try {
        const detail = await authApi.order(store.session!, order.id);
        return [order.id, detail.address] as const;
      } catch {
        return [order.id, "Адрес не указан"] as const;
      }
    })).then((entries) => {
      if (!cancelled) {
        setOrderAddresses((current) => ({ ...current, ...Object.fromEntries(entries) }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [orderAddresses, orders, store.session]);
  const backgroundColor = section === "balance" ? "#F8F8F8" : colors.white;

  const deleteAccount = useCallback(async () => {
    if (!store.session || deletingAccount) return;
    setDeletingAccount(true);
    setDeleteError("");
    try {
      await authApi.deleteAccount(store.session);
      await onAccountDeleted?.();
    } catch (reason) {
      setDeleteError(
        reason instanceof Error ? reason.message : "Не удалось удалить аккаунт",
      );
    } finally {
      setDeletingAccount(false);
    }
  }, [deletingAccount, onAccountDeleted, store.session]);

  const confirmAccountDeletion = () => {
    Alert.alert(
      "Удалить аккаунт?",
      "Заказы, баланс, сессия и данные профиля будут удалены без возможности восстановления.",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: () => void deleteAccount() },
      ],
    );
  };

  const refreshControl = (
    <RefreshControl
      colors={[colors.orange]}
      onRefresh={() => void load(true)}
      refreshing={refreshing}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <StatusBar backgroundColor={backgroundColor} style="dark" />
      <BackHeader
        backgroundColor={backgroundColor}
        onBack={onBack}
        top={insets.top}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.orange} size="large" />
          <Text style={styles.muted}>Загружаем данные…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="account-alert-outline"
            size={44}
            color="#999999"
          />
          <Text style={styles.errorTitle}>Не удалось загрузить данные</Text>
          <Text style={styles.muted}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      ) : section === "orders" ? (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16) + 20,
          }}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Мои заказы</Text>
          <View style={styles.orderTabs}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: orderTab === "active" }}
              onPress={() => setOrderTab("active")}
              style={[styles.orderTab, orderTab === "active" && styles.orderTabSelected]}
            >
              <Text style={[styles.orderTabText, orderTab === "active" && styles.orderTabTextSelected]}>
                Активные
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: orderTab === "history" }}
              onPress={() => setOrderTab("history")}
              style={[styles.orderTab, orderTab === "history" && styles.orderTabSelected]}
            >
              <Text style={[styles.orderTabText, orderTab === "history" && styles.orderTabTextSelected]}>
                История
              </Text>
            </Pressable>
          </View>
          {orders.length ? (
            orders.map((order) => (
              <OrderCard
                address={orderAddresses[order.id]}
                key={order.id}
                onPress={() => onOpenOrder(order.id)}
                order={order}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptySeparator} />
              <View style={styles.emptyIllustration}>
                <MaterialCommunityIcons
                  name="food-takeout-box-outline"
                  size={78}
                  color={colors.orange}
                />
                <MaterialCommunityIcons
                  name="fish"
                  size={39}
                  color={colors.white}
                  style={styles.emptyFish}
                />
              </View>
              <Text style={styles.emptyText}>
                Пока здесь пусто,{"\n"}пора сделать первый заказ!
              </Text>
              <Pressable onPress={onBack} style={styles.menuButton}>
                <Text style={styles.menuButtonText}>Меню</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      ) : section === "balance" ? (
        <ScrollView
          contentContainerStyle={[
            styles.balanceContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.screenTitle, styles.balanceTitle]}>NAKTA Coin</Text>
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>Ваш баланс</Text>
              <Text style={styles.balanceValue}>
                {profile?.naktaCoins ?? 0}
              </Text>
            </View>
            <View style={styles.coinIcon}>
              <Image
                accessibilityLabel="Иконка NAKTA Coin"
                resizeMode="contain"
                source={require("../../assets/coin.png")}
                style={styles.coinImage}
              />
            </View>
          </View>
          <View style={styles.nftBalanceCard}>
            <View>
              <Text style={styles.nftBalanceLabel}>Ваши NFT</Text>
              <Text style={styles.nftBalanceValue}>{nfts.length}</Text>
              <Text style={styles.nftBalanceCaption}>отдельно от NAKTA Coin</Text>
            </View>
            <View style={styles.nftBalanceIcon}>
              <MaterialCommunityIcons name="hexagon-multiple-outline" size={34} color="#7C55E8" />
            </View>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Как работают NAKTA Coin</Text>
            <Text style={styles.infoText}>
              Баланс и начисления приходят с сервера Накта суши. Используйте
              доступные монеты в заказе, когда эта возможность появится в
              оформлении.
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Мои NFT</Text>
            <Text style={styles.infoText}>
              NFT начисляются вместе с NAKTA Coin после завершения заказа. Для
              вывода укажите адрес кошелька в нужной сети.
            </Text>
            {nfts.length ? (
              <View style={styles.nftList}>
                {nfts.map((nft) => {
                  const canWithdraw = nft.status === "owned" || nft.status === "failed";
                  return (
                    <View key={nft.id} style={styles.nftCard}>
                      <View style={styles.nftHeader}>
                        {nft.image ? (
                          <Image
                            accessibilityLabel={`NFT ${nft.name}`}
                            source={{ uri: resolveImageUrl(nft.image) }}
                            style={styles.nftImage}
                          />
                        ) : (
                          <View style={[styles.nftImage, styles.nftImagePlaceholder]}>
                            <MaterialCommunityIcons name="hexagon-outline" size={32} color="#7C55E8" />
                          </View>
                        )}
                        <View style={styles.nftCopy}>
                          <Text style={styles.nftName}>{nft.name}</Text>
                          <Text style={styles.nftMeta}>
                            {nftNetworkLabels[nft.network]} · {nftStatusLabels[nft.status]}
                          </Text>
                          <Text style={styles.nftMeta}>
                            Награда за {nft.milestoneOrderCount}-й завершённый заказ
                          </Text>
                        </View>
                      </View>
                      {nft.description ? <Text style={styles.nftDescription}>{nft.description}</Text> : null}
                      {canWithdraw ? (
                        <>
                          <TextInput
                            accessibilityLabel={`Адрес кошелька для ${nft.name}`}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={(value) => setWalletDrafts((current) => ({
                              ...current,
                              [nft.id]: value,
                            }))}
                            placeholder={`Адрес кошелька ${nftNetworkLabels[nft.network]}`}
                            placeholderTextColor="#999999"
                            style={styles.walletInput}
                            value={walletDrafts[nft.id] || ""}
                          />
                          <Pressable
                            accessibilityRole="button"
                            disabled={!walletDrafts[nft.id]?.trim() || withdrawingNft === nft.id}
                            onPress={() => void withdrawNft(nft)}
                            style={({ pressed }) => [
                              styles.withdrawButton,
                              pressed && styles.withdrawButtonPressed,
                              (!walletDrafts[nft.id]?.trim() || withdrawingNft === nft.id)
                                && styles.withdrawButtonDisabled,
                            ]}
                          >
                            {withdrawingNft === nft.id ? (
                              <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                              <Text style={styles.withdrawButtonText}>
                                {nft.status === "failed" ? "Повторить вывод" : "Вывести NFT"}
                              </Text>
                            )}
                          </Pressable>
                        </>
                      ) : nft.walletAddress ? (
                        <Text numberOfLines={1} style={styles.walletStatus}>Кошелёк: {nft.walletAddress}</Text>
                      ) : null}
                      {nft.txHash ? <Text numberOfLines={1} style={styles.walletStatus}>Tx: {nft.txHash}</Text> : null}
                      {nft.withdrawalError || nftError[nft.id] ? (
                        <Text style={styles.nftError}>{nftError[nft.id] || nft.withdrawalError}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.nftEmpty}>NFT пока нет.</Text>
            )}
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>История начислений</Text>
            {coinHistory.length ? (
              <View style={styles.coinHistory}>
                {coinHistory.map((entry) => (
                  <Pressable
                    accessibilityRole={entry.orderId ? "button" : undefined}
                    disabled={!entry.orderId}
                    key={entry.id}
                    onPress={entry.orderId ? () => onOpenOrder(entry.orderId!) : undefined}
                    style={styles.coinHistoryRow}
                  >
                    <View style={styles.coinHistoryCopy}>
                      <Text style={styles.coinHistoryTitle}>{entry.description}</Text>
                      {entry.createdAt ? (
                        <Text style={styles.coinHistoryDate}>
                          {new Intl.DateTimeFormat("ru-RU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }).format(new Date(entry.createdAt))}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[
                      styles.coinHistoryAmount,
                      entry.amount < 0 && styles.coinHistoryAmountNegative,
                    ]}>
                      {entry.amount > 0 ? "+" : ""}
                      {new Intl.NumberFormat("ru-RU").format(entry.amount)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.infoText}>Начислений пока нет.</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.settingsContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.screenTitle, styles.settingsTitle]}>Настройки</Text>
          <View style={styles.settingsField}>
            <Text style={styles.fieldLabel}>Телефон аккаунта</Text>
            <Text style={styles.fieldValue}>{store.session?.phone}</Text>
          </View>
          <View style={styles.settingsField}>
            <Text style={styles.fieldLabel}>Баланс NAKTA Coin</Text>
            <Text style={styles.fieldValue}>{profile?.naktaCoins ?? 0}</Text>
          </View>
          <Pressable onPress={onLogout} style={styles.logout}>
            <Text style={styles.logoutText}>Выйти из профиля</Text>
            <View style={styles.logoutIcon}>
              <MaterialCommunityIcons
                name="logout"
                size={21}
                color={colors.white}
              />
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={deletingAccount}
            onPress={confirmAccountDeletion}
            style={({ pressed }) => [
              styles.deleteAccount,
              pressed && styles.deleteAccountPressed,
              deletingAccount && styles.deleteAccountDisabled,
            ]}
          >
            {deletingAccount ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <MaterialCommunityIcons name="delete-outline" size={21} color={colors.danger} />
            )}
            <Text style={styles.deleteAccountText}>Удалить аккаунт</Text>
          </Pressable>
          {deleteError ? <Text style={styles.deleteAccountError}>{deleteError}</Text> : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  back: {
    width: 48,
    height: 48,
    marginTop: 16,
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  muted: {
    color: "#999999",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  errorTitle: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  retry: {
    minHeight: 52,
    marginTop: 8,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  retryText: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
  },
  screenTitle: {
    marginTop: 6,
    marginLeft: 16,
    color: "#000000",
    fontFamily: "Inter_700Bold",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "700",
  },
  orderTabs: {
    height: 48,
    marginTop: 14,
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 16,
    flexDirection: "row",
    backgroundColor: "#F3F3F3",
  },
  orderTab: {
    flex: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  orderTabSelected: {
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  orderTabText: {
    color: colors.muted,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  orderTabTextSelected: {
    color: colors.orange,
    fontFamily: "Inter_600SemiBold",
  },
  orderCard: {
    marginTop: 14,
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  orderPressed: {
    opacity: 0.82,
  },
  orderMainRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  orderMainCopy: {
    flex: 1,
    minWidth: 0,
  },
  orderTitle: {
    color: "#000000",
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  orderSubtitle: {
    marginTop: 4,
    color: "#999999",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  orderAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  orderTotal: {
    color: "#000000",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  statusPill: {
    alignSelf: "flex-start",
    minHeight: 27,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0E9",
  },
  statusCompleted: {
    backgroundColor: "#ECF7EF",
  },
  statusCancelled: {
    backgroundColor: "#FFF0F0",
  },
  statusText: {
    color: colors.orange,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 15,
  },
  statusTextCompleted: {
    color: colors.success,
  },
  statusTextCancelled: {
    color: colors.danger,
  },
  deliveryPreview: {
    minHeight: 63,
    marginTop: 14,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FCFCFC",
  },
  deliveryPreviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0E9",
  },
  deliveryPreviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  deliveryPreviewTitle: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 15,
  },
  deliveryPreviewAddress: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 14,
  },
  empty: {
    alignItems: "center",
  },
  emptySeparator: {
    width: 276,
    height: 1,
    marginTop: 8,
    backgroundColor: "#E1E1E1",
  },
  emptyIllustration: {
    width: 147,
    height: 203,
    marginTop: 16,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orangeSoft,
  },
  emptyFish: {
    position: "absolute",
    bottom: 41,
    padding: 10,
    borderRadius: 22,
    backgroundColor: colors.orange,
  },
  emptyText: {
    marginTop: 48,
    marginHorizontal: 28,
    color: "#000000",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  menuButton: {
    width: 264,
    height: 52,
    marginTop: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  menuButtonText: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
  },
  balanceContent: {
    paddingBottom: 20,
  },
  balanceTitle: {
    marginBottom: 16,
  },
  balanceCard: {
    minHeight: 160,
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.orange,
  },
  nftBalanceCard: {
    minHeight: 132,
    marginTop: 12,
    marginHorizontal: 16,
    padding: 22,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEE8FF",
  },
  nftBalanceLabel: {
    color: "#65558D",
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  nftBalanceValue: {
    marginTop: 3,
    color: "#251B3F",
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    lineHeight: 44,
  },
  nftBalanceCaption: {
    color: "#796B99",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  nftBalanceIcon: {
    width: 64,
    height: 64,
    marginLeft: "auto",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  balanceValue: {
    marginTop: 8,
    color: colors.white,
    fontFamily: "Inter_700Bold",
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
  },
  coinIcon: {
    width: 64,
    height: 64,
    marginLeft: "auto",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  coinImage: {
    width: 56,
    height: 56,
  },
  infoCard: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.white,
  },
  infoTitle: {
    color: "#000000",
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  infoText: {
    marginTop: 10,
    color: "#666666",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  nftList: {
    marginTop: 14,
    gap: 12,
  },
  nftCard: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#DDD6EF",
    borderRadius: 18,
    backgroundColor: "#FBF9FF",
  },
  nftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nftImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#EEE8FF",
  },
  nftImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  nftCopy: {
    flex: 1,
    minWidth: 0,
  },
  nftName: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    lineHeight: 21,
  },
  nftMeta: {
    marginTop: 4,
    color: "#796B99",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  nftDescription: {
    marginTop: 10,
    color: "#666666",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  walletInput: {
    height: 48,
    marginTop: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D8D1E8",
    borderRadius: 13,
    backgroundColor: colors.white,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  withdrawButton: {
    height: 46,
    marginTop: 9,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C55E8",
  },
  withdrawButtonPressed: {
    opacity: 0.8,
  },
  withdrawButtonDisabled: {
    opacity: 0.45,
  },
  withdrawButtonText: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  walletStatus: {
    marginTop: 9,
    color: "#796B99",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  nftError: {
    marginTop: 9,
    color: colors.danger,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  nftEmpty: {
    marginTop: 12,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  coinHistory: {
    marginTop: 8,
  },
  coinHistoryRow: {
    minHeight: 62,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinHistoryCopy: {
    flex: 1,
    minWidth: 0,
  },
  coinHistoryTitle: {
    color: colors.ink,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 20,
  },
  coinHistoryDate: {
    marginTop: 3,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  coinHistoryAmount: {
    color: colors.success,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    lineHeight: 23,
  },
  coinHistoryAmountNegative: {
    color: colors.danger,
  },
  settingsContent: {
    paddingHorizontal: 16,
  },
  settingsTitle: {
    marginLeft: 0,
  },
  settingsField: {
    minHeight: 52,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F2F2F2",
  },
  fieldLabel: {
    color: "#666666",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  fieldValue: {
    color: "#000000",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
  },
  logout: {
    height: 52,
    marginTop: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: colors.ink,
  },
  logoutText: {
    flex: 1,
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  logoutIcon: {
    width: 68,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  deleteAccount: {
    height: 52,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#F1B9B9",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#FFF8F8",
  },
  deleteAccountPressed: {
    backgroundColor: "#FFEDED",
  },
  deleteAccountDisabled: {
    opacity: 0.6,
  },
  deleteAccountText: {
    color: colors.danger,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  deleteAccountError: {
    marginTop: 10,
    color: colors.danger,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
