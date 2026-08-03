import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ComponentProps,
  type PropsWithChildren,
} from "react";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

const DISMISS_DISTANCE_FRACTION = 0.42;
const DISMISS_VELOCITY = 1_500;
const MIN_FLING_DISTANCE = 96;
const MIN_FLING_DISTANCE_FRACTION = 0.14;
const DRAG_ACTIVATION_DISTANCE = 8;
const DISMISS_DURATION = 360;
const DISMISS_EASING = Easing.bezier(0.4, 0, 0.2, 1);

export function shouldActivateSheetDrag(
  deltaX: number,
  deltaY: number,
  scrollOffsetY: number,
) {
  "worklet";
  const vertical = Math.abs(deltaY) > Math.abs(deltaX) * 1.15;
  return deltaY > DRAG_ACTIVATION_DISTANCE
    && vertical
    && scrollOffsetY <= 0.5;
}

export function shouldDismissSheet(
  translationY: number,
  height: number,
  velocityY: number,
) {
  "worklet";
  const safeHeight = Math.max(1, height);
  return translationY > safeHeight * DISMISS_DISTANCE_FRACTION
    || (
      velocityY > DISMISS_VELOCITY
      && translationY > Math.max(MIN_FLING_DISTANCE, safeHeight * MIN_FLING_DISTANCE_FRACTION)
    );
}

type Options = {
  enabled?: boolean;
  dismissEnabled?: boolean;
  onDismiss: () => void;
};

export function useSwipeToDismiss({
  enabled = true,
  dismissEnabled = true,
  onDismiss,
}: Options) {
  const translationY = useSharedValue(0);
  const surfaceHeight = useSharedValue(0);
  const scrollOffsetY = useSharedValue(0);
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);
  const dismissing = useSharedValue(false);
  const finishDismiss = useCallback(() => {
    setTimeout(onDismiss, DISMISS_DURATION - 40);
  }, [onDismiss]);

  const reset = useCallback(() => {
    translationY.value = 0;
    scrollOffsetY.value = 0;
    dismissing.value = false;
  }, [dismissing, scrollOffsetY, translationY]);

  const gesture = useMemo(() => Gesture.Pan()
    .enabled(enabled)
    .manualActivation(true)
    .onTouchesDown((event) => {
      const touch = event.allTouches[0];
      if (!touch) return;
      touchStartX.value = touch.x;
      touchStartY.value = touch.y;
    })
    .onTouchesMove((event, stateManager) => {
      const touch = event.allTouches[0];
      if (!touch) return;
      const deltaX = touch.x - touchStartX.value;
      const deltaY = touch.y - touchStartY.value;
      const vertical = Math.abs(deltaY) > Math.abs(deltaX) * 1.15;

      if (shouldActivateSheetDrag(deltaX, deltaY, scrollOffsetY.value)) {
        stateManager.activate();
        return;
      }
      if (
        deltaY < -DRAG_ACTIVATION_DISTANCE
        || (Math.abs(deltaX) > DRAG_ACTIVATION_DISTANCE && !vertical)
        || scrollOffsetY.value > 0.5
      ) {
        stateManager.fail();
      }
    })
    .onUpdate((event) => {
      if (!dismissing.value) {
        translationY.value = Math.max(0, event.translationY);
      }
    })
    .onEnd((event) => {
      if (dismissEnabled && shouldDismissSheet(
        translationY.value,
        surfaceHeight.value,
        event.velocityY,
      )) {
        dismissing.value = true;
        translationY.value = withTiming(
          Math.max(surfaceHeight.value, 480),
          { duration: DISMISS_DURATION, easing: DISMISS_EASING },
        );
        // The native timing callback can be cancelled when the sheet layout changes
        // during the gesture. Schedule the state change on JS so an off-screen sheet
        // never remains mounted above the map.
        runOnJS(finishDismiss)();
        return;
      }
      translationY.value = withSpring(0, {
        damping: 24,
        stiffness: 260,
        mass: 0.72,
        overshootClamping: true,
      });
    })
    .onFinalize(() => {
      if (!dismissing.value && translationY.value > 0) {
        translationY.value = withSpring(0, {
          damping: 24,
          stiffness: 260,
          mass: 0.72,
          overshootClamping: true,
        });
      }
    }), [
    dismissing,
    dismissEnabled,
    enabled,
    finishDismiss,
    scrollOffsetY,
    surfaceHeight,
    touchStartX,
    touchStartY,
    translationY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translationY.value }],
  }));

  const onLayout = useCallback((height: number) => {
    surfaceHeight.value = height;
  }, [surfaceHeight]);

  return {
    animatedStyle,
    gesture,
    onLayout,
    reset,
    scrollOffsetY,
    surfaceHeight,
    translationY,
  };
}

const SwipeScrollContext = createContext<SharedValue<number> | null>(null);

export function SwipeDismissScrollProvider({
  children,
  scrollOffsetY,
}: PropsWithChildren<{ scrollOffsetY: SharedValue<number> }>) {
  return (
    <SwipeScrollContext.Provider value={scrollOffsetY}>
      {children}
    </SwipeScrollContext.Provider>
  );
}

type SwipeDismissScrollViewProps = ComponentProps<typeof Animated.ScrollView>;

export function SwipeDismissScrollView({
  onScroll,
  scrollEventThrottle = 16,
  ...props
}: SwipeDismissScrollViewProps) {
  const scrollOffsetY = useContext(SwipeScrollContext);
  const trackScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollOffsetY) scrollOffsetY.value = Math.max(0, event.contentOffset.y);
    },
  });

  return (
    <Animated.ScrollView
      {...props}
      onScroll={scrollOffsetY ? trackScroll : onScroll}
      scrollEventThrottle={scrollEventThrottle}
    />
  );
}
