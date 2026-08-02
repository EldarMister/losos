import { useCallback, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  runOnJS,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const DISMISS_DISTANCE_FRACTION = 0.25;
const DISMISS_VELOCITY = -900;
const DRAG_ACTIVATION_DISTANCE = 8;

export function shouldActivateDrawerDrag(deltaX: number, deltaY: number) {
  "worklet";
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.15;
  return deltaX < -DRAG_ACTIVATION_DISTANCE && horizontal;
}

export function shouldDismissDrawer(
  translationX: number,
  width: number,
  velocityX: number,
) {
  "worklet";
  return velocityX < DISMISS_VELOCITY
    || translationX < -Math.max(1, width) * DISMISS_DISTANCE_FRACTION;
}

export function useDrawerDismiss({
  enabled = true,
  onDismiss,
}: {
  enabled?: boolean;
  onDismiss: () => void;
}) {
  const translationX = useSharedValue(0);
  const drawerWidth = useSharedValue(0);
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);
  const dismissing = useSharedValue(false);

  const reset = useCallback(() => {
    translationX.value = 0;
    dismissing.value = false;
  }, [dismissing, translationX]);

  const onLayout = useCallback((width: number) => {
    drawerWidth.value = width;
  }, [drawerWidth]);

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
      const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.15;

      if (shouldActivateDrawerDrag(deltaX, deltaY)) {
        stateManager.activate();
        return;
      }
      if (
        deltaX > DRAG_ACTIVATION_DISTANCE
        || (Math.abs(deltaY) > DRAG_ACTIVATION_DISTANCE && !horizontal)
      ) {
        stateManager.fail();
      }
    })
    .onUpdate((event) => {
      if (!dismissing.value) {
        translationX.value = Math.min(0, event.translationX);
      }
    })
    .onEnd((event) => {
      if (shouldDismissDrawer(
        translationX.value,
        drawerWidth.value,
        event.velocityX,
      )) {
        dismissing.value = true;
        translationX.value = withTiming(
          -Math.max(drawerWidth.value, 360),
          { duration: 190 },
          (finished) => {
            if (finished) runOnJS(onDismiss)();
          },
        );
        return;
      }
      translationX.value = withSpring(0, {
        damping: 24,
        stiffness: 260,
        mass: 0.72,
        overshootClamping: true,
      });
    })
    .onFinalize(() => {
      if (!dismissing.value && translationX.value < 0) {
        translationX.value = withSpring(0, {
          damping: 24,
          stiffness: 260,
          mass: 0.72,
          overshootClamping: true,
        });
      }
    }), [
    dismissing,
    drawerWidth,
    enabled,
    onDismiss,
    touchStartX,
    touchStartY,
    translationX,
  ]);

  return {
    dismissing,
    drawerWidth,
    gesture,
    onLayout,
    reset,
    translationX,
  };
}
