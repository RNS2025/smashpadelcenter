import {useProfileContext} from "../../../context/ProfileContext.tsx";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";


const OverviewTab = () => {
  const { profile } = useProfileContext();

  if (!profile) return <LoadingSpinner />;

  const winRate = profile.stats.matches ? Math.round((profile.stats.wins / profile.stats.matches) * 100) : 0;


  return (
      <div className="mt-6">

        <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
          Statistik
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {profile.stats.matches}
            </p>
            <p className="text-xs text-gray-600">Kampe</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {profile.stats.wins}
            </p>
            <p className="text-xs text-gray-600">Sejre</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {profile.stats.losses}
            </p>
            <p className="text-xs text-gray-600">Nederlag</p>
          </div>
          <div className="col-span-3 mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                  className="bg-cyan-500 h-2.5 rounded-full"
                  style={{ width: `${winRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-center mt-1 text-gray-600">
              {winRate}% Sejrsprocent
            </p>
          </div>
        </div>


        <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
          Spilleroplysninger
        </h3>
        <p className="text-gray-600">
          <strong>Position:</strong> {profile.position}
        </p>
        <p className="text-gray-600">
          <strong>Spillestil:</strong> {profile.playingStyle || "N/A"}
        </p>
        <p className="text-gray-600">
          <strong>Udstyr:</strong> {profile.equipment || "N/A"}
        </p>


        <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Kontakt</h3>
        <p className="text-gray-600">
          <strong>Email:</strong> {profile.email}
        </p>
        <p className="text-gray-600">
          <strong>Telefon:</strong> {profile.phoneNumber || "N/A"}
        </p>


      </div>
  );
};

export default OverviewTab;
