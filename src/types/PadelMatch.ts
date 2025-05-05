export interface PadelMatch {
  id: string;
  username: string; // Creator
  description: string;
  level: string; // e.g., "2.0 - 3.0"
  participants: string[];
  joinRequests: string[];
  invitedPlayers: string[];
  reservedSpots: { name: string; level: string }[];
  totalSpots: number;
  createdAt: string;
  matchDateTime: string; // ISO string
  startTime: string;
  endTime: string;
  courtBooked: boolean;
  location: string;
  matchType: string; // e.g., "Herre", "Dame", "Mix", "Blandet"
  score?: {
    firstSet?: {
      score: string;
      tieBreak?: string;
    }
    secondSet?: {
      score: string;
      tieBreak?: string;
    }
    thirdSet?: {
      score: string;
      tieBreak?: string;
    }
    fourthSet?: {
      score: string;
      tieBreak?: string;
    }
    fifthSet?: {
      score: string;
      tieBreak?: string;
    }
  }
  team1Sets?: number;
  team2Sets?: number;
  winningTeam?: string[];
  losingTeam?: string[];
  playersConfirmedResult: string[];
  deadline?: string;
}
