interface Tournament {
  eventId: number;
  eventName: string;
  eventUrl: string;
  club: string;
  city: string;
  isPremium: boolean;
  startDate: string;
  endDate: string;
  eventState: number;
  joinUrl: string;
}

export default Tournament;
