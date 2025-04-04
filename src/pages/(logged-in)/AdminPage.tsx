import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { getUsers, changeUserRole } from "../../services/auth";
import User from "../../types/user";
import HomeBar from "../../components/misc/HomeBar";
import { useUser } from "../../context/UserContext";

export const AdminPage = () => {
  const { error } = useUser();
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
      <HomeBar />
      <Helmet>
        <title>AdminPage</title>
      </Helmet>
      <div>
        <h1>Admin Page</h1>
        {error && <p className="text-red-500">{error}</p>}{" "}
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
