import { render } from "@testing-library/react-native";
import { NaktaCoinBadge } from "../components/NaktaCoinBadge";
import { supportUrl } from "../support";

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

describe("admin-controlled contacts and NAKTA Coin badges", () => {
  test("uses the configured support link before the phone", () => {
    expect(supportUrl({
      id: 1,
      slug: "osh",
      name: "Ош",
      supportUrl: "https://t.me/nakta_support",
      supportPhone: "+996 (700) 123-456",
    })).toBe("https://t.me/nakta_support");
  });

  test("uses the active region support phone", () => {
    expect(supportUrl({
      id: 1,
      slug: "osh",
      name: "Ош",
      contactPhone: "+996 (700) 123-456",
    })).toBe("tel:+996700123456");
  });

  test("shows a badge only for a positive admin-configured reward", async () => {
    const visible = await render(<NaktaCoinBadge amount={4} />);
    expect(visible.getByLabelText("Начислим 4 NAKTA Coin")).toBeTruthy();
    expect(visible.getByText("+4")).toBeTruthy();

    const hidden = await render(<NaktaCoinBadge amount={0} />);
    expect(hidden.toJSON()).toBeNull();
  });
});
