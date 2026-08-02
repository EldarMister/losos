export type DeliveryZonePoint = {
  latitude: number;
  longitude: number;
};

export function isPointInDeliveryZone(
  latitude: number,
  longitude: number,
  zone: DeliveryZonePoint[],
) {
  if (zone.length < 3) return true;
  let inside = false;
  for (let index = 0, previous = zone.length - 1; index < zone.length; previous = index, index += 1) {
    const currentPoint = zone[index];
    const previousPoint = zone[previous];
    const intersects = ((currentPoint.latitude > latitude) !== (previousPoint.latitude > latitude))
      && longitude < ((previousPoint.longitude - currentPoint.longitude) * (latitude - currentPoint.latitude))
        / (previousPoint.latitude - currentPoint.latitude) + currentPoint.longitude;
    if (intersects) inside = !inside;
  }
  return inside;
}
