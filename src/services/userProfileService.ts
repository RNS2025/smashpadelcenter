import api from "../api/api";
import { User } from "../types/user";

const getOrCreateUserProfile = async (username: string): Promise<User> => {
  try {
    const response = await api.get(`/user-profiles/by-username/${username}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

const updateUserProfile = async (
  username: string,
  updates: Partial<User>
): Promise<User> => {
  try {
    const response = await api.put(
      `/user-profiles/by-username/${username}`,
      updates
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export default {
  getOrCreateUserProfile,
  updateUserProfile,
};
