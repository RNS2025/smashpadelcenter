import { useEffect, useRef } from "react";

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
    if (!enabled) return;

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

    // Execute immediately on mount
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    // Cleanup interval on unmount or when enabled changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchFn, callback, interval, enabled]);
};

export default usePolling;
