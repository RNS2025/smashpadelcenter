import api from "../api/api";
import { DaoGroupUser } from "../types/daoGroupAllUsers";
import { User } from "../types/user";

const getAllUsers = async (): Promise<DaoGroupUser[]> => {
  try {
    const response = await api.get("/user-profiles");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

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
  getAllUsers,
  getOrCreateUserProfile,
  updateUserProfile,
};
