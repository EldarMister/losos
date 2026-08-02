import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { useStore } from "../store";

jest.mock("../store", () => ({
  useStore: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 24, left: 0 }),
}));

const mockRequestOrderNotificationPermission = jest.fn(() => Promise.resolve({
  granted: true,
  status: "granted",
}));

jest.mock("../pushNotifications", () => ({
  requestOrderNotificationPermission: () => mockRequestOrderNotificationPermission(),
}));

const setOnboarded = jest.fn();
const setNotificationsAsked = jest.fn();

function activeProgress(screen: Awaited<ReturnType<typeof render>>) {
  return Array.from({ length: 4 }, (_, index) => {
    const node = screen.getByTestId(`onboarding-progress-${index + 1}`);
    return StyleSheet.flatten(node.props.style).backgroundColor === "#FFFFFF";
  });
}

describe("OnboardingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as jest.Mock).mockReturnValue({
      setOnboarded,
      setNotificationsAsked,
    });
  });

  test("shows all four reference pages in the required order", async () => {
    const onComplete = jest.fn();
    const onLogin = jest.fn();
    const screen = await render(
      <OnboardingScreen onComplete={onComplete} onLogin={onLogin} />,
    );

    const firstTitle = screen.getByText("Много вкусного\nв одном месте");
    expect(firstTitle).toBeTruthy();
    expect(firstTitle.props.numberOfLines).toBe(2);
    expect(firstTitle.props.adjustsFontSizeToFit).toBe(true);
    expect(screen.getByLabelText("Пакет с блюдами Накта суши").props.source)
      .toBe(require("../../assets/pickup.png"));
    expect(activeProgress(screen)).toEqual([true, false, false, false]);

    await fireEvent.press(screen.getByText("Далее"));
    const secondTitle = screen.getByText("Качественно\nи вкусно");
    expect(secondTitle).toBeTruthy();
    expect(secondTitle.props.numberOfLines).toBe(2);
    expect(screen.getByLabelText("Иконка приложения NAKTASUSHI").props.source)
      .toBe(require("../../assets/app-icon.png"));
    expect(activeProgress(screen)).toEqual([true, true, false, false]);

    await fireEvent.press(screen.getByText("Далее"));
    const notificationTitle = screen.getByText("Пришлём пуш\nо статусе заказа");
    expect(notificationTitle).toBeTruthy();
    expect(notificationTitle.props.numberOfLines).toBe(2);
    expect(screen.getByLabelText("Термосумка Накта суши").props.source)
      .toBe(require("../../assets/delivery.png"));
    expect(activeProgress(screen)).toEqual([true, true, true, false]);
    expect(screen.getByText("Включить пуш-уведомления")).toBeTruthy();

    await fireEvent.press(screen.getByText("Далее"));
    expect(screen.getByLabelText("Сердце из лосося").props.source)
      .toBe(require("../../assets/heart.png"));
    expect(screen.getByText("Выбрать адрес доставки")).toBeTruthy();
    expect(screen.getByText("Войти")).toBeTruthy();
    expect(activeProgress(screen)).toEqual([true, true, true, true]);

    await fireEvent.press(screen.getByText("Выбрать адрес доставки"));
    expect(setOnboarded).toHaveBeenCalledWith(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onLogin).not.toHaveBeenCalled();
  });

  test("opens the system notification request and keeps the next step explicit", async () => {
    const onComplete = jest.fn();
    const onLogin = jest.fn();
    const screen = await render(
      <OnboardingScreen onComplete={onComplete} onLogin={onLogin} />,
    );
    await fireEvent.press(screen.getByText("Далее"));
    await fireEvent.press(screen.getByText("Далее"));

    await fireEvent.press(screen.getByText("Включить пуш-уведомления"));

    expect(mockRequestOrderNotificationPermission).toHaveBeenCalledTimes(1);
    expect(setNotificationsAsked).toHaveBeenCalledWith(true);
    expect(screen.getByText("Пришлём пуш\nо статусе заказа")).toBeTruthy();

    await fireEvent.press(screen.getByText("Далее"));
    expect(screen.getByText("Выбрать адрес доставки")).toBeTruthy();
    expect(setOnboarded).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText("Войти"));
    expect(setOnboarded).toHaveBeenCalledWith(true);
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});
