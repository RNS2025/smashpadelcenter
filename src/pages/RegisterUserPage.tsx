import { useState, useEffect } from "react";
import { register } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const navigate = useNavigate();

  // Handle countdown for smooth redirect
  useEffect(() => {
    if (redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0 && successMessage) {
      navigate("/login", {
        state: {
          message: "Registration successful! You can now log in.",
          from: "register",
        },
      });
    }
  }, [redirectCountdown, navigate, successMessage]);

  const validatePassword = () => {
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!username || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);
    try {
      await register(username, password);

      // Set success message and start countdown
      setSuccessMessage(
        "Registration successful! Redirecting to login page..."
      );
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setRedirectCountdown(3); // 3-second countdown
    } catch (err) {
      setIsLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    }
  };

  // Function to handle manual navigation
  const handleNavigateToLogin = () => {
    navigate("/login", {
      state: {
        message: "Registration successful! You can now log in.",
        from: "register",
      },
    });
  };

  return (
    <>
      <Helmet>
        <title>Opret konto</title>
      </Helmet>

      <section className="transition-all duration-300 ease-in-out">
        <div className="xl:grid lg:min-h-screen lg:grid-cols-12">
          <section className="relative flex h-52 items-end lg:col-span-7 lg:h-full">
            <img
              alt=""
              src="https://www.smash.dk/wp-content/uploads/2021/04/Smash-16-scaled.jpg"
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />

            <div className="hidden lg:relative lg:block lg:p-12">
              <a href="/" className="block">
                <span className="sr-only">Home</span>
                <img
                  src="https://www.smash.dk/wp-content/uploads/2021/05/SMASH-neg-udenby@4x.png"
                  alt="Home"
                  className="h-24 sm:h-24"
                />
              </a>

              <h2 className="mt-6 text-2xl font-bold sm:text-3xl md:text-4xl">
                SMASH Padelcenter
              </h2>

              <p className="mt-4 leading-relaxed">Din nye klubapp.</p>
            </div>
          </section>

          <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-5">
            <div className="max-w-xl lg:max-w-3xl">
              <div className="relative -mt-16 block lg:hidden">
                <a href="/" className="block">
                  <span className="sr-only">Home</span>
                  <div className="relative inline-block bg-gray-900 p-6 rounded-full">
                    <img
                      src="https://www.smash.dk/wp-content/uploads/2021/05/SMASH-neg-udenby@4x.png"
                      alt="Home"
                      className="h-8 sm:h-12"
                    />
                  </div>
                </a>

                <h1 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">
                  SMASH Medarbejderportal 🎾
                </h1>

                <p className="mt-4 leading-relaxed text-gray-400">
                  Vagtplansystem, nyheder, beskeder - og meget mere.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-8 grid grid-cols-6 gap-6"
              >
                <div className="col-span-6">
                  <h2 className="text-2xl font-bold">Opret konto</h2>
                </div>

                {error && (
                  <div className="col-span-6 transition-opacity duration-300 ease-in-out">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="col-span-6 transition-all duration-300 ease-in-out bg-green-100 border border-green-300 rounded-md p-3">
                    <p className="text-green-700 text-sm">{successMessage}</p>
                    {redirectCountdown > 0 && (
                      <p className="text-green-600 text-xs mt-1">
                        Redirecting in {redirectCountdown} seconds...
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleNavigateToLogin}
                      className="text-blue-600 text-xs mt-2 underline hover:text-blue-800"
                    >
                      Go to login page now
                    </button>
                  </div>
                )}

                {!successMessage && (
                  <>
                    <div className="col-span-6">
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-left"
                      >
                        Brugernavn
                      </label>

                      <input
                        type="text"
                        id="username"
                        name="username"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 w-80 rounded-md text-sm shadow-sm border-gray-700 bg-gray-800 transition-all duration-200"
                      />
                    </div>

                    <div className="col-span-6">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-left"
                      >
                        Adgangskode
                      </label>

                      <input
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-80 rounded-md text-sm shadow-sm border-gray-700 bg-gray-800 transition-all duration-200"
                      />
                    </div>

                    <div className="col-span-6">
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-left"
                      >
                        Gentag adgangskode
                      </label>

                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 w-80 rounded-md text-sm shadow-sm border-gray-700 bg-gray-800 transition-all duration-200"
                      />
                      {passwordError && (
                        <p className="mt-1 text-sm text-red-500 transition-opacity duration-200">
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <div className="col-span-6 sm:flex sm:items-center sm:gap-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium transition-all duration-300 hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <svg
                              className="w-5 h-5 mr-3 animate-spin"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          "Opret konto"
                        )}
                      </button>
                      <p className="mt-4 text-sm text-gray-500 sm:mt-0">
                        Har du allerede en konto?{" "}
                        <button
                          type="button"
                          onClick={() => navigate("/login")}
                          className="text-blue-600 underline transition-colors duration-200 hover:text-blue-800"
                        >
                          Log ind
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </form>
            </div>
          </main>
        </div>
      </section>
    </>
  );
}
