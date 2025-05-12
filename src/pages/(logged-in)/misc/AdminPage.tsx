import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { getUsers, changeUserRole } from "../../../services/auth.ts";
import { User } from "../../../types/user.ts";
import { useUser } from "../../../context/UserContext.tsx";
import CourtSchedule from "../../../components/CourtSchedule.tsx";

export const AdminPage = () => {
  const { user, error } = useUser();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch {
        console.error("Failed to fetch users");
      }
    };

    fetchUsers().then();
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

  return (
    <>
      <Helmet>
        <title>AdminPage</title>
      </Helmet>
      <div>
        <h1>Admin Page</h1>
        {user && error && <p className="text-red-500">{error}</p>}{" "}
        <h2>Users</h2>
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
                    className="text-black"
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.username, e.target.value)
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="trainer">Trainer</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <CourtSchedule />
      </div>
    </>
  );
};

export default AdminPage;
