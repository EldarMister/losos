import { useEffect, useState, type PropsWithChildren, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, shadow } from "../theme";
import {
  DEFAULT_CLOSE_DISTANCE,
  DEFAULT_CLOSE_VELOCITY,
  SwipeDismissScrollProvider,
  useSwipeToDismiss,
} from "./SwipeDismiss";

export type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  closeOnBackdropPress?: boolean;
  closeOnBackPress?: boolean;
  enablePanDownToClose?: boolean;
  closeDistance?: number;
  closeVelocity?: number;
  maxHeight?: ViewStyle["maxHeight"];
  bottomInset?: number;
  scrollable?: boolean;

  // Compatibility flags for the sheets already used in the app.
  fullScreen?: boolean;
  edgeToEdge?: boolean;
  footer?: ReactNode;
  height?: ViewStyle["height"];
  swipeToDismiss?: boolean;
  backdropVisible?: boolean;
}>;

const OPEN_DURATION = 420;
const CLOSE_DURATION = 360;
const OPEN_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const CLOSE_EASING = Easing.bezier(0.4, 0, 0.2, 1);

export function BottomSheet({
  visible,
  onClose,
  closeOnBackdropPress = true,
  closeOnBackPress = true,
  enablePanDownToClose,
  closeDistance = DEFAULT_CLOSE_DISTANCE,
  closeVelocity = DEFAULT_CLOSE_VELOCITY,
  maxHeight,
  bottomInset = 0,
  scrollable: _scrollable,
  fullScreen,
  edgeToEdge,
  footer,
  height,
  swipeToDismiss = true,
  backdropVisible = true,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const openOffset = useSharedValue(visible ? 0 : windowHeight);
  const openProgress = useSharedValue(visible ? 1 : 0);
  const backdropVisibility = useSharedValue(backdropVisible ? 1 : 0);
  const swipe = useSwipeToDismiss({
    enabled: (enablePanDownToClose ?? swipeToDismiss) && !edgeToEdge,
    closeDistance,
    closeVelocity,
    onDismiss: onClose,
  });

  useEffect(() => {
    if (!visible) return;
    setMounted(true);
    swipe.reset();
    openOffset.value = windowHeight;
    openProgress.value = 0;
    const frame = requestAnimationFrame(() => {
      openOffset.value = withTiming(0, {
        duration: OPEN_DURATION,
        easing: OPEN_EASING,
      });
      openProgress.value = withTiming(1, {
        duration: OPEN_DURATION,
        easing: OPEN_EASING,
      });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [openOffset, openProgress, swipe.reset, visible, windowHeight]);

  useEffect(() => {
    if (!mounted || visible) return;
    openOffset.value = withTiming(
      Math.max(swipe.surfaceHeight.value, windowHeight),
      { duration: CLOSE_DURATION, easing: CLOSE_EASING },
      (finished) => {
        if (finished) runOnJS(setMounted)(false);
      },
    );
    openProgress.value = withTiming(0, {
      duration: CLOSE_DURATION,
      easing: CLOSE_EASING,
    });
  }, [mounted, openOffset, openProgress, swipe.surfaceHeight, visible, windowHeight]);

  useEffect(() => {
    backdropVisibility.value = withTiming(backdropVisible ? 1 : 0, {
      duration: CLOSE_DURATION,
      easing: OPEN_EASING,
    });
  }, [backdropVisibility, backdropVisible]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: openOffset.value + swipe.translationY.value }],
  }));
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const dragProgress = Math.min(
      1,
      swipe.translationY.value / Math.max(swipe.surfaceHeight.value, 1),
    );
    return {
      opacity: openProgress.value
        * backdropVisibility.value
        * (1 - dragProgress),
    };
  });

  if (!mounted) return null;

  return (
    <Modal
      animationType="none"
      hardwareAccelerated
      presentationStyle="overFullScreen"
      transparent
      statusBarTranslucent
      visible={mounted}
      onRequestClose={closeOnBackPress ? onClose : undefined}
    >
      <GestureHandlerRootView style={styles.root}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.root}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.backdrop,
              fullScreen && styles.backdropFull,
              backdropAnimatedStyle,
            ]}
          />
          <Pressable
            accessibilityLabel="Закрыть окно"
            accessibilityRole="button"
            disabled={!closeOnBackdropPress}
            onPress={onClose}
            pointerEvents={closeOnBackdropPress ? "auto" : "none"}
            style={StyleSheet.absoluteFill}
          />
          <GestureDetector gesture={swipe.gesture}>
            <Animated.View
              onLayout={(event) => swipe.onLayout(event.nativeEvent.layout.height)}
              style={[
                styles.sheet,
                fullScreen && styles.fullScreen,
                edgeToEdge && styles.edgeToEdge,
                height !== undefined && { height },
                maxHeight !== undefined && { maxHeight },
                sheetAnimatedStyle,
              ]}
            >
              <View
                collapsable={false}
                style={[
                  styles.surface,
                  edgeToEdge && styles.surfaceEdgeToEdge,
                  {
                    paddingBottom: Math.max(
                      insets.bottom,
                      Platform.OS === "android" ? 24 : 12,
                    ) + bottomInset,
                  },
                ]}
              >
                <SwipeDismissScrollProvider scrollOffsetY={swipe.scrollOffsetY}>
                  <View style={styles.content}>{children}</View>
                  {footer ? <View style={styles.footer}>{footer}</View> : null}
                </SwipeDismissScrollProvider>
              </View>
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

/** @deprecated Use BottomSheet for new sheets. */
export const Sheet = BottomSheet;

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
  surface: {
    flex: 1,
    overflow: "hidden",
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    backgroundColor: colors.white,
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
  surfaceEdgeToEdge: {
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
