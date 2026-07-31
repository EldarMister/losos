import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { authApi } from "../api";
import { AuthScreen } from "../screens/AuthScreen";
import { useStore } from "../store";

jest.mock("../api", () => ({
  WEB_URL: "https://naktasushi.com",
  authApi: {
    methods: jest.fn().mockResolvedValue({ sms: true, whatsapp: false }),
    requestCode: jest.fn(),
    verifyCode: jest.fn(),
    requestWhatsapp: jest.fn(),
    whatsappStatus: jest.fn(),
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

describe("AuthScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as jest.Mock).mockReturnValue({
      signIn: jest.fn().mockResolvedValue(undefined),
    });
  });

  test("does not open the keyboard until the phone field is pressed and requests an SMS code", async () => {
    (authApi.requestCode as jest.Mock).mockResolvedValue({
      verified: false,
      retryAfterSeconds: 60,
    });
    const screen = await render(
      <AuthScreen onBack={jest.fn()} onSuccess={jest.fn()} />,
    );

    const phone = screen.getByPlaceholderText("+996 555 123 456");
    expect(phone.props.autoFocus).toBeUndefined();

    await fireEvent.changeText(phone, "+996 555 123 456");
    await fireEvent.press(screen.getByLabelText("Отправить код"));

    await waitFor(() => {
      expect(authApi.requestCode).toHaveBeenCalledWith("+996555123456");
      expect(screen.getByText("Введите код")).toBeTruthy();
    });
  });
});
