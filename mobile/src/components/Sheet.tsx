import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, shadow } from "../theme";

type Props = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  fullScreen?: boolean;
  edgeToEdge?: boolean;
  footer?: ReactNode;
  height?: ViewStyle["height"];
}>;

export function Sheet({
  visible,
  onClose,
  fullScreen,
  edgeToEdge,
  footer,
  height,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      animationType="slide"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <Pressable
          accessibilityLabel="Закрыть окно"
          onPress={onClose}
          style={[styles.backdrop, fullScreen && styles.backdropFull]}
        />
        <View
          style={[
            styles.sheet,
            fullScreen && styles.fullScreen,
            edgeToEdge && styles.edgeToEdge,
            height !== undefined && { height },
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 12, 12, 0.42)",
  },
  backdropFull: {
    backgroundColor: "rgba(12, 12, 12, 0.55)",
  },
  sheet: {
    maxHeight: "92%",
    minHeight: 180,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    backgroundColor: colors.white,
    ...shadow,
  },
  fullScreen: {
    maxHeight: "92%",
    height: "92%",
  },
  edgeToEdge: {
    maxHeight: "100%",
    height: "100%",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
