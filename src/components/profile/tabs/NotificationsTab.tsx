import React from "react";

interface Notification {
  notificationId: string;
  title: string;
  body: string;
  category: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsTabProps {
  notifications: Notification[];
  notificationLoading: boolean;
  handleMarkAsRead: (notificationId: string) => void;
  successMessage: string;
  errorMessage: string;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  notificationLoading,
  handleMarkAsRead,
  successMessage,
  errorMessage,
}) => {
  return (
    <div>
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg">
          <p className="text-sm">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Notifikationer</h2>
      <p className="text-gray-600 mb-4">
        Se dine notifikationer her. Klik på en notifikation for at markere den
        som læst.
      </p>
      {notificationLoading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-700">Indlæser notifikationer...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.notificationId}
              className={`bg-gray-50 rounded-lg p-4 border ${
                notification.isRead ? "border-gray-200" : "border-cyan-500"
              } cursor-pointer`}
              onClick={() => handleMarkAsRead(notification.notificationId)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p
                    className={`text-sm font-medium ${
                      notification.isRead ? "text-gray-600" : "text-gray-800"
                    }`}
                  >
                    {notification.title}
                  </p>
                  <p
                    className={`text-sm ${
                      notification.isRead ? "text-gray-500" : "text-gray-700"
                    }`}
                  >
                    {notification.body}
                  </p>
                  {notification.category && (
                    <p className="text-xs text-gray-500 mt-1">
                      Kategori: {notification.category}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs ${
                    notification.isRead ? "text-gray-500" : "text-cyan-500"
                  }`}
                >
                  {new Date(notification.createdAt).toLocaleDateString("da-DK")}{" "}
                  {new Date(notification.createdAt).toLocaleTimeString(
                    "da-DK",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Ingen notifikationer at vise.</p>
      )}
    </div>
  );
};

export default NotificationsTab;
