import React from "react";
import { UserProfile } from "../../../../types/UserProfile";

interface EditTabProps {
  formData: Partial<UserProfile>;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  handleInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  successMessage: string;
  errorMessage: string;
}

const EditTab: React.FC<EditTabProps> = ({
  formData,
  isSubmitting,
  handleSubmit,
  handleInputChange,
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Rediger Profil</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-600"
            >
              Fulde navn
            </label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={formData.fullName || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
            />
          </div>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-600"
            >
              Brugernavn
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-gray-800 bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
            />
          </div>
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-600"
            >
              Telefon
            </label>
            <input
              type="text"
              name="phoneNumber"
              id="phoneNumber"
              value={formData.phoneNumber || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
            />
          </div>
          <div>
            <label
              htmlFor="skillLevel"
              className="block text-sm font-medium text-gray-600"
            >
              Niveau (1-5)
            </label>
            <input
              type="number"
              name="skillLevel"
              id="skillLevel"
              min="1"
              max="5"
              step="0.1"
              value={formData.skillLevel || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
            />
          </div>
          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-gray-600"
            >
              Position
            </label>
            <select
              name="position"
              id="position"
              value={formData.position || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
            >
              <option value="left">Venstre</option>
              <option value="right">Højre</option>
              <option value="both">Begge</option>
            </select>
          </div>
          <div className="col-span-1 md:col-span-2">
            <label
              htmlFor="playingStyle"
              className="block text-sm font-medium text-gray-600"
            >
              Spillestil
            </label>
            <input
              type="text"
              name="playingStyle"
              id="playingStyle"
              value={formData.playingStyle || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label
              htmlFor="equipment"
              className="block text-sm font-medium text-gray-600"
            >
              Udstyr
            </label>
            <textarea
              name="equipment"
              id="equipment"
              rows={3}
              value={formData.equipment || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
            />
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Gemmer..." : "Gem profil"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTab;
