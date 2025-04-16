interface UserContextType {
  role: string | null;
  error: string | null;
  fetchRole: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  username: string | null;
  loading: boolean;
}

export default UserContextType;
