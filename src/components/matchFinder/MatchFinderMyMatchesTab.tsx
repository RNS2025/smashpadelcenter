import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { PadelMatch } from "../../types/PadelMatch";
import communityApi from "../../services/makkerborsService";
import LoadingSpinner from "../misc/LoadingSpinner";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { registerLocale } from "react-datepicker";
import { da } from "date-fns/locale";
import {
  calculateTimeDifference,
  isMatchDeadlinePassed,
  safeFormatDate,
} from "../../utils/dateUtils";
import ConfirmMatchResultDialog from "./misc/ConfirmMatchResultDialog.tsx";
import Overlay from "../misc/Overlay.tsx";
registerLocale("da", da);

export const MatchFinderMyMatchesTab = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [matches, setMatches] = useState<PadelMatch[]>([]);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PadelMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        if (user?.username) {
          const data = await communityApi.getMatches();
          console.log(data);

          const sortedData = data
              .filter((match => match.reservedSpots.length !== 3))
              .filter((match => new Date(match.matchDateTime) > new Date() || (new Date(match.matchDateTime) < new Date() && match.participants.length + match.reservedSpots.length === match.totalSpots)))
            .filter((match) => {
              const matchEnd = new Date(match.endTime);
              const isFull =
                match.participants.length + match.reservedSpots.length ===
                match.totalSpots;

              return matchEnd > new Date() || isFull;
            })
            .filter(
              (match) =>
                match.username === user.username ||
                match.participants.includes(user.username) ||
                match.invitedPlayers.includes(user.username)
            )
            .filter((match) => {
              const totalParticipants = match.participants.length;

              if (totalParticipants === 2 || totalParticipants === 3) {
                return match.playersConfirmedResult.length < totalParticipants;
              }

              if (totalParticipants === 4) {
                return match.playersConfirmedResult.length < 3;
              }
              return true;
            })
            .sort((a, b) => {
              const aDate = new Date(a.matchDateTime).getTime();
              const bDate = new Date(b.matchDateTime).getTime();
              return aDate - bDate;
            });

          setMatches(sortedData);
          console.log(sortedData);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches");
        setLoading(false);
      }
    };

    fetchMatches().then();
  }, [user?.username]);

  const handleSubmitResult = async () => {
    if (!selectedMatch || !user?.username) return;

    const confirmMatch: PadelMatch = {
      ...selectedMatch,
      playersConfirmedResult: [
        ...(selectedMatch.playersConfirmedResult || []),
        user.username,
      ],
    };

    try {
      const userConfirmed = confirm(
        "Er du sikker på, at du vil bekræfte dette resultat?"
      );
      if (userConfirmed) {
        await communityApi.submitConfirmResult(selectedMatch.id, confirmMatch);
        setConfirmDialogVisible(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating match:", error);
      alert("Der opstod en fejl ved bekræftelse af resultatet.");
    }
  };

  if (loading) {
    return (
      <>
        <div className="w-full flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  const matchReservesOnly = (match: PadelMatch) => {
    return match.reservedSpots.length === 3;
  };

  return (
    <>
      <Helmet>
        <title>Mine kampe</title>
      </Helmet>

      <Overlay isVisible={confirmDialogVisible}>
        <ConfirmMatchResultDialog
          match={selectedMatch}
          onConfirm={handleSubmitResult}
          onDecline={() => {
            const userDecline = confirm(
              "Er du sikker på, at du vil afvise resultatet?"
            );
            if (userDecline) {
              setConfirmDialogVisible(false);
            }
          }}
          onClose={() => setConfirmDialogVisible(false)}
        />
      </Overlay>

      <div className="text-sm">
        {matches.length === 0 ? (
          <div className="border p-4 rounded-lg space-y-1.5 mb-5">
            <p className="text-center py-4 font-semibold">
              Ingen aktuelle kampe at vise.
            </p>
          </div>
        ) : (
          matches.map((match) => (
            <div
              onClick={() => {
                if (!match.deadline || !isMatchDeadlinePassed(match.deadline)) {
                  navigate(`/makkerbørs/${match.id}`);
                }
              }}
              key={match.id}
              className={`relative border p-4 rounded-lg space-y-1.5 mb-5 ${
                match.deadline && isMatchDeadlinePassed(match.deadline)
                  ? "opacity-70 border-red-500"
                  : ""
              }
            ${
              match.participants.length + match.reservedSpots.length ===
              match.totalSpots
                ? "border-green-500"
                : ""
            }
            `}
            >
              {!matchReservesOnly(match) &&
                new Date(match.endTime) < new Date() &&
                match.participants.length + match.reservedSpots.length ===
                  match.totalSpots &&
                match.username === user?.username && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        user &&
                        !match.playersConfirmedResult.includes(user?.username)
                      ) {
                        navigate(`/makkerbørs/${match.id}/indtastresultat`);
                      }
                    }}
                    className={`absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center rounded-lg z-10`}
                  >
                    <span className="text-white text-lg text-center font-semibold animate-pulse">
                      {user &&
                      match.playersConfirmedResult.includes(user?.username)
                        ? "Resultat afventer bekræftelse fra medspillere"
                        : "Indtast resultat"}
                    </span>
                  </div>
                )}

              {!matchReservesOnly(match) &&
                new Date(match.endTime) < new Date() &&
                match.participants.length + match.reservedSpots.length ===
                  match.totalSpots &&
                match.username !== user?.username && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        match.playersConfirmedResult.includes(match.username)
                      ) {
                        setSelectedMatch(match);
                        setConfirmDialogVisible(true);
                      }
                    }}
                    className={`absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center rounded-lg z-10`}
                  >
                    <span className="text-white text-lg text-center font-semibold animate-pulse">
                      {user &&
                      !match.playersConfirmedResult.includes(match.username)
                        ? "Afventer kampejerens resultat"
                        : "Bekræft resultat"}
                    </span>
                  </div>
                )}

              <div className="flex justify-between">
                <h1 className="font-semibold">
                  {match.deadline && isMatchDeadlinePassed(match.deadline)
                    ? `(${safeFormatDate(
                        match.matchDateTime,
                        "dd/MM - HH:mm"
                      )}) Kamp annulleret: Deadline nået.`
                    : `${safeFormatDate(
                        match.matchDateTime,
                        "EEEE | dd. MMMM | HH:mm"
                      ).toUpperCase()} - ${safeFormatDate(
                        match.endTime,
                        "HH:mm"
                      )}`}
                </h1>
                {match.joinRequests.length > 0 &&
                  user?.username === match.username && (
                    <h1 className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs animate-pulse">
                      {match.joinRequests.length}
                    </h1>
                  )}
              </div>

              {match.deadline && (
                <h1 className="text-gray-500 italic">
                  Deadline:{" "}
                  {calculateTimeDifference(match.matchDateTime, match.deadline)
                    .hours > 1
                    ? `${
                        calculateTimeDifference(
                          match.matchDateTime,
                          match.deadline
                        ).hours
                      } timer før`
                    : `${
                        calculateTimeDifference(
                          match.matchDateTime,
                          match.deadline
                        ).hours
                      } time før`}
                </h1>
              )}

              <div className="flex justify-between border-b border-gray-600">
                <p>{match.location}</p>
                <p>{match.matchType}</p>
              </div>
              <div className="flex justify-between">
                <p>Niveau {match.level}</p>

                <div className="flex items-center">
                  {[
                    ...Array(
                      match.participants.length + match.reservedSpots.length
                    ),
                  ].map((_, i) => (
                    <UserCircleIcon
                      key={`participant-${i}`}
                      className="h-5 text-cyan-500"
                    />
                  ))}

                  {[
                    ...Array(
                      Math.max(
                        0,
                        match.totalSpots -
                          (match.participants.length +
                            match.reservedSpots.length)
                      )
                    ),
                  ]
                    .slice(0, match.joinRequests.length)
                    .map((_, i) => (
                      <UserCircleIcon
                        key={`join-${i}`}
                        className="h-5 text-yellow-500"
                      />
                    ))}

                  {[
                    ...Array(
                      Math.max(
                        0,
                        match.totalSpots -
                          (match.participants.length +
                            match.reservedSpots.length +
                            Math.min(
                              match.joinRequests.length,
                              match.totalSpots
                            ))
                      )
                    ),
                  ].map((_, i) => (
                    <UserCircleIcon
                      key={`empty-${i}`}
                      className="h-5 text-gray-500"
                    />
                  ))}

                  {match.joinRequests.length >
                    match.totalSpots -
                      (match.participants.length +
                        match.reservedSpots.length) && (
                    <div className="ml-1 text-xs text-yellow-400 font-semibold">
                      +
                      {match.joinRequests.length -
                        (match.totalSpots -
                          (match.participants.length +
                            match.reservedSpots.length))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-500">
                Oprettet af{" "}
                {match.username === user?.username
                  ? "dig"
                  : `${match.username}`}
              </p>
              {user && match.invitedPlayers.includes(user?.username) && (
                <div className="flex justify-between">
                  <p className="text-yellow-500 italic">
                    Du er inviteret til dette arrangement
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default MatchFinderMyMatchesTab;
