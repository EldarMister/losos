import {
  shouldActivateSheetDrag,
  shouldDismissSheet,
} from "../components/SwipeDismiss";

describe("swipe-to-dismiss thresholds", () => {
  test("dismisses only after the panel is pulled well below a light swipe", () => {
    expect(shouldDismissSheet(111, 0)).toBe(true);
    expect(shouldDismissSheet(110, 0)).toBe(false);
  });

  test("a fast short downward swipe closes at 800 dp/s", () => {
    expect(shouldDismissSheet(12, 800)).toBe(true);
    expect(shouldDismissSheet(12, 799)).toBe(false);
  });

  test("accepts per-sheet dismissal thresholds", () => {
    expect(shouldDismissSheet(72, 0, 72, 1_100)).toBe(false);
    expect(shouldDismissSheet(73, 0, 72, 1_100)).toBe(true);
    expect(shouldDismissSheet(1, 1_100, 72, 1_100)).toBe(true);
  });

  test("never dismisses for upward velocity or translation", () => {
    expect(shouldDismissSheet(-300, -1_200)).toBe(false);
  });

  test("activates only for a downward drag while the list is at the top", () => {
    expect(shouldActivateSheetDrag(1, 12, 0)).toBe(true);
    expect(shouldActivateSheetDrag(1, 12, 24)).toBe(false);
    expect(shouldActivateSheetDrag(12, 9, 0)).toBe(false);
    expect(shouldActivateSheetDrag(1, -12, 0)).toBe(false);
  });
});
