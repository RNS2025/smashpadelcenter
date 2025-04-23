interface PadelArrangment {
  id: string;
  username: string;
  description: string;
  level: string; // Optional
  participants: string[];
  joinRequests: string[];
  totalSpots: number;
  createdAt: string;
  matchDateTime: string;
  startTime: string;
  endTime: string;
  courtBooked: boolean;
  location: string;
  matchType: string;
  visibility: string; // Private or Public controls who can see the arrangement
  accessUrl: string; // Optional
}

export type { PadelArrangment };
