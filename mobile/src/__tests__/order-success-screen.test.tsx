import { render, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, Animated } from "react-native";
import { OrderSuccessScreen } from "../screens/OrderSuccessScreen";

const mockPlay = jest.fn();
let mockSoundLoaded = false;

jest.mock("expo-audio", () => ({
  useAudioPlayer: () => ({ play: mockPlay }),
  useAudioPlayerStatus: () => ({ isLoaded: mockSoundLoaded }),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 24, left: 0 }),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

const order = {
  id: "2001931f-order",
  orderNumber: 2001931,
  status: "new",
  total: 980,
} as const;

describe("OrderSuccessScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSoundLoaded = false;
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("shows only the final order information and keeps the catalog action available", async () => {
    const screen = await render(<OrderSuccessScreen onDone={jest.fn()} order={order} />);

    expect(screen.getByText("Заказ принят!")).toBeTruthy();
    expect(screen.getByText("Заказ № 2001931")).toBeTruthy();
    expect(screen.getByText("Вернуться в каталог")).toBeTruthy();
    expect(screen.queryByText(/Кухня уже получила заказ/i)).toBeNull();
    expect(screen.queryByText(/Администратор скоро проверит заказ/i)).toBeNull();
  });

  test("plays the success sound once after it is loaded and again after a fresh mount", async () => {
    const screen = await render(<OrderSuccessScreen onDone={jest.fn()} order={order} />);
    expect(mockPlay).not.toHaveBeenCalled();

    mockSoundLoaded = true;
    await screen.rerender(<OrderSuccessScreen onDone={jest.fn()} order={order} />);
    await waitFor(() => expect(mockPlay).toHaveBeenCalledTimes(1));

    await screen.rerender(<OrderSuccessScreen onDone={jest.fn()} order={order} />);
    expect(mockPlay).toHaveBeenCalledTimes(1);

    await screen.unmount();
    await render(<OrderSuccessScreen onDone={jest.fn()} order={order} />);
    await waitFor(() => expect(mockPlay).toHaveBeenCalledTimes(2));
  });

  test("skips motion when reduced motion is enabled", async () => {
    const timing = jest.spyOn(Animated, "timing");

    const screen = await render(<OrderSuccessScreen onDone={jest.fn()} order={order} />);
    await waitFor(() => {
      expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalledTimes(1);
    });

    expect(timing).not.toHaveBeenCalled();
    await screen.unmount();
  });
});
