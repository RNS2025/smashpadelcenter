import React from "react";

interface SettingsTabProps {
  successMessage: string;
  errorMessage: string;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  successMessage,
  errorMessage,
}) => {
  return (
    <div>
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg">
          <p className="text-sm">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Kontoindstillinger
      </h2>
      <p className="text-gray-600 mb-4">
        Administrer dine kontoindstillinger og præferencer her.
      </p>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-gray-600">
          Du kan ændre dit kodeord, administrere notifikationer og mere i denne
          sektion.
        </p>
      </div>
      <div className="flex justify-end gap-4">
        <button className="text-cyan-500 hover:text-cyan-600 transition duration-300">
          Skift kodeord
        </button>
        <button className="text-cyan-500 hover:text-cyan-600 transition duration-300">
          Administrer notifikationer
        </button>
      </div>
    </div>
  );
};

export default SettingsTab;
