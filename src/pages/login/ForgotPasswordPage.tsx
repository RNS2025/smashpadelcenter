import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { Helmet } from "react-helmet-async";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Email er påkrævet");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.post("/forgot-password", { email });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Der opstod en fejl. Prøv igen senere."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <Helmet>
        <title>Glemt adgangskode | Smash Padel Center</title>
      </Helmet>

      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Glemt adgangskode</h1>
          <p className="mt-2 text-gray-400">
            Indtast din email, og vi sender dig et link til at nulstille din
            adgangskode.
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
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 shadow-sm focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              {loading ? "Sender..." : "Send nulstillingslink"}
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

export default ForgotPasswordPage;
