import { useEffect, useRef } from "react";
import {
  type GestureResponderEvent,
  type PressableProps,
} from "react-native";
import { RipplePressable } from "./RipplePressable";

type Props = Omit<PressableProps, "onPress"> & {
  onPress: (event: GestureResponderEvent) => void;
};

const PRESS_DEDUPLICATION_WINDOW_MS = 250;

export function ImmediatePressable({
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: Props) {
  const firedOnPressIn = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const handlePressIn = (event: GestureResponderEvent) => {
    firedOnPressIn.current = true;
    onPressIn?.(event);
    onPress(event);
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (firedOnPressIn.current) {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      firedOnPressIn.current = false;
      return;
    }
    onPress(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    onPressOut?.(event);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      firedOnPressIn.current = false;
      resetTimer.current = null;
    }, PRESS_DEDUPLICATION_WINDOW_MS);
  };

  return (
    <RipplePressable
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    />
  );
}
