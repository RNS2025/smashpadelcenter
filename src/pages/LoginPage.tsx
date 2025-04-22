import { Helmet } from "react-helmet-async";
import { FormEvent, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../services/auth";

interface LocationState {
  message?: string;
  from?: string;
}

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Check for messages from navigation state
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.message) {
      setSuccessMessage(state.message);
      // Clear the state to prevent showing the message after refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      const data = await login(username, password);
      console.log("Logged in:", data);

      // Handle successful login
      navigate("/hjem");
    } catch (err) {
      setError((err as any).message);
    }
  };

  return (
    <>
      <Helmet>
        <title>Log ind</title>
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
                SMASH Padelcenter 🎾
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
                  SMASH Padelcenter 🎾
                </h1>

                <p className="mt-4 leading-relaxed text-gray-400">
                  Din nye klubapp.
                </p>
              </div>

              <form action="#" className="mt-8 flex flex-col gap-6">
                <div className="col-span-6">
                  <h2 className="text-2xl font-bold">Log ind</h2>
                </div>

                {successMessage && (
                  <div className="col-span-6 transition-all duration-300 ease-in-out bg-green-100 border border-green-300 rounded-md p-3">
                    <p className="text-green-700 text-sm">{successMessage}</p>
                  </div>
                )}

                <div className="col-span-6">
                  <label
                    htmlFor="Username"
                    className="block text-sm font-medium text-left"
                  >
                    Brugernavn
                  </label>

                  <input
                    type="text"
                    id="Username"
                    name="username"
                    className="mt-1 w-80 rounded-md text-sm shadow-sm border-gray-700 bg-gray-800 transition-all duration-200"
                    autoComplete={"username"}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="col-span-6">
                  <label
                    htmlFor="Password"
                    className="block text-sm font-medium text-left"
                  >
                    Adgangskode
                  </label>

                  <input
                    type="password"
                    id="Password"
                    name="password"
                    className="mt-1 w-80 rounded-md text-sm shadow-sm border-gray-700 bg-gray-800 transition-all duration-200"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="col-span-6 transition-opacity duration-300 ease-in-out">
                    <p className="text-red-500 text-sm">
                      Forkert brugernavn eller adgangskode.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLogin}
                    className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium transition-all duration-300 hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500"
                  >
                    SMASH!
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/register");
                    }}
                    className="inline-block shrink-0 rounded-md border border-gray-600 bg-gray-600 px-12 py-3 text-sm font-medium transition-all duration-300 hover:bg-transparent hover:text-gray-600 focus:outline-none focus:ring active:text-gray-500"
                  >
                    Registrer
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </section>
    </>
  );
};

export default LoginPage;
