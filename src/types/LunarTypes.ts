export interface League {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
}

export interface Team {
    id: number;
    name: string;
}

export interface TeamInfo {
    id: number;
    name: string;
    playersCount: number;
    division: string;
    region: string;
    rating: number;
}

export interface TeamDetailsResponse {
    Team: TeamDetails;
    PoolId: number;
    SportId: number;
    CountryId: number;
    StateMessage: string;
    TeamLeagueId: number;
    TeamLeagueName: string;
}


export interface TeamDetails {
    Id: number;
    CurrentPlayerId: number;
    Name: string;
    RankedinId: string;
    IsTournamentAdmin: boolean;
    IsTeamAdmin: boolean;
    IsTeamParticipant: boolean;
    Initiator: {
        Id: number;
        Name: string;
        PlayerUrl: string;
    }[];
    Players: Player[];
    HomeClub: Club;
    HomeClubImageUrl: string;
    TeamManagerUrl: string;
    ContactBaseUrl: string;
    IsLicenseRequired: boolean;
    StateMessage: string;
    MaxTeamPower: number;
    HasRating: boolean;
    ClassId: number;
}

export interface Player {
    Id: number;
    FirstName: string;
    MiddleName: string | null;
    LastName: string | null;
    PlayerOrder: number;
    CountryFlag: string;
    Image: string | null;
    TeamParticipantType: "Player" | "Captain";
    IsFake: boolean;
    RankedinId: string;
    HomeClub: Club;
    PlayerUrl: string;
    HasLicense: boolean;
    RatingBegin: number;
}

export interface Club {
    Id: number;
    Name: string;
    CountryShort: string | null;
    City: string;
    Country: string | null;
    Address: string | null;
    Url: string;
}

export interface TeamStandingsResponse {
    EventType: number;
    PoolId: number;
    IsForTeamsStandings: boolean;
    IsForTeamMatchStandings: boolean;
    Sport: number;
    ScoresViewModels: TeamStanding[];
}

export interface TeamStanding {
    TeamGamesWon: number;
    TeamGamesLost: number;
    TeamGamesDifference: number;
    Player1Rating: number | null;
    Player2Rating: number | null;
    DoublesPlayer1Model: any | null;
    DoublesPlayer2Model: any | null;
    ParticipantId: number;
    PlayerRankedinId: string;
    ParticipantType: number;
    Standing: number;
    MatchPoints: number;
    Wins: number;
    Losses: number;
    CancellationLosses: number;
    Draws: number;
    GamesWon: number;
    GamesLost: number;
    ScoredPoints: number;
    ConcededPoints: number;
    MatchesDifference: number;
    GamesDifference: number;
    PointsDifference: number;
    ParticipantName: string;
    Played: number;
    ParticipantUrl: string;
    Sport: number;
    MaxTeamPowerRating: number;
}

export interface TeamMatch {
    Team1: {
        Url: string;
        IsWinner: boolean;
        Name: string;
        Result: number;
        Id: number;
        AverageRating: number | null;
    };
    Team2: {
        Url: string;
        IsWinner: boolean;
        Name: string;
        Result: number;
        Id: number;
        AverageRating: number | null;
    };
    ShowIcons: boolean;
    ShowAdminEnterResultButton: boolean;
    ShowUpcomingInfoText: boolean;
    ShowCanceledInfoText: boolean;
    ShowNoActionsAvailableInfoText: boolean;
    ShowPlayerEnterResultButton: boolean;
    ShowPreviewCanceledMatchButton: boolean;
    ShowResults: boolean;
    Url: string;
    AllowTeamsToChangeMatchDateAndLocation: boolean;
    Location: string;
    Date: string;
    Details: {
        LocationName: string;
        City: string | null;
        Address: string | null;
        Time: string;
        CountryCode: number;
        Date: string;
        Round: number;
    };
    MatchId: number;
    CanEditDateAndLocation: boolean;
}

export interface MatchDetails {
    Settings: {
        MatchType: number;
        MatchesCount: number;
        MatchOrder: number;
    };
    Matches: {
        Matches: Array<{
            Id: number;
            Date: string;
            Challenger: {
                Name: string;
                Player2Name: string | null;
                CountryShort: string;
                Player2CountryShort: string;
                Player1Id: number;
                Player2Id: number;
                Player1Url: string;
                Player2Url: string;
                Player1RatingBegin: number | null;
                Player2RatingBegin: number | null;
                RatingPower: number;
            };
            Challenged: {
                Name: string;
                Player2Name: string | null;
                CountryShort: string;
                Player2CountryShort: string;
                Player1Id: number;
                Player2Id: number;
                Player1Url: string;
                Player2Url: string;
                Player1RatingBegin: number | null;
                Player2RatingBegin: number | null;
                RatingPower: number;
            };
            MatchResult: {
                Score: {
                    FirstParticipantScore: number;
                    SecondParticipantScore: number;
                    LoserTiebreak: number | null;
                    DetailedScoring: Array<{
                        FirstParticipantScore: number;
                        SecondParticipantScore: number;
                        LoserTiebreak: number | null;
                        DetailedScoring: null;
                        IsFirstParticipantWinner: boolean;
                        LabelClass: string | null;
                    }> | null;
                    IsFirstParticipantWinner: boolean;
                    LabelClass: string | null;
                } | null;
                TotalDurationInMinutes: number | null;
                CancellationStatus: string | null;
                IsFirstParticipantWinner: boolean;
                HasScore: boolean;
                HasCancellation: boolean;
                HasDetailedScore: boolean;
                IsPlayed: boolean;
            } | null;
            State: number;
            ShowDate: boolean;
            ShowThreeDots: boolean;
            ShowResult: boolean;
            AwaitingAcceptDate: boolean;
            AcceptDateButton: boolean;
            SetDateButton: boolean;
            EditChallengeButton: boolean;
            IsMatchScheduled: boolean;
            EnterResultsButton: boolean;
            Cancellation: number | null;
            IsTeamMatchInPlay: boolean;
            RankingType: number;
        }>;
        EventId: number;
        EventType: number;
        CurrentPlayerId: number;
        EventInitiatorId: number;
        IsEventFinished: boolean;
    };
}