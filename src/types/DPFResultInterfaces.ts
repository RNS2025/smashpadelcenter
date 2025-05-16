export interface RawPlayerInfo {
  Name: string;
  Player2Name?: string;
  CountryShort: string;
  Player2CountryShort?: string;
  Player1Id: number;
  Player2Id?: number;
  Player1Url: string;
  Player2Url?: string;
}

export interface RawMatchResultScore {
  FirstParticipantScore: number;
  SecondParticipantScore: number;
  LoserTiebreak: number | null;
  DetailedScoring: any[] | null;
  IsFirstParticipantWinner: boolean;
}

export interface RawMatchResult {
  Score: RawMatchResultScore;
  TotalDurationInMinutes: number | null;
  CancellationStatus: any | null;
  IsFirstParticipantWinner: boolean;
  HasScore: boolean;
  HasCancellation: boolean;
  HasDetailedScore: boolean;
  IsPlayed: boolean;
}

export interface RawMatch {
  Id: number;
  Date: string;
  Challenger: RawPlayerInfo;
  Challenged: RawPlayerInfo;
  TournamentClassName: string;
  Draw: string;
  Court: string;
  State: number;
  AwaitingAcceptDate: boolean;
  SetDateButton: boolean;
  AcceptDateButton: boolean;
  EditChallengeButton: boolean;
  ShowDate: boolean;
  IsMatchScheduled: boolean;
  ShowResult: boolean;
  Cancellation: any | null;
  MatchResult: RawMatchResult | null;
  AwaitingResultConfirmation: boolean;
  RankingType: number;
  IsTeamMatchInPlay: boolean;
  AcceptResultButton: boolean;
  EnterResultsButton: boolean;
  IsLineupPublished: boolean;
  LineupPublicationRequired: boolean;
}

export interface RankedInEvent {
  type: number;
  eventId: number;
  eventName: string;
  eventUrl: string;
  club: string;
  city: string;
  isPremium: boolean | null;
  startDate: string;
  endDate: string;
  eventState: number;
  joinUrl: string;
}

export interface OrganizationEventsApiResponse {
  payload: RankedInEvent[];
  totalCount: number;
}
