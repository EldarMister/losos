import { useEffect, useRef } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
} from "react-native";

type Props = Omit<PressableProps, "onPress"> & {
  onPress: (event: GestureResponderEvent) => void;
};

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
    }, 0);
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    />
  );
}
