import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import rankedInService from "../../../services/rankedIn.ts";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";

export const TournamentRegulationsTab = () => {
  const [regulations, setRegulations] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournamentAndRegulations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Fetch the upcoming tournament
        const tournament = await rankedInService.getUpcomingTournament();
        if (!tournament) {
          throw new Error("Ingen kommende turnering fundet");
        }

        // Step 2: Extract tournament ID from the URL
        const matches = tournament.eventUrl.match(/\/(\d+)\//);
        const tournamentId = matches && matches[1] ? matches[1] : null;

        if (!tournamentId) {
          throw new Error("Kunne ikke finde turneringens ID");
        }

        console.log(`Fetching regulations for tournament ID: ${tournamentId}`);

        // Step 3: Fetch the regulations for this tournament
        const response = await fetch(
          `https://api.rankedin.com/v1/tournament/GetRegulationsAsync?id=${tournamentId}`
        );
        if (!response.ok) {
          throw new Error(`API fejl: ${response.status}`);
        }

        const text = await response.text();
        const cleanedText = text
          .replace(/^"|"$/g, "")
          .replace(/\\"/g, '"')
          .replace(/\\n/g, "");

        if (!cleanedText || cleanedText.trim() === "") {
          setRegulations(
            "<p>Ingen turneringsregler tilgængelige for denne turnering.</p>"
          );
        } else {
          setRegulations(cleanedText);
        }
      } catch (error) {
        console.error("Error fetching regulations:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Der opstod en fejl ved indlæsning af turneringsregler"
        );
        setRegulations("");
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentAndRegulations();
  }, []);

  return (
    <>
      <Helmet>
        <title>Turneringsregler</title>
      </Helmet>

      {loading ? (
        <div className="flex justify-center items-center p-10">
          <LoadingSpinner />
          <span className="ml-3">Indlæser turneringsregler...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-red-500">
          <p className="font-semibold">Fejl:</p>
          <p>{error}</p>
        </div>
      ) : (
        <div
          className="p-4 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: regulations }}
        />
      )}
    </>
  );
};

export default TournamentRegulationsTab;
