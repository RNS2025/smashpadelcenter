import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { getUserRole } from "../api/api";

export const HomePage = () => {
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const data = await getUserRole();
        setRole(data.role);
      } catch {
        setError("Failed to fetch user role");
      }
    };

    fetchUserRole();
  }, []);

  return (
    <>
      <Helmet>
        <title>HomePage</title>
      </Helmet>
      <div>
        <h1>Welcome to the Home Page</h1>
        <p>This is the homepage of your application.</p>
        {error && <p style={{ color: "red" }}>{error}</p>}
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
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;
