import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { Helmet } from "react-helmet-async";
import LoadingSpinner from "../../components/misc/LoadingSpinner";

const ResetPasswordPage: React.FC = () => {
  // This extracts the token from URL
  const { token } = useParams<{ token: string }>();

  console.log("Reset password token:", token); // Add this for debugging

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Verify token is valid
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await api.get(`/reset-password/${token}/verify`);
        setTokenValid(response.data.valid);
      } catch (err) {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Adgangskoderne stemmer ikke overens");
      return;
    }

    if (password.length < 6) {
      setError("Adgangskoden skal være mindst 6 tegn");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.post(`/reset-password/${token}`, { password });
      setMessage(response.data.message);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Der opstod en fejl. Prøv igen senere."
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <LoadingSpinner />
          <p className="mt-4">Bekræfter nulstillingslink...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400">
              Ugyldigt eller udløbet link
            </h1>
            <p className="mt-4">
              Dette link til nulstilling af adgangskode er ikke længere gyldigt.
              Anmod venligst om et nyt link.
            </p>
            <div className="mt-6">
              <Link
                to="/glemt-adgangskode"
                className="text-cyan-500 hover:text-cyan-400"
              >
                Anmod om nyt nulstillingslink
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <Helmet>
        <title>Nulstil adgangskode | Smash Padel Center</title>
      </Helmet>

      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Nulstil adgangskode</h1>
          <p className="mt-2 text-gray-400">
            Opret en ny adgangskode til din konto.
          </p>
        </div>

        {message && (
          <div className="bg-green-900/30 border border-green-500 p-4 rounded-md text-green-400">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500 p-4 rounded-md text-red-400">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Ny adgangskode
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 shadow-sm focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300"
            >
              Bekræft ny adgangskode
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 shadow-sm focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              {loading ? "Behandler..." : "Nulstil adgangskode"}
            </button>
          </div>

          <div className="text-center text-sm">
            <Link to="/" className="text-cyan-500 hover:text-cyan-400">
              Tilbage til login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
