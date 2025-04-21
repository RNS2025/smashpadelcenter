import React from "react";
import { UserProfile } from "../../../../types/UserProfile";

interface OverviewTabProps {
  profile: UserProfile;
  bookings: any[];
  successMessage: string;
  errorMessage: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  profile,
  bookings,
  successMessage,
  errorMessage,
}) => {
  const winRate = profile.stats.matches
    ? Math.round((profile.stats.wins / profile.stats.matches) * 100)
    : 0;

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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Spilleroversigt</h2>
      <p className="text-gray-600 mb-4">
        Velkommen til din spillerprofil, {profile.fullName}! Her kan du se din
        kamphistorik, statistik og administrere dine spilleroplysninger.
      </p>

      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Træner Bookinger
      </h3>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        {bookings.length ? (
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="p-3 bg-white rounded border border-gray-200"
              >
                <p className="text-gray-600">
                  Træner: {booking.trainerId.name} (
                  {booking.trainerId.specialty})
                </p>
                <p className="text-gray-600">
                  Dato: {new Date(booking.date).toLocaleDateString("da-DK")}
                </p>
                <p className="text-gray-600">Tid: {booking.timeSlot}</p>
                <p className="text-gray-600">Status: {booking.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Ingen bookinger endnu.</p>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Seneste aktivitet
      </h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-600">
          Din sidste kamp var{" "}
          {profile.pastMatches[0]?.date
            ? new Date(profile.pastMatches[0].date).toLocaleDateString("da-DK")
            : "N/A"}
        </p>
        <p className="text-gray-600 mt-2">
          Resultat:{" "}
          <span className="font-medium text-gray-800">
            {profile.pastMatches[0]?.result === "win"
              ? "Sejr"
              : profile.pastMatches[0]?.result === "loss"
              ? "Nederlag"
              : profile.pastMatches[0]?.result || "N/A"}
          </span>{" "}
          mod {profile.pastMatches[0]?.opponent || "N/A"}
        </p>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Kontakt</h3>
        <p className="text-gray-600">
          <strong>Email:</strong> {profile.email}
        </p>
        <p className="text-gray-600">
          <strong>Telefon:</strong> {profile.phoneNumber || "N/A"}
        </p>
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
      </div>
    </div>
  );
};

export default OverviewTab;
