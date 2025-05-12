import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

const InstallPage: React.FC = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);

  // Browser and device detection
  const isFacebookBrowser = /FBAN|FBAV/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSafari =
    /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);

  useEffect(() => {
    // Check if app is already installed in standalone mode
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    if (isStandalone) {
      navigate("/hjem", { replace: true });
      return;
    }

    if (isFacebookBrowser) {
      // Facebook in-app browser: show manual guide immediately
      setShowManualGuide(true);
      return;
    }

    // Immediately try to trigger install prompt (primarily for Android)
    const showInstallPrompt = async () => {
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const choiceResult = await deferredPrompt.userChoice;

          if (choiceResult.outcome === "accepted") {
            navigate("/hjem", { replace: true });
          } else {
            // User declined automatic prompt, show manual guide
            setShowManualGuide(true);
          }
          setDeferredPrompt(null);
        } catch (err) {
          console.error("Installation prompt error:", err);
          // On error, fall back to manual guide
          setShowManualGuide(true);
        }
      } else {
        // No prompt available, show manual guide
        setTimeout(() => {
          setShowManualGuide(true);
        }, 1000); // Short delay to avoid flashing content
      }
    };

    // Catch beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Try to show install prompt after a brief delay (for Android)
    const timeoutId = setTimeout(() => {
      if (!isIOS) {
        // Only show Android prompt if not iOS
        showInstallPrompt();
      } else {
        setShowManualGuide(true); // Always show manual guide for iOS
      }
    }, 500);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      clearTimeout(timeoutId);
    };
  }, [deferredPrompt, isFacebookBrowser, navigate, isIOS]);

  // Helper function to render iOS Safari guide
  const renderIOSSafariGuide = () => (
    <div className="bg-gray-800 rounded-lg p-4 text-white space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">Trin 1: Tryk på Del-knappen</h3>
        <p className="text-gray-300 text-sm mb-2">
          Find del-knappen nederst på skærmen eller øverst til højre, afhængigt
          af hvilken browser du bruger.
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

  // If still waiting for auto-installation attempt
  if (!showManualGuide && !isFacebookBrowser && !isIOS) {
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
            </div>
            <div className="mt-8 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              <p className="mt-4 text-white">Forbereder installation...</p>
            </div>
          </div>
        </section>
      </>
    );
  }

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
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white text-center">
              Sådan installerer du SMASH App
            </h2>
            <p className="text-gray-300 text-center mb-4">
              Følg disse simple trin for at installere appen på din telefon:
            </p>

            {isFacebookBrowser ? (
              <div className="transition-all duration-300 ease-in-out bg-yellow-100 border border-yellow-300 rounded-md p-3">
                <p className="text-yellow-700 text-sm">
                  For at installere SMASH App, åbn dette link i Chrome (Android)
                  eller Safari (iOS):{" "}
                  <a
                    href="https://rns-apps.dk/install"
                    className="text-blue-600 hover:underline"
                  >
                    https://rns-apps.dk/install
                  </a>
                </p>
              </div>
            ) : isIOS && isSafari ? (
              renderIOSSafariGuide()
            ) : isAndroid && isChrome ? (
              renderAndroidChromeGuide()
            ) : (
              renderGenericGuide()
            )}
          </div>
          <div className="mt-8 text-center w-full">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Gå til login
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default InstallPage;
