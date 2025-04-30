import { Helmet } from "react-helmet-async";
import {useState, useEffect, FormEvent} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, loginWithProvider } from "../../services/auth.ts";
import DPFLogo from "../../assets/DPF_Logo.png";

interface LocationState {
  message?: string;
  from?: string;
}

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.message) {
      setSuccessMessage(state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLocalLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate("/hjem");
    } catch (err) {
      setError("Kunne ikke logge ind.");
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderLogin = (provider: string) => {
    setError("");
    setSuccessMessage("");
    try {
      loginWithProvider(provider);
    } catch (err) {
      setError("Kunne ikke logge ind");
        console.log(err);
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
              <div className="block">
                <span className="sr-only">Home</span>
                <img
                  src="https://www.smash.dk/wp-content/uploads/2021/05/SMASH-neg-udenby@4x.png"
                  alt="Home"
                  className="h-24 sm:h-24"
                />
              </div>

              <h2 className="mt-6 text-2xl font-bold sm:text-3xl md:text-4xl">
                SMASH Padelcenter
              </h2>

              <p className="mt-4 leading-relaxed">Din nye klubapp.</p>

              <div onClick={() => navigate("/turneringer")} className="flex items-center gap-2 mt-4 border border-white rounded-lg p-2">
                <img src={DPFLogo} alt="DPF Logo" className="size-16" />
                <h1>Gå direkte til centerets DPF-central</h1>
              </div>
            </div>
          </section>

          <main className="flex items-center justify-center px-5 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-5">
            <div className="w-full lg:max-w-sm">
              <div className="relative -mt-16 block lg:hidden">
                <div className="block">
                  <span className="sr-only">Home</span>
                  <div className="relative inline-block bg-gray-900 px-4 py-6 rounded-full">
                    <img
                      src="https://www.smash.dk/wp-content/uploads/2021/05/SMASH-neg-udenby@4x.png"
                      alt="Home"
                      className="h-10 sm:h-12"
                    />
                  </div>
                </div>

                <h1 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">
                  SMASH Padelcenter
                </h1>

                <p className="leading-relaxed text-gray-400">
                  Din nye klubapp.
                </p>

                <div onClick={() => navigate("/turneringer")} className="flex items-center gap-2 mt-4 border border-white rounded-lg p-2">
                <img src={DPFLogo} alt="DPF Logo" className="size-16" />
                  <h1>Gå direkte til centerets DPF-central</h1>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-6 xl:gap-5">
                <div className="col-span-6">
                  <h2 className="text-2xl font-bold">Log ind</h2>
                </div>

                {successMessage && (
                  <div className="col-span-6 transition-all duration-300 ease-in-out bg-green-100 border border-green-300 rounded-md p-3">
                    <p className="text-green-700 text-sm">{successMessage}</p>
                  </div>
                )}

                {error && (
                  <div className="col-span-6 transition-all duration-300 ease-in-out bg-red-100 border border-red-300 rounded-md p-3">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <form
                  onSubmit={handleLocalLogin}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium"
                    >
                      Brugernavn
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1 w-full rounded-md border-gray-700 bg-gray-800 text-sm shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 "
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium"
                    >
                      Adgangskode
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 w-full rounded-md border-gray-700 bg-gray-800 text-sm shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 "
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring disabled:opacity-50"
                  >
                    Log ind
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/glemt-adgangskode")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Glemt adgangskode?
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Opret Konto
                  </button>
                </form>

                <div className="flex items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="mx-4 text-sm text-gray-500">eller</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => handleProviderLogin("google")}
                    className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring"
                    disabled={isSubmitting}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12.24 10.667v2.333h6.84c-.28 1.333-1.933 3.867-6.84 3.867-4.12 0-7.467-3.333-7.467-7.467s3.347-7.467 7.467-7.467c2.12 0 4.013.867 5.373 2.267l1.64-1.64C17.373 1.12 14.907 0 12.24 0 6.307 0 1.373 4.933 1.373 10.867s4.933 10.867 10.867 10.867c6.307 0 10.867-4.933 10.867-10.867 0-.733-.093-1.467-.24-2.2h-10.627z"
                      />
                    </svg>
                    Log ind med Google
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>
    </>
  );
};

export default LoginPage;
