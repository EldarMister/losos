import { render } from "@testing-library/react-native";
import { CaptchaVerification } from "../components/CaptchaVerification";

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 48, right: 0, bottom: 0, left: 0 }),
}));

test("loads Turnstile from the public HTTPS page with WebView storage enabled", async () => {
  const onVerified = jest.fn();
  const screen = await render(
    <CaptchaVerification
      onCancel={jest.fn()}
      onError={jest.fn()}
      onVerified={onVerified}
      visible
    />,
  );

  const webView = screen.getByLabelText("Проверка, что вы человек");
  expect(webView.props.source).toEqual({ uri: "https://naktasushi.com/mobile-captcha" });
  expect(webView.props.domStorageEnabled).toBe(true);
  expect(webView.props.thirdPartyCookiesEnabled).toBe(true);
  expect(webView.props.sharedCookiesEnabled).toBe(true);

  webView.props.onMessage({
    nativeEvent: { data: JSON.stringify({ type: "success", token: "turnstile-token" }) },
  });
  expect(onVerified).toHaveBeenCalledWith("turnstile-token");
});
