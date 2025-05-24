import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { register } from "../../services/auth";
import axios from "axios";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import api from "../../api/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [rankedInId, setRankedInId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const navigate = useNavigate();

  // Handle countdown for smooth redirect
  useEffect(() => {
    if (redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0 && successMessage) {
      navigate("/", {
        state: {
          message: "Din konto er oprettet! Du kan nu logge ind.",
          from: "register",
        },
      });
    }
  }, [redirectCountdown, navigate, successMessage]);

  const validatePassword = () => {
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("Adgangskoder matcher ikke");
      return false;
    }

    if (password.length < 8) {
      setPasswordError("Din adgangskode skal være mindst 8 tegn lang");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!username || !password || !confirmPassword) {
      setError("Alle felter skal udfyldes");
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
        "Din konto er oprettet! Omdirigerer til login siden..."
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
          : "Der opstod en fejl under registreringen. Prøv igen."
      );
    }
  };

  // Function to handle manual navigation
  const handleNavigateToLogin = () => {
    navigate("/", {
      state: {
        message: "Din konto er oprettet! Du kan nu logge ind.",
        from: "register",
      },
    });
  };

  const handleRankedInSearch = async () => {
    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const res = await api.get("/SearchParticipants", {
        params: { term: searchTerm, language: "da", take: 5, skip: 0 },
      });
      // Ensure the result is always an array
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSearchError("Kunne ikke søge RankedIn. Prøv igen.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Update handleSelectRankedIn to match new usage
  const handleSelectRankedIn = (result: any) => {
    setRankedInId(result.RankedinId);
    setSearchResults([]);
    setSearchTerm(result.Name);
    setError("");
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
              <a href="/public" className="block">
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

          <main className="flex items-center justify-center px-5 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-5">
            <div className="w-full lg:max-w-sm">
              <div className="relative -mt-16 block lg:hidden">
                <div className="block">
                  <span className="sr-only">Home</span>
                  <div className="relative inline-block bg-gray-900 p-4 rounded-full">
                    <img
                      src="https://www.smash.dk/wp-content/uploads/2021/05/SMASH-neg-udenby@4x.png"
                      alt="Home"
                      className="h-12 sm:h-12"
                    />
                  </div>
                </div>

                <h1 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">
                  SMASH Padelcenter 🎾
                </h1>

                <p className="leading-relaxed text-gray-400">
                  Din nye klubapp.
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
                        Du vil blive omdirigeret om {redirectCountdown}{" "}
                        sekunder.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleNavigateToLogin}
                      className="text-blue-600 text-xs mt-2 underline"
                    >
                      Go to login page now
                    </button>
                  </div>
                )}

                {!successMessage && (
                  <>
                    <div className="col-span-6">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="username"
                          className="block text-sm font-medium text-left"
                        >
                          Brugernavn
                        </label>
                        <InformationCircleIcon
                          onClick={() =>
                            alert(
                              "Dit brugernavn bruges til at logge ind med, og det bliver vist på din profil. Det er også sådan andre spillere kan finde dig i appen – vælg derfor et navn, du let kan huske på, og som ikke indeholder følsom data."
                            )
                          }
                          className="size-6 animate-pulseSlow"
                        />
                      </div>

                      <input
                        type="text"
                        id="username"
                        name="username"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 w-full rounded-md border-gray-700 bg-gray-800 text-sm shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 "
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
                        className="mt-1 w-full rounded-md border-gray-700 bg-gray-800 text-sm shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 "
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
                        className="mt-1 w-full rounded-md border-gray-700 bg-gray-800 text-sm shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 "
                      />
                      {passwordError && (
                        <p className="mt-1 text-sm text-red-500 transition-opacity duration-200">
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <div className="col-span-6">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="rankedin-search"
                          className="block text-sm font-medium text-gray-200"
                        >
                          Tilknyt rankedin ID
                        </label>
                        <InformationCircleIcon
                          onClick={() =>
                            alert(
                              "Ved at tilknytte dit RankedIn ID kan du modtage notifikationer om kommende turneringer, kampresultater og opdateringer fra RankedIn direkte i appen. Dette giver dig bedre overblik over din padel-aktivitet."
                            )
                          }
                          className="size-6 animate-pulseSlow cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Tilknyt dit RankedIn ID for at modtage notifikationer og
                        information om dine turneringer og kampe.
                      </p>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          id="rankedin-search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full rounded-md border-gray-700 bg-gray-800 text-sm shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50"
                          placeholder="Indtast dit navn..."
                        />
                        <button
                          type="button"
                          onClick={handleRankedInSearch}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          disabled={searchLoading || !searchTerm}
                        >
                          Søg
                        </button>
                      </div>
                      {searchLoading && (
                        <div className="text-xs text-gray-400 mt-1">
                          Søger...
                        </div>
                      )}
                      {searchError && (
                        <div className="text-xs text-red-500 mt-1">
                          {searchError}
                        </div>
                      )}
                      {searchResults.length > 0 && (
                        <div className="relative mt-2">
                          <ul className="absolute z-10 w-full bg-gray-900 border border-gray-700 rounded max-h-60 overflow-y-auto shadow-lg">
                            {searchResults.map((result) => (
                              <li
                                key={result.RankedinId}
                                className={`p-2 flex flex-col gap-1 border-b border-gray-800 last:border-b-0 ${
                                  rankedInId === result.RankedinId
                                    ? "bg-blue-900 text-white"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-semibold text-base">
                                      {result.Name}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-400">
                                      {result.PlayerInfo || ""}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-400">
                                      {result.OrganisationName ||
                                        result.Club ||
                                        ""}
                                    </span>
                                    <span className="ml-2 text-xs text-blue-300 font-mono">
                                      {result.RankedinId}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className={`ml-4 px-3 py-1 rounded text-xs font-bold transition-colors ${
                                      rankedInId === result.RankedinId
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    }`}
                                    onClick={() => handleSelectRankedIn(result)}
                                  >
                                    {rankedInId === result.RankedinId
                                      ? "Valgt"
                                      : "Vælg"}
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {rankedInId && (
                      <div className="mt-2 text-xs text-green-400 flex items-center gap-2">
                        <span>Valgt RankedIn ID:</span>
                        <span className="font-mono bg-gray-800 px-2 py-1 rounded text-blue-300 border border-blue-400">
                          {rankedInId}
                        </span>
                        <button
                          type="button"
                          className="ml-2 text-red-400 underline"
                          onClick={() => setRankedInId("")}
                        >
                          Fjern
                        </button>
                      </div>
                    )}

                    <div className="col-span-6">
                      <button
                        type="submit"
                        className="w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:bg-blue-700 transition-all duration-200 ease-in-out"
                        disabled={isLoading}
                      >
                        {isLoading ? "Opretter konto..." : "Opret konto"}
                      </button>
                    </div>

                    <div className="col-span-6 mt-4 text-center">
                      <p className="text-xs text-gray-400">
                        Ved at oprette en konto accepterer du vores{" "}
                        <a
                          href="/terms"
                          className="text-blue-500 hover:underline"
                        >
                          servicevilkår
                        </a>{" "}
                        og{" "}
                        <a
                          href="/privacy"
                          className="text-blue-500 hover:underline"
                        >
                          privatlivspolitik
                        </a>
                        .
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
