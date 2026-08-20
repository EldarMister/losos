import { fireEvent, render } from "@testing-library/react-native";
import { NotificationPermissionPrompt } from "../components/NotificationPermissionPrompt";

describe("NotificationPermissionPrompt", () => {
  test("shows the pre-permission explanation before the system request", async () => {
    const onAllow = jest.fn();
    const onDeny = jest.fn();
    const screen = await render(
      <NotificationPermissionPrompt
        onAllow={onAllow}
        onDeny={onDeny}
        visible
      />,
    );

    expect(screen.getByText(/запрашивает разрешение на отправку уведомлений/)).toBeTruthy();
    expect(screen.getByText(/статусе заказов и заявок на вывод наград/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Разрешить уведомления"));
    expect(onAllow).toHaveBeenCalledTimes(1);
    expect(onDeny).not.toHaveBeenCalled();
  });
});
