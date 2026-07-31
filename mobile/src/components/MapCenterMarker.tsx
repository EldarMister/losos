import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

export function MapCenterMarker() {
  return (
    <View pointerEvents="none" style={styles.pin}>
      <View style={styles.circle}>
        <View style={styles.deliveryBadge}>
          <View style={styles.handle} />
          <View style={styles.badgeLineWide} />
          <View style={styles.badgeLineShort} />
        </View>
      </View>
      <View style={styles.stem} />
      <View style={styles.groundShadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    position: "absolute",
    zIndex: 8,
    left: "50%",
    top: "50%",
    width: 56,
    height: 80,
    marginLeft: -28,
    marginTop: -76,
    alignItems: "center",
  },
  circle: {
    zIndex: 2,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#160F0A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  deliveryBadge: {
    position: "relative",
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  handle: {
    position: "absolute",
    top: 3,
    left: 7,
    width: 8,
    height: 4,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#FFFFFF",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  badgeLineWide: {
    position: "absolute",
    top: 9,
    left: 4,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
  badgeLineShort: {
    position: "absolute",
    top: 14,
    left: 7,
    width: 11,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
  stem: {
    zIndex: 1,
    position: "absolute",
    top: 54,
    width: 3,
    height: 22,
    borderRadius: 3,
    backgroundColor: colors.orange,
  },
  groundShadow: {
    position: "absolute",
    zIndex: 0,
    top: 72,
    width: 22,
    height: 8,
    borderRadius: 10,
    backgroundColor: "rgba(22, 15, 10, 0.18)",
    shadowColor: "#160F0A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.24,
    shadowRadius: 4,
    elevation: 2,
  },
});
