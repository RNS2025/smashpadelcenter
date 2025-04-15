interface PadelMatch {
  id: string;
  username: string;
  description: string;
  level: string;
  participants: string[];
  joinRequests: string[];
  reservedSpots: {
    id?: string
    name: string;
    level: string
  }[];
  totalSpots: number;
  createdAt: string;
  matchDateTime: string;
  startTime: string;
  endTime: string;
  courtBooked: boolean;
  location: string;
  matchType: string;
}

export type { PadelMatch };