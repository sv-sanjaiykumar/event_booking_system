import { useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "../../api/client.js";
import { fetchEvents } from "./eventApi.js";

const REFRESH_INTERVAL_MS = 15000;

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const requestInFlight = useRef(false);
  const hasLoaded = useRef(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (mounted.current) {
      if (hasLoaded.current) setIsRefreshing(true);
      else setIsLoading(true);
    }

    try {
      const nextEvents = await fetchEvents();
      if (!Array.isArray(nextEvents)) {
        throw new Error("The API returned an invalid event list.");
      }
      if (mounted.current) {
        setEvents(nextEvents);
        setError("");
        setLastUpdated(new Date());
        hasLoaded.current = true;
      }
    } catch (requestError) {
      if (mounted.current) {
        setError(
          getApiErrorMessage(requestError, "Events could not be loaded."),
        );
      }
    } finally {
      requestInFlight.current = false;
      if (mounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted.current = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);

  return {
    events,
    error,
    isLoading,
    isRefreshing,
    lastUpdated,
    refresh,
  };
}
