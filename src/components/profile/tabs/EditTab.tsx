import { useProfileContext } from "../../../context/ProfileContext";
import { Helmet } from "react-helmet-async";
import {
  InformationCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const EditTab = () => {
  const { formData, isSubmitting, handleSubmit, handleInputChange, error } =
    useProfileContext();

  // Helper function to check if a specific field has an error
  const hasFieldError = (fieldName: string): boolean => {
    if (!error) return false;

    const errorLower = error.toLowerCase();
    const fieldLower = fieldName.toLowerCase();

    return errorLower.includes(fieldLower);
  };

  return (
    <>
      <Helmet>
        <title>Rediger profil</title>
      </Helmet>

      <div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-500/20 border border-red-500/50 text-red-200 flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex gap-2">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-300"
                >
                  Fulde navn
                </label>
                <InformationCircleIcon
                  onClick={() =>
                    alert(
                      "Din RankedIn-profil tilkobles automatisk, hvis dit fulde navn matcher navnet på din RankedIn-konto."
                    )
                  }
                  className="h-5 text-cyan-500"
                />
              </div>
              <input
                type="text"
                name="fullName"
                id="fullName"
                value={formData.fullName || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-slate-800/80 bg-slate-800/80 shadow-sm sm:text-sm text-gray-300"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300"
              >
                Brugernavn
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-slate-800/80 bg-slate-800/80 shadow-sm sm:text-sm text-gray-300"
                disabled
              />
            </div>{" "}
            <div>
              <div className="flex gap-2">
                <label
                  htmlFor="rankedInId"
                  className="block text-sm font-medium text-gray-300"
                >
                  RankedIn ID
                </label>
                <InformationCircleIcon
                  onClick={() =>
                    alert(
                      "Dit RankedIn ID er unikt. Hvert ID kan kun bruges af én spiller. Hvis du forsøger at bruge et ID, der allerede er i brug, vil du få en fejlmeddelelse."
                    )
                  }
                  className="h-5 text-cyan-500"
                />
              </div>{" "}
              <input
                type="text"
                name="rankedInId"
                id="rankedInId"
                value={formData.rankedInId || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm text-gray-300 ${
                  hasFieldError("rankedin")
                    ? "border-red-500 bg-red-900/20"
                    : "border-slate-800/80 bg-slate-800/80"
                }`}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-slate-800/80 bg-slate-800/80 shadow-sm sm:text-sm text-gray-300"
              />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-300"
              >
                Telefon
              </label>
              <input
                type="text"
                name="phoneNumber"
                id="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-slate-800/80 bg-slate-800/80 shadow-sm sm:text-sm text-gray-300"
              />
            </div>
            <div>
              <label
                htmlFor="skillLevel"
                className="block text-sm font-medium text-gray-300"
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
                className="mt-1 block w-full rounded-md border-slate-800/80 bg-slate-800/80 shadow-sm sm:text-sm text-gray-300"
              />
            </div>
            <div>
              <label
                htmlFor="position"
                className="block text-sm font-medium text-gray-300"
              >
                Position
              </label>
              <select
                name="position"
                id="position"
                value={formData.position || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-slate-800/80 bg-slate-800/80 shadow-sm sm:text-sm text-gray-300"
              >
                <option value="Venstre">Venstre</option>
                <option value="Højre">Højre</option>
                <option value="Begge">Begge</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="playingStyle"
                className="block text-sm font-medium text-gray-300"
              >
                Spillestil
              </label>
              <input
                type="text"
                name="playingStyle"
                id="playingStyle"
                value={formData.playingStyle || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-slate-800/80 bg-slate-800/80 shadow-sm sm:text-sm text-gray-300"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="equipment"
                className="block text-sm font-medium text-gray-300"
              >
                Udstyr
              </label>
              <textarea
                name="equipment"
                id="equipment"
                rows={3}
                value={formData.equipment || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-slate-800/80 bg-slate-800/80 shadow-sm sm:text-sm text-gray-300 resize-none"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-cyan-500 bg-slate-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Gemmer..." : "Gem profil"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditTab;
