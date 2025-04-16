import api from "../api/api";
import { UserProfile } from "../types/userProfile";

const getOrCreateUserProfile = async (
  username: string
): Promise<UserProfile> => {
  try {
    const response = await api.get(`/user-profiles/by-username/${username}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching or creating user profile:", error);
    throw error;
  }
};

const updateUserProfile = async (
  username: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
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
