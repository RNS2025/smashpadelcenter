import React, { useState } from "react";

interface InstallPromptProps {
  deferredPrompt: any;
  onDismiss: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({
  deferredPrompt,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    deferredPrompt = null;
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
        <div className="flex flex-col items-center">
          <img
            src="/icons/icon-192x192.png"
            alt="SMASH Padel Logo"
            className="w-16 h-16 mb-4"
          />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Installer SMASH Padel-app
          </h2>
          <p className="text-gray-600 text-center mb-4">
            Få hurtigere adgang til SMASH Padelcenter med vores app. Installer den nu
            for at få en bedre oplevelse!
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleInstall}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
