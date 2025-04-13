interface PadelMatch {
  id: number;
  username: string;
  title?: string;
  //TODO: Er title nogensinde relevant?
  description: string;
  level: number;
  //TODO: Det bør nok være en string der tager et interval, f.eks. "2.5-3.5"
  participants: string[];
  joinRequests: string[];
  reservedSpots: number[];
  totalSpots: number;
  createdAt: string;
  matchDateTime: string;
  //TODO: Vil rigtig gerne at vi har start- og sluttidspunkt som separate felter
  courtBooked: boolean;
  //TODO: Mangler spillested
}

export type { PadelMatch };
