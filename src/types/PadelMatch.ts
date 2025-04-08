interface PadelMatch {
  id: number;
  username: string;
  title: string;
  description: string;
  level: number;
  participants: string[];
  joinRequests: string[];
  reservedSpots: number[];
  totalSpots: number;
  createdAt: string;
  matchDateTime: string;
  courtBooked: boolean;
}

export type { PadelMatch };
