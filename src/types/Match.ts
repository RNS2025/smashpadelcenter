import Player from "./Player";

interface Match {
  matchId: number;
  round: number;
  date: string | null;
  courtName: string | null;
  durationMinutes: number | null;
  challenger: {
    id: string;
    firstPlayer: Player;
    secondPlayer: Player | null;
  };
  challenged: {
    firstPlayer: Player;
    secondPlayer: Player | null;
  };
  score: string | null;
  isPlayed: boolean;
  winnerParticipantId: number | null;
  matchType: "Elimination" | "RoundRobin";
}

export default Match;
