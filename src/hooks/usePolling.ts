import { useEffect, useRef, useState } from "react";

interface UsePollingOptions {
  interval?: number; // Polling interval in milliseconds
  enabled?: boolean; // Whether polling is enabled
}

const usePolling = <T>(
  fetchFn: () => Promise<T>,
  callback: (data: T) => void,
  { interval = 5000, enabled = true }: UsePollingOptions = {}
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true
  );

  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start polling
  useEffect(() => {
    // Only poll if both enabled and page is visible
    if (!enabled || !isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const data = await fetchFn();
        if (isMounted.current) {
          callback(data);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Execute immediately on mount or when visibility changes
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    // Cleanup interval on unmount or when enabled/isVisible changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchFn, callback, interval, enabled, isVisible]);
};

export default usePolling;
