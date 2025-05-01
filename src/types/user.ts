export interface Match {
  id: string;
  date: string;
  opponent: string;
  score: string;
  result: "win" | "loss" | "pending" | "unknown";
}

export interface User {
  id: string;
  rankedInId?: string;
  username: string;
  email: string;
  role: string;
  provider: string;
  fullName: string;
  phoneNumber: string;
  profilePictureUrl: string;
  skillLevel: number;
  position: string;
  playingStyle: string;
  equipment: string;
  pastMatches: Match[];
  stats: {
    matches: number;
    wins: number;
    losses: number;
  };
  groups?: {
    id: string;
    name: string;
    members: string[];
  }[];
}
