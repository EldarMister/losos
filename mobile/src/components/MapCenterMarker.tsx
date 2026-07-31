import { Image, StyleSheet, View } from "react-native";
import { colors } from "../theme";

const deliveryMarker = require("../../assets/delivery.png");

export function MapCenterMarker() {
  return (
    <View pointerEvents="none" style={styles.pin}>
      <View style={styles.circle}>
        <Image resizeMode="contain" source={deliveryMarker} style={styles.markerImage} />
      </View>
      <View style={styles.stem} />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    position: "absolute",
    zIndex: 8,
    left: "50%",
    top: "50%",
    width: 48,
    height: 66,
    marginLeft: -24,
    marginTop: -63,
    alignItems: "center",
  },
  circle: {
    zIndex: 2,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#160F0A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  markerImage: {
    width: 31,
    height: 31,
  },
  stem: {
    zIndex: 1,
    position: "absolute",
    top: 46,
    width: 3,
    height: 18,
    borderRadius: 3,
    backgroundColor: colors.orange,
  },
});
