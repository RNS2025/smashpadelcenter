import api from "../api/api";

const getUserNotifications = async (userId: any) => {
  try {
    const response = await api.get(`/notifications/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

const markNotificationAsRead = async (notificationId: any) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export default {
  getUserNotifications,
  markNotificationAsRead,
};
