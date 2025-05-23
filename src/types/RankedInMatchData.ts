export interface ScoreSet {
    FirstParticipantScore: number;
    SecondParticipantScore: number;
    LoserTiebreak: string | null;
    DetailedScoring: null;
    IsFirstParticipantWinner: boolean;
    LabelClass: string;
}

export interface MatchScore {
    FirstParticipantScore: number;
    SecondParticipantScore: number;
    LoserTiebreak: string | null;
    DetailedScoring: ScoreSet[];
    IsFirstParticipantWinner: boolean;
    LabelClass: string;
}

export interface MatchViewModel {
    Score: MatchScore;
    TotalDurationInMinutes: number | null;
    CancellationStatus: any; // Define this if needed
    IsFirstParticipantWinner: boolean;
    HasScore: boolean;
    HasCancellation: boolean;
    HasDetailedScore: boolean;
    IsPlayed: boolean;
}

export interface Player {
    Id: number;
    RankedinId: string;
    Name: string;
    CountryShort: string;
    PlayerUrl: string;
    ParticipantType: number;
    RatingBegin: number;
    RatingEnd: number;
}

export interface Participant {
    EventParticipantId: number;
    FirstPlayer: Player;
    SecondPlayer: Player;
    ParticipantType: number;
    IsQualifier: boolean;
    Seed: string;
    Cancelation: string;
    HasCancelation: boolean;
    EventParticipantType: number;
    DrawId: number;
}

export interface Popover {
    ChallengeId: number;
    MatchId: number;
    EnterResult: boolean;
    EditResult: boolean;
    NotPlayedButton: boolean;
    ScoreBoard: boolean;
    IsTeamPopover: boolean;
    TeamMatchState: number;
    SubstitutablePlayers: any[];
    ResetButton: boolean;
    ConfirmResult: boolean;
    LiveBaseUrl: string;
    CanSchedule: boolean;
    HasByeOrPendingPlayer: boolean;
    DrawId: number;
    ShouldShowSubstitute: boolean;
    ShowH2H: boolean;
    SetDate: boolean;
    EnterResultTeamChampionship: boolean;
}

export interface Match {
    MatchViewModel: MatchViewModel;
    Round: number;
    MaxRound: number;
    TournamentClassId: number;
    ChallengerParticipant: Participant;
    ChallengedParticipant: Participant;
    CourtName: string;
    IsInRedZone: boolean;
    Date: string;
    IsReadOnly: boolean;
    DrawType: number;
    HasQualifiers: boolean;
    MatchOrder: number;
    ChallengeId: number;
    WinnerParticipantId: number;
    MatchState: number;
    MatchId: number;
    IsPublished: boolean;
    IsClassScheduled: boolean;
    IsForTeams: boolean;
    ShouldShowSchedule: boolean;
    ShowThreeDots: boolean;
    Popover: Popover;
}

export interface Elimination {
    DrawData: Match[][];
}

export interface TournamentResponse {
    BaseType: "Elimination";
    RatingId: number;
    RoundRobin: null;
    Elimination: Elimination;
}

export interface DrawCell extends Match {
    Round: number;
}

export interface Elimination {
    DrawData: Match[][]; // Behold denne til bagudkompatibilitet
    DrawCells?: DrawCell[];
    Height?: number;
    Width?: number;
    PlacesStartPos?: number;
    PlacesEndPos?: number;
}
