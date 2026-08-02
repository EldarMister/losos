import {
  shouldActivateDrawerDrag,
  shouldDismissDrawer,
} from "../components/DrawerGesture";

describe("left drawer gesture", () => {
  test("activates only for a predominantly leftward drag", () => {
    expect(shouldActivateDrawerDrag(-12, 1)).toBe(true);
    expect(shouldActivateDrawerDrag(12, 1)).toBe(false);
    expect(shouldActivateDrawerDrag(-9, 12)).toBe(false);
    expect(shouldActivateDrawerDrag(-7, 0)).toBe(false);
  });

  test("closes after a quarter of the drawer width", () => {
    expect(shouldDismissDrawer(-91, 360, 0)).toBe(true);
    expect(shouldDismissDrawer(-89, 360, 0)).toBe(false);
  });

  test("closes a short fast swipe and restores a short slow swipe", () => {
    expect(shouldDismissDrawer(-30, 360, -901)).toBe(true);
    expect(shouldDismissDrawer(-30, 360, -899)).toBe(false);
  });
});
