import React from "react";

interface AdminTabProps {
  successMessage: string;
  errorMessage: string;
}

const AdminTab: React.FC<AdminTabProps> = ({
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Panel</h2>
      <p className="text-gray-600 mb-4">
        Administrer brugere, kampe og andre admin-opgaver her.
      </p>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-gray-600">
          Som admin kan du administrere brugerroller, se rapporter og mere.
        </p>
      </div>
    </div>
  );
};

export default AdminTab;
