interface PrivateEvent {
  id: string;
  username: string;
  title: string
  description?: string;
  eventFormat?: string;
  totalSpots: number;
  courtBooked: boolean;
  eventDateTime: string;
  startTime: string;
  endTime: string;
  location: string;
  level?: string;
  openRegistration: boolean;
  participants: string[];
  joinRequests: string[];
  createdAt: string;
  accessUrl: string;
}

export type { PrivateEvent };
