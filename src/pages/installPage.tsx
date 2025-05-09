import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useLocation } from "react-router-dom";

const InstallPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFacebookBrowser = /FBAN|FBAV/i.test(navigator.userAgent);
  const [localDeferredPrompt, setLocalDeferredPrompt] = useState<any>(null);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(
    location.search === "?manual=true"
  );
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSafari =
    /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);

  useEffect(() => {
    if (isFacebookBrowser) {
      // Facebook in-app browser: no further action
      return;
    }

    // Wait for beforeinstallprompt event to capture deferredPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setLocalDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [isFacebookBrowser]);

  const handleInstall = async () => {
    if (localDeferredPrompt) {
      // Use the stored prompt if available
      try {
        localDeferredPrompt.prompt();
        const choiceResult = await localDeferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
          navigate("/hjem", { replace: true });
        } else {
          showManualInstallGuide();
        }
        setLocalDeferredPrompt(null);
      } catch (err) {
        console.error("Installation prompt error:", err);
        showManualInstallGuide();
      }
    } else {
      // Try alternative installation methods if deferredPrompt isn't available
      showManualInstallGuide();
    }
  };

  const showManualInstallGuide = () => {
    // Check if app is already installed
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    if (isStandalone) {
      navigate("/hjem", { replace: true });
      return;
    }

    // Show manual installation guide
    navigate("/install?manual=true", { replace: true });
    setShowManualGuide(true);
  };

  // Helper function to render iOS Safari guide
  const renderIOSSafariGuide = () => (
    <div className="bg-gray-800 rounded-lg p-4 text-white space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">Trin 1: Tryk på Del-knappen</h3>
        <p className="text-gray-300 text-sm mb-2">
          Find del-knappen nederst på skærmen.
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">📱</span>
          <span className="text-xl ml-2">→</span>
          <span className="text-2xl ml-2">📤</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">
          Trin 2: Tryk på "Føj til hjemmeskærm"
        </h3>
        <p className="text-gray-300 text-sm mb-2">
          Scroll ned i menuen og find "Føj til hjemmeskærm".
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">📱</span>
          <span className="text-xl ml-2">→</span>
          <span className="text-2xl ml-2">➕🏠</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Trin 3: Tryk på "Tilføj"</h3>
        <p className="text-gray-300 text-sm mb-2">
          Tryk på "Tilføj" i øverste højre hjørne.
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">➕</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Trin 4: Færdig!</h3>
        <p className="text-gray-300 text-sm mb-2">
          Nu kan du finde SMASH App på din hjemmeskærm.
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">✅</span>
        </div>
      </div>
    </div>
  );

  // Helper function to render Android Chrome guide
  const renderAndroidChromeGuide = () => (
    <div className="bg-gray-800 rounded-lg p-4 text-white space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">Trin 1: Tryk på menuen</h3>
        <p className="text-gray-300 text-sm mb-2">
          Find de tre prikker i øverste højre hjørne.
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">⋮</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">
          Trin 2: Vælg "Føj til startskærm"
        </h3>
        <p className="text-gray-300 text-sm mb-2">
          Find og tryk på "Føj til startskærm" i menuen.
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">📱</span>
          <span className="text-xl ml-2">→</span>
          <span className="text-2xl ml-2">➕🏠</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Trin 3: Tryk på "Tilføj"</h3>
        <p className="text-gray-300 text-sm mb-2">
          Bekræft ved at trykke på "Tilføj".
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">➕</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Trin 4: Færdig!</h3>
        <p className="text-gray-300 text-sm mb-2">
          Nu kan du finde SMASH App på din startskærm.
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">✅</span>
        </div>
      </div>
    </div>
  );

  // Helper function to render generic guide
  const renderGenericGuide = () => (
    <div className="bg-gray-800 rounded-lg p-4 text-white space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">Trin 1: Åbn browsermenuen</h3>
        <p className="text-gray-300 text-sm mb-2">
          Find indstillinger eller menu-knappen i din browser.
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">⋮</span>
          <span className="text-xl ml-2">eller</span>
          <span className="text-2xl ml-2">≡</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">
          Trin 2: Find "Tilføj til hjemmeskærm" eller lignende
        </h3>
        <p className="text-gray-300 text-sm mb-2">
          Denne funktion kan også hedde "Installér app" eller "Føj til
          startskærm".
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">➕🏠</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">
          Trin 3: Bekræft installationen
        </h3>
        <p className="text-gray-300 text-sm mb-2">
          Tryk på "Tilføj" eller "Installér" for at færdiggøre.
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">➕</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Trin 4: Færdig!</h3>
        <p className="text-gray-300 text-sm mb-2">
          Nu er SMASH App installeret på din enhed.
        </p>
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <span className="text-2xl">✅</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Installér SMASH App</title>
      </Helmet>

      <section className="flex min-h-screen items-center justify-center bg-gray-900 px-5 py-8">
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="relative inline-block bg-gray-900 px-4 py-6 rounded-full">
              <img
                src="https://www.smash.dk/wp-content/uploads/2021/05/SMASH-neg-udenby@4x.png"
                alt="SMASH Logo"
                className="h-10 sm:h-12"
                aria-label="SMASH Padelcenter Logo"
              />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              SMASH Padelcenter
            </h1>
            <p className="mt-2 leading-relaxed text-gray-400">
              Din nye klubapp
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {!showManualGuide ? (
              <>
                <h2 className="text-xl font-bold text-white text-center">
                  Installér SMASH App
                </h2>

                {isFacebookBrowser ? (
                  <div className="transition-all duration-300 ease-in-out bg-yellow-100 border border-yellow-300 rounded-md p-3">
                    <p className="text-yellow-700 text-sm">
                      For at installere SMASH App, åbn dette link i Chrome
                      (Android) eller Safari (iOS):{" "}
                      <a
                        href="https://rns-apps.dk/install"
                        className="text-blue-600 hover:underline"
                      >
                        https://rns-apps.dk/install
                      </a>
                    </p>
                  </div>
                ) : (
                  <div className="transition-all duration-300 ease-in-out text-center">
                    <button
                      onClick={handleInstall}
                      className="w-full inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition-all duration-300 focus:outline-none focus:ring disabled:opacity-50"
                    >
                      Installér Nu
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white text-center">
                  Sådan installerer du SMASH App
                </h2>
                <p className="text-gray-300 text-center mb-4">
                  Følg disse simple trin for at installere app'en på din
                  telefon:
                </p>

                {isIOS && isSafari
                  ? renderIOSSafariGuide()
                  : isAndroid && isChrome
                  ? renderAndroidChromeGuide()
                  : renderGenericGuide()}

                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate("/", { replace: true })}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-2 text-sm font-medium text-white transition-all duration-300 focus:outline-none focus:ring mt-4"
                  >
                    Gå til login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default InstallPage;
