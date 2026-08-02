import { fireEvent, render } from "@testing-library/react-native";
import { QuantityControl } from "../components/QuantityControl";

describe("QuantityControl", () => {
  it("updates on press-in and does not repeat the action on press", async () => {
    const onChange = jest.fn();
    const screen = await render(<QuantityControl onChange={onChange} value={1} />);
    const increase = screen.getByLabelText("Увеличить количество");

    await fireEvent(increase, "pressIn");
    await fireEvent(increase, "pressOut");
    await fireEvent.press(increase);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByLabelText("Количество: 2")).toBeTruthy();
  });

  it("keeps rapid optimistic changes instead of waiting for the parent", async () => {
    const onChange = jest.fn();
    const screen = await render(<QuantityControl onChange={onChange} value={1} />);
    const increase = screen.getByLabelText("Увеличить количество");

    await fireEvent(increase, "pressIn");
    await fireEvent(increase, "pressIn");
    await fireEvent(increase, "pressIn");

    expect(onChange.mock.calls.map(([value]) => value)).toEqual([2, 3, 4]);
    expect(screen.getByLabelText("Количество: 4")).toBeTruthy();
  });
});
