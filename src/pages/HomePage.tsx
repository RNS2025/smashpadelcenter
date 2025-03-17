import { Helmet } from "react-helmet-async";
import { useNavigate, useLocation } from "react-router-dom";
import HomeBar from "../components/HomeBar";
import { useUser } from "../context/UserContext"; // Import the context
import { useEffect, useState } from "react";

export const HomePage = () => {
  const { role, error, refreshUser } = useUser(); // Access role, error, and refreshUser from context
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false); // Track refresh state

  useEffect(() => {
    // If role is not authenticated, try refreshing the user data
    if (!role && !isRefreshing) {
      setIsRefreshing(true);
      refreshUser() // Assuming refreshUser fetches the user data again
        .then(() => {
          setIsRefreshing(false);
        })
        .catch(() => {
          setIsRefreshing(false); // Handle the error
        });
    }
  }, [role, isRefreshing, refreshUser]);

  // If role is still not set or there is an error
  if (!role || error) {
    return (
      <div>
        <p style={{ color: "red" }}>{error || "You are not authenticated."}</p>
        <button
          onClick={() =>
            navigate("/", {
              state: { message: "Please login to access this page" },
            })
          }
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <>
      <HomeBar />
      <Helmet>
        <title>HomePage</title>
      </Helmet>
      <div>
        <h1>Welcome to the Home Page</h1>
        <p>This is the homepage of your application.</p>
      </div>

      {(role === "user" || role === "admin") && (
        <div>
          <h2>User Section</h2>
          <p>This section is visible to users.</p>
        </div>
      )}

      {role === "admin" && (
        <div>
          <h2>Admin Section</h2>
          <p>This section is visible to admins.</p>
          <button onClick={() => navigate("/admin")}>Admin Page</button>
        </div>
      )}
    </>
  );
};

export default HomePage;
