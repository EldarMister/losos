export const colors = {
  orange: "#FF4D00",
  orangeDark: "#E94100",
  orangeSoft: "#FFF0E9",
  lilac: "#C471F5",
  ink: "#111111",
  muted: "#858585",
  border: "#E8E8E8",
  surface: "#F5F5F3",
  white: "#FFFFFF",
  success: "#168A4B",
  danger: "#D93838",
} as const;

export const radii = {
  small: 12,
  medium: 18,
  large: 26,
  sheet: 30,
  pill: 999,
} as const;

export const spacing = {
  xsmall: 6,
  small: 10,
  medium: 16,
  large: 22,
  xlarge: 30,
} as const;

export const shadow = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 22,
  elevation: 9,
} as const;
