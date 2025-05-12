import { User } from "./user";

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  refreshUser: (forceRefresh?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export default UserContextType;
