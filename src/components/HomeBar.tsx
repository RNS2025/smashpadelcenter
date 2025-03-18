import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const HomeBar = () => {
  const { role, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleHomeClick = () => {
    navigate("/home");
  };

  const handleAdminClick = () => {
    navigate("/admin");
  };

  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
      <button onClick={handleHomeClick} style={{ marginRight: "10px" }}>
        Home
      </button>
      {role === "admin" && (
        <button onClick={handleAdminClick} style={{ marginRight: "10px" }}>
          Admin Panel
        </button>
      )}
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
};

export default HomeBar;
