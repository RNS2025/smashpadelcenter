export interface PadelMatch {
  id: string;
  username: string; // Creator
  description: string;
  level: string; // e.g., "2.0 - 3.0"
  participants: string[];
  joinRequests: string[];
  reservedSpots: { name: string; level: string }[];
  totalSpots: number;
  createdAt: string;
  matchDateTime: string; // ISO string
  startTime: string;
  endTime: string;
  courtBooked: boolean;
  location: string;
  matchType: string; // e.g., "Herre", "Dame", "Mix", "Blandet"
  score: string;
  result: "win" | "loss" | "pending" | "unknown";
}
