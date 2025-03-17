import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { getUsers, changeUserRole } from "../api/auth";
import User from "../types/user";
import HomeBar from "../components/HomeBar";
import { useUser } from "../context/UserContext"; // Import the context

export const AdminPage = () => {
  const { role, error } = useUser(); // Access role and error from context
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch {
        // The error handling is now centralized in the UserContext, so no need for `setError`
        console.error("Failed to fetch users");
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (username: string, newRole: string) => {
    try {
      await changeUserRole(username, newRole);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.username === username ? { ...user, role: newRole } : user
        )
      );
    } catch {
      console.error("Failed to change user role");
    }
  };

  if (role !== "admin") {
    return (
      <div>
        <p style={{ color: "red" }}>
          Access Denied: You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <>
      <HomeBar />
      <Helmet>
        <title>AdminPage</title>
      </Helmet>
      <div>
        <h1>Admin Page</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}{" "}
        {/* Use the error from context */}
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.username, e.target.value)
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminPage;
