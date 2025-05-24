// components/PushNotificationSetup.tsx
import { useEffect, useCallback, useState } from "react";
import { notificationService } from "../services/notificationsService";

interface PushNotificationSetupProps {
  isPrimaryPage?: boolean;
}

/**
 * Component to handle push notification setup and permission prompting
 * - When embedded in a primary page (like home), it shows a UI prompt if needed
 * - Otherwise it works silently in the background
 */
const PushNotificationSetup: React.FC<PushNotificationSetupProps> = ({
  isPrimaryPage = false,
}) => {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission | null>(null);

  const setupPushNotifications = useCallback(
    async (userInitiated = false) => {
      try {
        // Check if we can even use notifications
        if (!("Notification" in window)) {
          console.log("This browser doesn't support notifications");
          return;
        }

        // Check current permission status
        const permissionState = Notification.permission;
        setPermissionStatus(permissionState);

        // If permission is already granted, try to subscribe
        if (permissionState === "granted") {
          const isSubscribed =
            await notificationService.subscribeToPushNotifications();
          if (isSubscribed) {
            console.log("Successfully subscribed to push notifications");
            setShowPrompt(false);
          } else if (isPrimaryPage && userInitiated) {
            // If we couldn't subscribe despite having permission and user initiated
            setShowPrompt(true);
          }
        }
        // If permission is default (not decided yet) and this is direct user action
        // or if we're on a primary page, show the prompt
        else if (
          permissionState === "default" &&
          (userInitiated || isPrimaryPage)
        ) {
          setShowPrompt(true);
        }
      } catch (error) {
        console.error("Error checking push notification status:", error);
      }
    },
    [isPrimaryPage]
  );

  useEffect(() => {
    // On initial mount, check status but don't display UI prompts
    setupPushNotifications(false);
  }, [setupPushNotifications]);

  const handleEnableNotifications = useCallback(async () => {
    try {
      // Request permission
      const permission =
        await notificationService.requestNotificationPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        // Try to subscribe
        const subscribed =
          await notificationService.subscribeToPushNotifications();
        if (subscribed) {
          console.log("Successfully subscribed to push notifications");
          // Send a test notification to confirm it worked
          await notificationService.sendTestNotification();
        } else {
          console.warn("Failed to subscribe to push notifications");
        }
      }

      // Hide the prompt regardless of outcome
      setShowPrompt(false);
    } catch (error) {
      console.error("Error enabling push notifications:", error);
      setShowPrompt(false);
    }
  }, []);

  // Only render UI elements if this is on a primary page and we need to show the prompt
  if (!isPrimaryPage || !showPrompt) {
    return null;
  }

  return (
    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 mt-4 rounded shadow">
      <div className="flex items-center">
        <div className="flex-grow">
          <p className="font-bold">Aktivér push-notifikationer</p>
          <p className="text-sm">
            For at modtage meddelelser om turneringer og kampe, skal du aktivere
            push-notifikationer.
          </p>
        </div>
        <div>
          <button
            onClick={handleEnableNotifications}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            aria-label="Aktivér push-notifikationer"
          >
            Aktivér notifikationer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationSetup;

export default PushNotificationSetup;
