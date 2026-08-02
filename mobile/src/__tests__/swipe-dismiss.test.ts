import {
  shouldActivateSheetDrag,
  shouldDismissSheet,
} from "../components/SwipeDismiss";

describe("swipe-to-dismiss thresholds", () => {
  test("dismisses after a quarter of the panel height", () => {
    expect(shouldDismissSheet(201, 800, 0)).toBe(true);
    expect(shouldDismissSheet(199, 800, 0)).toBe(false);
  });

  test("dismisses a short but fast downward swipe", () => {
    expect(shouldDismissSheet(40, 800, 901)).toBe(true);
    expect(shouldDismissSheet(40, 800, 899)).toBe(false);
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
