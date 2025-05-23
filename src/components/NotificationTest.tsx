// components/NotificationTest.tsx
import React, { useState, useEffect } from "react";
import { notificationService } from "../services/notificationsService";
import { useNotifications } from "../context/NotificationProvider";
import { useUser } from "../context/UserContext";

const NotificationTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { isConnected, unreadCount } = useNotifications();
  const { user } = useUser();

  useEffect(() => {
    if (isConnected) {
      setMessage("✅ Successfully connected to notification service!");
    }
  }, [isConnected]);

  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      await notificationService.sendTestNotification();
      setMessage("✅ Test notification sent successfully!");
    } catch (error) {
      console.error("Test notification failed:", error);
      setMessage(
        `❌ Failed to send test notification: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleCustomNotification = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      if (!user?.username) {
        setMessage("❌ User not found");
        return;
      }

      await notificationService.sendNotification({
        username: user.username,
        title: "🎾 Tournament Reminder",
        message:
          'Your tournament "Smash Padel Championship" starts in 30 minutes!',
        type: "info",
        route: "/tournaments",
        data: {
          tournamentId: "test-123",
          type: "tournament-reminder",
        },
      });

      setMessage("✅ Custom tournament notification sent!");
    } catch (error) {
      console.error("Custom notification failed:", error);
      setMessage(
        `❌ Failed to send custom notification: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchNotification = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      if (!user?.username) {
        setMessage("❌ User not found");
        return;
      }

      // Current time
      const now = new Date();
      // Match time (30 minutes from now)
      const matchTime = new Date(now.getTime() + 30 * 60 * 1000);
      const formattedTime = matchTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      await notificationService.sendNotification({
        username: user.username,
        title: "⏰ Kamp påmindelse",
        message: `Din kamp starter om 30 minutter! Kl. ${formattedTime} på bane 4 mod Anders Jensen & Maria Nielsen`,
        type: "warning", // Higher priority for match notifications
        route: `/tournament/player/${user.id || "123"}`,
        data: {
          matchId: "match-123",
          matchTime: matchTime.toISOString(),
          court: "Bane 4",
          opponents: [{ Name: "Anders Jensen" }, { Name: "Maria Nielsen" }],
        },
      });

      setMessage("✅ Match reminder notification sent!");
    } catch (error) {
      console.error("Match notification failed:", error);
      setMessage(
        `❌ Failed to send match notification: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushNotificationTest = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      // Request notification permission if not granted
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setMessage("❌ Notification permission denied");
          return;
        }
      }

      // Send a local browser notification (this tests the browser's ability to show notifications)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🎾 Test Push Notification", {
          body: "This is a test push notification from Smash Padel Center!",
          icon: "/icons/ikon_192.png",
          tag: "test-notification",
        });
        setMessage("✅ Local push notification displayed!");
      } else {
        setMessage("❌ Push notifications not supported or permission denied");
      }
    } catch (error) {
      console.error("Push notification test failed:", error);
      setMessage(
        `❌ Push notification test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatus = async () => {
    try {
      const status = await notificationService.getStatus();
      setMessage(
        `📊 Status: ${status.activeSubscribers} active subscribers, User online: ${status.isUserOnline}`
      );
    } catch (error) {
      setMessage(
        `❌ Failed to get status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 max-w-md">
      <h3 className="text-xl font-bold text-brand-primary mb-4">
        🔔 Notification Test Panel
      </h3>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Connection Status:</span>
          <span
            className={`font-semibold ${
              isConnected ? "text-green-400" : "text-red-400"
            }`}
          >
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Unread Notifications:</span>
          <span className="font-semibold text-brand-primary">
            {unreadCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Current User:</span>
          <span className="font-semibold text-slate-200">
            {user?.username || "Not logged in"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleTestNotification}
          disabled={isLoading || !user}
          className="w-full px-4 py-2 bg-brand-primary text-slate-900 font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "⏳ Sending..." : "📤 Send Test Notification"}
        </button>{" "}
        <button
          onClick={handleCustomNotification}
          disabled={isLoading || !user}
          className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "⏳ Sending..." : "🎾 Send Tournament Notification"}
        </button>
        <button
          onClick={handleMatchNotification}
          disabled={isLoading || !user}
          className="w-full px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "⏳ Sending..." : "⏰ Send Match Reminder"}
        </button>
        <button
          onClick={handlePushNotificationTest}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "⏳ Testing..." : "🔔 Test Push Notification"}
        </button>
        <button
          onClick={getConnectionStatus}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-slate-600 text-slate-200 font-semibold rounded-lg hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          📊 Check Status
        </button>
      </div>

      {message && (
        <div className="mt-4 p-3 bg-slate-700 rounded border-l-4 border-brand-primary">
          <p className="text-sm text-slate-200">{message}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationTest;
