import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import HomeBar from "../components/HomeBar";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";

export const HomePage = () => {
  const { role, error, refreshUser } = useUser();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // If role is not authenticated, try refreshing the user data
    if (!role && !isRefreshing) {
      setIsRefreshing(true);
      refreshUser()
        .then(() => {
          setIsRefreshing(false);
        })
        .catch(() => {
          setIsRefreshing(false);
        });
    }
  }, [role, isRefreshing, refreshUser]);

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
