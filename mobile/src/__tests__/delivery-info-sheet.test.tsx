import { fireEvent, render } from "@testing-library/react-native";
import { DeliveryInfoSheet } from "../components/DeliveryInfoSheet";
import { useStore } from "../store";

const mockSheetProps = jest.fn();
const mockScrollProps = jest.fn();

jest.mock("../store", () => ({
  useStore: jest.fn(),
}));

jest.mock("../components/BottomSheet", () => ({
  BottomSheet: ({ children, footer, ...props }: {
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) => {
    const { View } = require("react-native");
    mockSheetProps(props);
    return <View>{children}{footer}</View>;
  },
}));

jest.mock("../components/SwipeDismiss", () => ({
  SwipeDismissScrollView: ({ children, ...props }: {
    children: React.ReactNode;
  }) => {
    const { ScrollView } = require("react-native");
    mockScrollProps(props);
    return <ScrollView>{children}</ScrollView>;
  },
}));

jest.mock("../components/PrimaryButton", () => ({
  PrimaryButton: ({ label, onPress }: { label: string; onPress: () => void }) => {
    const { Pressable, Text } = require("react-native");
    return (
      <Pressable accessibilityLabel={label} onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    );
  },
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

describe("DeliveryInfoSheet", () => {
  beforeEach(() => {
    mockSheetProps.mockClear();
    mockScrollProps.mockClear();
    (useStore as jest.Mock).mockReturnValue({
      activeRegion: {
        id: 1,
        slug: "bishkek",
        name: "Бишкек",
        deliveryFee: 99,
        freeDeliveryThreshold: 4_900,
        estimatedDeliveryMinutes: 50,
        minimumOrderAmount: 900,
        maximumOrderAmount: 30_000,
        deliveryIs24Hours: true,
      },
      cartTotal: 0,
      deliveryType: "delivery",
      location: { address: "переулок Токолдош, 61" },
    });
  });

  test("keeps the close action in the fixed footer while details can scroll", async () => {
    const onClose = jest.fn();
    const screen = await render(<DeliveryInfoSheet visible onClose={onClose} />);

    expect(mockSheetProps).toHaveBeenCalledWith(expect.objectContaining({
      height: "60%",
    }));
    expect(mockScrollProps).toHaveBeenCalledWith(expect.objectContaining({
      showsVerticalScrollIndicator: false,
    }));

    fireEvent.press(screen.getByLabelText("Понятно"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
