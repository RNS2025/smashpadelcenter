import { useState, useEffect } from "react";
import rankedInService from "../services/rankedIn";
import Tournament from "../types/Tournament";

const useTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [loading, setLoading] = useState({ tournaments: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading((prev) => ({ ...prev, tournaments: true }));
        const fetchedTournaments =
          await rankedInService.getAvailableTournaments();
        setTournaments(fetchedTournaments);
        if (fetchedTournaments.length > 0) {
          setSelectedTournament(fetchedTournaments[0]);
        }
      } catch (err) {
        setError("Error fetching tournaments.");
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, tournaments: false }));
      }
    };

    fetchTournaments().then();
  }, []);

  // Expose a function to update selectedTournament
  const selectTournament = (tournament: Tournament | null) => {
    setSelectedTournament(tournament);
  };

  return { tournaments, selectedTournament, selectTournament, loading, error };
};

export default useTournaments;
