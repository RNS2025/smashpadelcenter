interface PadelMatch {
  id: string;
  username: string;
  description: string;
  level: string;
  participants: string[];
  joinRequests: string[];
  reservedSpots: number[];
  totalSpots: number;
  createdAt: string;
  matchDateTime: string;
  startTime: string;
  endTime: string;
  courtBooked: boolean;
  location: string;
}

export type { PadelMatch };
