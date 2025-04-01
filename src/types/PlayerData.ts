interface PlayerData {
  Header?: {
    PlayerId: number;
    ImageThumbnailUrl?: string;
    FullName: string;
    RankedinId: string;
    HomeClubName?: string;
    HomeClubUrl?: string;
    CountryShort?: string;
    Age?: string;
    Form?: string[];
    IsProPlayer?: boolean;
  };
  Statistics?: {
    WinLossDoublesCurrentYear: string;
    EventsParticipatedDoublesCurrentYear: string;
    CareerWinLossDoubles: string;
    CareerEventsParticipatedDoubles: string;
  };
}

export default PlayerData;
