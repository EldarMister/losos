import {
  shouldActivateSheetDrag,
  shouldDismissSheet,
} from "../components/SwipeDismiss";

describe("swipe-to-dismiss thresholds", () => {
  test("dismisses only after the panel is pulled well below a light swipe", () => {
    expect(shouldDismissSheet(337, 800, 0)).toBe(true);
    expect(shouldDismissSheet(335, 800, 0)).toBe(false);
  });

  test("requires meaningful distance even for a fast downward swipe", () => {
    expect(shouldDismissSheet(113, 800, 1_501)).toBe(true);
    expect(shouldDismissSheet(111, 800, 2_000)).toBe(false);
    expect(shouldDismissSheet(113, 800, 1_499)).toBe(false);
  });

  test("never dismisses for upward velocity or translation", () => {
    expect(shouldDismissSheet(-300, 800, -1_200)).toBe(false);
  });

  test("activates only for a downward drag while the list is at the top", () => {
    expect(shouldActivateSheetDrag(1, 12, 0)).toBe(true);
    expect(shouldActivateSheetDrag(1, 12, 24)).toBe(false);
    expect(shouldActivateSheetDrag(12, 9, 0)).toBe(false);
    expect(shouldActivateSheetDrag(1, -12, 0)).toBe(false);
  });
});
