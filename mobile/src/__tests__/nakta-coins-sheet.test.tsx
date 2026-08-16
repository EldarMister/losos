import { fireEvent, render } from "@testing-library/react-native";
import { NaktaCoinsSheet } from "../components/NaktaCoinsSheet";
import { authApi } from "../api";
import { useStore } from "../store";

jest.mock("../api", () => ({
  authApi: {
    profile: jest.fn(),
  },
}));

jest.mock("../store", () => ({
  useStore: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

jest.mock("../components/BottomSheet", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BottomSheet: ({ children, visible }: { children: React.ReactNode; visible: boolean }) => (
      visible ? React.createElement(View, null, children) : null
    ),
  };
});

describe("NaktaCoinsSheet", () => {
  test("shows compact balances and one shared explanation card", async () => {
    (useStore as jest.Mock).mockReturnValue({
      session: { phone: "+996555123456" },
    });
    (authApi.profile as jest.Mock).mockResolvedValue({
      naktaCoins: 78,
      nfts: [{ id: "nft-1" }, { id: "nft-2" }],
    });

    const onClose = jest.fn();
    const screen = await render(<NaktaCoinsSheet onClose={onClose} visible />);

    expect(await screen.findByLabelText("NAKTA Coin: 78")).toBeTruthy();
    expect(screen.getByLabelText("NFT: 2")).toBeTruthy();
    expect(screen.getByText("Как работают NAKTA Coin и NFT")).toBeTruthy();
    expect(screen.getByText(/не тратятся внутри приложения/)).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Понятно" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
