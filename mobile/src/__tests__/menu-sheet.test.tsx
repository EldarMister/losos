import { fireEvent, render } from "@testing-library/react-native";
import { MenuSheet } from "../components/MenuSheet";
import { useStore } from "../store";

jest.mock("../api", () => ({
  WEB_URL: "https://naktasushi.com",
  authApi: {
    profile: jest.fn().mockResolvedValue({ naktaCoins: 1250 }),
  },
}));

jest.mock("../store", () => ({
  useStore: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 48, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

function props() {
  return {
    visible: true,
    onClose: jest.fn(),
    onOpenProfile: jest.fn(),
    onOpenOrders: jest.fn(),
    onOpenBalance: jest.fn(),
    onLogout: jest.fn(),
  };
}

describe("MenuSheet account states", () => {
  test("shows the four-item logged-out menu from the reference", async () => {
    (useStore as jest.Mock).mockReturnValue({ session: null });
    const callbacks = props();
    const screen = await render(<MenuSheet {...callbacks} />);

    expect(screen.getByText("Вход в личный кабинет")).toBeTruthy();
    expect(screen.getByText("Поддержка")).toBeTruthy();
    expect(screen.getByText("О нас")).toBeTruthy();
    expect(screen.queryByText("Хочу в команду")).toBeNull();

    await fireEvent.press(screen.getByLabelText("Закрыть меню"));
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  test("shows account, orders, addresses, balance and settings after login", async () => {
    (useStore as jest.Mock).mockReturnValue({
      session: { phone: "+996555123456" },
    });
    const callbacks = props();
    const screen = await render(<MenuSheet {...callbacks} />);

    expect(screen.getByText("+996555123456")).toBeTruthy();
    expect(await screen.findByText("1 250")).toBeTruthy();
    await fireEvent.press(screen.getByText("+996555123456"));
    expect(callbacks.onOpenProfile).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Мои заказы"));
    await fireEvent.press(screen.getByText("NAKTA Coin"));

    expect(callbacks.onOpenOrders).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Мои адреса")).toBeNull();
    expect(callbacks.onOpenBalance).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Настройки")).toBeTruthy();
  });
});
