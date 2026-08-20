import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  busy?: boolean;
  onAllow: () => void;
  onDeny: () => void;
  visible: boolean;
};

export function NotificationPermissionPrompt({ busy, onAllow, onDeny, visible }: Props) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={busy ? undefined : onDeny}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.copyBlock}>
            <Text style={styles.title}>
              «Накта суши» запрашивает разрешение на отправку уведомлений
            </Text>
            <Text style={styles.copy}>
              Уведомления сообщат о статусе заказов и заявок на вывод наград.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Не разрешать уведомления"
            accessibilityRole="button"
            disabled={busy}
            onPress={onDeny}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionText}>Не разрешать</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Разрешить уведомления"
            accessibilityRole="button"
            disabled={busy}
            onPress={onAllow}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionText}>{busy ? "Подождите…" : "Разрешить"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "rgba(27,18,38,0.34)",
  },
  dialog: {
    width: "100%",
    maxWidth: 344,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  copyBlock: {
    minHeight: 208,
    paddingTop: 36,
    paddingHorizontal: 27,
    paddingBottom: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#171717",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  copy: {
    marginTop: 25,
    color: "#2F2F2F",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "400",
    textAlign: "center",
  },
  action: {
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D7D7DC",
    backgroundColor: "#FFFFFF",
  },
  actionPressed: {
    backgroundColor: "#F2F2F5",
  },
  actionText: {
    color: "#1677FF",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "400",
  },
});
