import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext"; // Import the useUser hook

const HomeBar = () => {
  const { role, logout } = useUser(); // Access the logout function from context
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout(); // Call the logout function from context
    navigate("/"); // Redirect to the login page after logout
  };

  const handleHomeClick = () => {
    navigate("/home"); // Navigate to home page
  };

  const handleAdminClick = () => {
    navigate("/admin"); // Navigate to admin page
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
