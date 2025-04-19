interface DpfMatch {
  Id: number;
  Date: string | null;
  Challenger: {
    Name: string;
    Player2Name: string | null;
    CountryShort: string;
    Player2CountryShort: string | null;
    Player1Id: number;
    Player2Id: number | null;
    Player1Url: string;
    Player2Url: string | null;
  };
  Challenged: {
    Name: string;
    Player2Name: string | null;
    CountryShort: string;
    Player2CountryShort: string | null;
    Player1Id: number;
    Player2Id: number | null;
    Player1Url: string;
    Player2Url: string | null;
  };
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
  MatchResult: {
    Score: string | null;
    TotalDurationInMinutes: number | null;
    CancellationStatus: any | null;
    IsFirstParticipantWinner: boolean | null;
    HasScore: boolean;
    HasCancellation: boolean;
    HasDetailedScore: boolean;
    IsPlayed: boolean;
  };
  AwaitingResultConfirmation: boolean;
  RankingType: number;
  IsTeamMatchInPlay: boolean;
  AcceptResultButton: boolean;
  EnterResultsButton: boolean;
  IsLineupPublished: boolean;
  LineUpPublicationRequired: boolean;
}

export default DpfMatch;
