import { Helmet } from "react-helmet-async";
import Animation from "../../../components/misc/Animation";
import HomeBar from "../../../components/misc/HomeBar";
import {
  BoltIcon,
  MapPinIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "../../../context/UserContext";
import { useEffect, useState } from "react";
import { PadelMatch } from "../../../types/PadelMatch";
import communityApi from "../../../services/makkerborsService";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../../../components/misc/LoadingSpinner";
import { format } from "date-fns";
import da from "date-fns/locale/da";

export const ViewMatchPage = () => {
  const { username } = useUser();
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<PadelMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        if (!matchId) {
          setError("Kamp ID mangler");
          setLoading(false);
          return;
        }
        const matchData = await communityApi.getMatchById(matchId);
        setMatch(matchData);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching match:", err);
        setError(err.response?.data?.message || "Fejl ved indlæsning af kamp");
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  const safeFormatDate = (
    dateString: string | null,
    formatString: string
  ): string => {
    if (!dateString) return "Ugyldig dato";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Ugyldig dato";
      }
      return format(date, formatString, { locale: da });
    } catch {
      return "Ugyldig dato";
    }
  };

  const handleJoinMatch = async () => {
    if (!match || !username || match.participants.includes(username)) return;
    try {
      const updatedMatch = await communityApi.joinMatch(match.id, username);
      alert("Tilmelding sendt!");
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error joining match:", error);
      alert(error.response?.data?.message || "Fejl ved tilmelding");
    }
  };

  const handleConfirmJoin = async (participant: string) => {
    if (!match) return;
    try {
      const updatedMatch = await communityApi.confirmJoin(
        match.id,
        participant
      );
      alert("Tilmelding bekræftet!");
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved bekræftelse");
    }
  };

  const handleDeleteMatch = async () => {
    if (!match) return;
    try {
      await communityApi.deleteMatch(match.id);
      alert("Kamp slettet!");
      window.history.back();
    } catch (error: any) {
      console.error("Error deleting match:", error);
      alert(error.response?.data?.message || "Fejl ved sletning af kamp");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !match) {
    return (
      <>
        <Helmet>
          <title>Kampdetaljer</title>
        </Helmet>
        <Animation>
          <HomeBar />
          <div className="mx-4 my-10">{error || "Kamp ikke fundet"}</div>
        </Animation>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Kampdetaljer</title>
      </Helmet>

      <Animation>
        <HomeBar />

        <div className="mx-4 my-10 space-y-4 text-sm">
          <h1 className="text-xl justify-self-center font-semibold">
            {safeFormatDate(
              match.matchDateTime,
              "EEEE | dd. MMMM | HH:mm"
            ).toUpperCase()}{" "}
            - {safeFormatDate(match.endTime, "HH:mm")}
          </h1>

          {/* Match creator */}
          <div className="border rounded flex items-center px-1">
            <UserCircleIcon className="h-20" />
            <div className="w-full pr-1 truncate">
              <h1>{match.username}</h1>
              <h1 className="text-gray-500">Kampejer</h1>
            </div>
            <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-20 h-12">
              {match.level}
            </div>
          </div>

          {/* Participants */}
          {match.participants.map((participant, index) => (
            <div key={index} className="border rounded flex items-center px-1">
              <UserCircleIcon className="h-20" />
              <div className="w-full pr-1 truncate">
                <h1>{participant}</h1>
              </div>
              <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-20 h-12">
                {match.level}
              </div>
            </div>
          ))}

          {/* Join requests (visible to creator) */}
          {match.username === username &&
            match.joinRequests.map((requester, index) => (
              <div
                key={index}
                className="border rounded flex items-center px-1"
              >
                <UserCircleIcon className="h-20" />
                <div className="w-full pr-1 truncate">
                  <h1>{requester}</h1>
                  <h1 className="text-gray-500">Afventer bekræftelse</h1>
                </div>
                <button
                  onClick={() => handleConfirmJoin(requester)}
                  className="bg-cyan-500 text-white rounded-lg px-2 py-1"
                >
                  Bekræft
                </button>
              </div>
            ))}

          {/* Empty spots */}
          {[
            ...Array(
              match.totalSpots -
                (match.participants.length + match.reservedSpots.length)
            ),
          ].map((_, index) => (
            <div
              key={`empty-${index}`}
              className="border border-gray-500 rounded flex items-center px-1"
            >
              <UserCircleIcon className="h-20 text-gray-500" />
              <div className="w-full pr-1 truncate">
                <h1 className="text-xl text-gray-500">Ledig plads</h1>
              </div>
              <div className="bg-gray-500 text-white rounded-full flex items-center justify-center w-20 h-12">
                ?
              </div>
            </div>
          ))}

          <div className="grid grid-cols-3 text-center text-black gap-3">
            <div className="bg-white rounded h-16 flex justify-center items-center gap-1">
              <BoltIcon className="h-6 text-yellow-500" />
              <h1>{match.level}</h1>
            </div>

            <div className="bg-white rounded flex justify-center items-center gap-1">
              <MapPinIcon className="h-6 text-red-500" />
              <h1>{match.location}</h1>
            </div>

            <div className="bg-white rounded h-16 flex justify-center items-center gap-1">
              <UserGroupIcon className="h-6 rounded-lg text-white bg-gradient-to-b from-sky-400 to-pink-400" />
              <h1>
                {match.description.includes("Herre")
                  ? "Herre"
                  : match.description}
              </h1>
            </div>
          </div>

          <div className="bg-white rounded w-full text-black p-4 flex flex-col gap-2">
            <h1 className="font-semibold">Bemærkninger</h1>
            <p>{match.description || "Ingen bemærkninger."}</p>
          </div>

          {/* Action buttons */}
          {match.username !== username &&
            username &&
            !match.participants.includes(username) &&
            !match.joinRequests.includes(username) && (
              <button
                onClick={handleJoinMatch}
                className="bg-cyan-500 hover:bg-cyan-600 transition duration-300 rounded-lg py-2 px-4 text-white"
              >
                Tilmeld kamp
              </button>
            )}

          {match.username === username && (
            <button
              onClick={handleDeleteMatch}
              className="bg-red-500 hover:bg-red-600 transition duration-300 rounded-lg py-2 px-4 text-white"
            >
              Slet kamp
            </button>
          )}
        </div>
      </Animation>
    </>
  );
};

export default ViewMatchPage;
