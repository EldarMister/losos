import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export const ORDER_LIVE_REFRESH_INTERVAL_MS = 4_000;
export type OrderRefreshSource = "poll" | "app-state" | "notification";

export function useOrderLiveRefresh(
  refresh: (source: OrderRefreshSource) => void | Promise<void>,
  enabled = true,
) {
  const refreshRef = useRef(refresh);
  const refreshInFlight = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return undefined;
    const refreshNow = (source: OrderRefreshSource) => {
      if (refreshInFlight.current) return;
      refreshInFlight.current = true;
      void Promise.resolve(refreshRef.current(source)).finally(() => {
        refreshInFlight.current = false;
      });
    };
    const timer = setInterval(() => {
      if (AppState.currentState === "active") refreshNow("poll");
    }, ORDER_LIVE_REFRESH_INTERVAL_MS);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshNow("app-state");
    });
    const notificationSubscription = Notifications.addNotificationReceivedListener(() => {
      refreshNow("notification");
    });

    return () => {
      clearInterval(timer);
      appStateSubscription.remove();
      notificationSubscription.remove();
      refreshInFlight.current = false;
    };
  }, [enabled]);
}
