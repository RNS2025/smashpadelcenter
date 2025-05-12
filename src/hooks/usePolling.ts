import { useEffect, useRef, useState } from "react";

interface UsePollingOptions<T> {
  interval?: number;
  enabled?: boolean;
  shouldUpdate?: (newData: T, prevData: T | null) => boolean;
}

const usePolling = <T>(
  fetchFn: () => Promise<T>,
  callback: (data: T) => void,
  {
    interval = 5000,
    enabled = true,
    shouldUpdate = () => true,
  }: UsePollingOptions<T> = {}
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const lastPollTime = useRef<number>(0);
  const prevData = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true
  );

  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsVisible(visible);
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

  // Polling logic
  useEffect(() => {
    if (!enabled || !isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      const now = Date.now();
      if (now - lastPollTime.current < interval) {
        return;
      }

      try {
        const data = await fetchFn();
        lastPollTime.current = now;

        if (isMounted.current && shouldUpdate(data, prevData.current)) {
          prevData.current = data;
          callback(data);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    poll(); // Immediate poll on mount or visibility change
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchFn, callback, interval, enabled, isVisible, shouldUpdate]);
};

export default usePolling;
