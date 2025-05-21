import Player from "./Player";

export interface SetScore {
  FirstParticipantScore: number;
  SecondParticipantScore: number;
  LoserTiebreak: number | null;
  DetailedScoring: null;
  IsFirstParticipantWinner: boolean;
  LabelClass: string;
}

export interface MatchScore {
  FirstParticipantScore: number;
  SecondParticipantScore: number;
  LoserTiebreak: number | null;
  DetailedScoring: SetScore[] | null;
  IsFirstParticipantWinner: boolean;
  LabelClass: string;
}

interface Match {
  matchId: number;
  round: number;
  date: string | null;
  courtName: string | null;
  durationMinutes: number | null;
  challenger: {
    id?: string;
    firstPlayer: Player;
    secondPlayer: Player | null;
  };
  challenged: {
    id?: string;
    firstPlayer: Player;
    secondPlayer: Player | null;
  };
  score: MatchScore | null;
  isPlayed: boolean;
  winnerParticipantId: number | null;
  matchType: "Elimination" | "RoundRobin";
  TournamentClassName: string;
}

export default Match;
