import {
  Pressable as NativePressable,
  type PressableProps,
} from "react-native";

const DEFAULT_RIPPLE_COLOR = "rgba(44,44,44,0.16)";

type Props = PressableProps & {
  rippleColor?: string;
  rippleDisabled?: boolean;
};

export function RipplePressable({
  android_ripple,
  rippleColor = DEFAULT_RIPPLE_COLOR,
  rippleDisabled,
  ...props
}: Props) {
  return (
    <NativePressable
      {...props}
      android_ripple={rippleDisabled
        ? undefined
        : (android_ripple ?? {
            borderless: false,
            color: rippleColor,
            foreground: true,
          })}
    />
  );
}
