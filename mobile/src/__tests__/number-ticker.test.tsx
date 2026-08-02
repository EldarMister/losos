import { act, render } from "@testing-library/react-native";
import { AccessibilityInfo, StyleSheet } from "react-native";
import { getAnimatedStyle } from "react-native-reanimated";
import { formatMoney, formatNumber } from "../money";
import { NumberTicker } from "../components/NumberTicker";

describe("NumberTicker", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("uses the app money formatter by default", async () => {
    const screen = await render(<NumberTicker value={1250} />);

    expect(screen.getByLabelText("1 250 сом")).toBeTruthy();
  });

  it("keeps the formatted result accessible after a digit update", async () => {
    const screen = await render(<NumberTicker format={formatMoney} value={999} />);

    const unitsReel = screen.getByTestId("number-ticker-digit-0");
    const tensReel = screen.getByTestId("number-ticker-digit-1");
    const hundredsReel = screen.getByTestId("number-ticker-digit-2");

    await screen.rerender(<NumberTicker format={formatMoney} value={1000} />);

    expect(screen.getByLabelText("1 000 сом")).toBeTruthy();
    expect(screen.getByTestId("number-ticker-digit-0")).toBe(unitsReel);
    expect(screen.getByTestId("number-ticker-digit-1")).toBe(tensReel);
    expect(screen.getByTestId("number-ticker-digit-2")).toBe(hundredsReel);
    expect(screen.getByTestId("number-ticker-digit-3")).toBeTruthy();
  });

  it("can animate non-monetary counters with an explicit formatter", async () => {
    const screen = await render(<NumberTicker format={formatNumber} value={3} />);

    expect(screen.getByLabelText("3")).toBeTruthy();
  });

  it("keeps adjacent digits compact and aligns suffixes to the reel", async () => {
    const screen = await render(
      <NumberTicker format={formatMoney} height={20} style={{ fontSize: 16 }} value={90} />,
    );

    const reel = screen.getByTestId("number-ticker-digit-0");
    expect(StyleSheet.flatten(reel.parent?.props.style)).toMatchObject({
      height: 20,
      width: 10,
    });
    const suffix = screen.getByTestId("number-ticker-character-3");
    expect(StyleSheet.flatten(suffix.props.style)).toMatchObject({
      height: 20,
      lineHeight: 20,
    });
  });

  it("keeps a digit reel mounted and moves it between values", async () => {
    jest.useFakeTimers();
    const screen = await render(
      <NumberTicker duration={600} format={formatNumber} height={20} value={9} />,
    );
    const initialReel = screen.getByTestId("number-ticker-digit-0");
    expect(getAnimatedStyle(initialReel).transform).toEqual([{ translateY: -180 }]);

    await screen.rerender(
      <NumberTicker duration={600} format={formatNumber} height={20} value={0} />,
    );
    await act(async () => jest.advanceTimersByTime(300));

    const animatedStyle = getAnimatedStyle(
      screen.getByTestId("number-ticker-digit-0"),
    ) as { transform?: Array<{ translateY?: number }> };
    const animatedTranslateY = animatedStyle.transform?.[0]?.translateY;
    expect(animatedTranslateY).toBeGreaterThan(-180);
    expect(animatedTranslateY).toBeLessThan(0);
  });

  it("restarts from the current position during rapid updates", async () => {
    jest.useFakeTimers();
    const screen = await render(
      <NumberTicker duration={600} format={formatNumber} height={20} value={1} />,
    );

    await screen.rerender(
      <NumberTicker duration={600} format={formatNumber} height={20} value={8} />,
    );
    await act(async () => jest.advanceTimersByTime(100));
    await screen.rerender(
      <NumberTicker duration={600} format={formatNumber} height={20} value={2} />,
    );
    await act(async () => jest.advanceTimersByTime(600));

    expect(getAnimatedStyle(screen.getByTestId("number-ticker-digit-0")).transform)
      .toEqual([{ translateY: -40 }]);
  });

  it("moves directly to the new value when Reduce Motion is enabled", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const screen = await render(
      <NumberTicker duration={600} format={formatNumber} height={20} value={9} />,
    );
    await act(async () => {
      await Promise.resolve();
    });

    await screen.rerender(
      <NumberTicker duration={600} format={formatNumber} height={20} value={4} />,
    );

    expect(getAnimatedStyle(screen.getByTestId("number-ticker-digit-0")).transform)
      .toEqual([{ translateY: -80 }]);
  });
});
