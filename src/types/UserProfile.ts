export interface Match {
  id: string;
  date: string;
  opponent: string;
  score: string;
  result: "win" | "loss" | "pending" | "unknown";
}

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl: string;
  skillLevel: number;
  position: "left" | "right" | "both";
  playingStyle: string;
  equipment: string;
  role: "user" | "admin" | "trainer";
  pastMatches: Match[];
  stats: {
    matches: number;
    wins: number;
    losses: number;
  };
}
