// Assuming this is in your interfaces.ts file

export interface OrganisationEvent {
  // ... existing properties
  eventId: number; // Assuming this is the property used for ID
  eventName: string; // Assuming this is the property used for name
}

export interface OrganisationEventsResponse {
  payload: OrganisationEvent[];
  // ... other properties
}

export interface Team {
  Url: string;
  IsWinner: boolean;
  Name: string;
  Result: number;
  Id: number;
  AverageRating: number; // Assuming type
  // ... other properties
}

export interface Match {
  Team1: Team;
  Team2: Team;
  ShowResults: boolean;
  Url: string;
  Location: string;
  Date: string; // Could be date or time string
  Details: {
    LocationName: string;
    City: string;
    Address: string;
    Time: string; // Full date/time string
    Date: string; // Date string
    Round: number;
    CountryCode: number; // Assuming type
  };
  MatchId: number;
  CanEditDateAndLocation: boolean; // Assuming type
  // ... other properties
}

export interface Round {
  RoundNumber: number;
  Matches: Match[];
  RoundDate: string; // Assuming date string
  // ... other properties
}

export interface MatchesSectionModel {
  Rounds: Round[];
  // ... other properties in MatchesSectionModel if any
}

export interface Pool {
  Id: number;
  Name: string;
  Matches?: Match[]; // Matches might be included here or fetched separately
  // Add other pool properties if needed, e.g., LeagueId etc.
}

export interface PoolsInfoResponse {
  Pools: Pool[];
  // ... other properties in PoolsInfoResponse
}

// --- New Interfaces for General Standings ---

// Interface for each team's row in the general standing table (from ScoresViewModels)
export interface TeamStanding {
  Standing: number;
  ParticipantUrl: string;
  ParticipantName: string;
  MatchPoints: number; // Points gained from matches
  Played: number;
  Draws: number;
  Wins: number;
  Losses: number;
  GamesWon: number; // Games won (e.g., individual sets)
  GamesLost: number; // Games lost (e.g., individual sets)
  GamesDifference: number; // GamesWon - GamesLost
  TeamGamesWon: number; // Points/Games won at the team match level (e.g., total sets won by the team across all their matches)
  TeamGamesLost: number; // Points/Games lost at the team match level
  TeamGamesDifference: number; // TeamGamesWon - TeamGamesLost
  ScoredPoints: number; // Total points scored across all games
  ConcededPoints: number; // Total points conceded across all games
  PointsDifference: number; // ScoredPoints - ConcededPoints
  ParticipantId: number;
  MaxTeamPowerRating: number; // Assuming type
  // ... add other properties if they exist and are needed
}

// Interface for the main Standings object within the API response
export interface StandingsModel {
  EventType: number; // Assuming type
  PoolId: number; // Assuming type
  IsForTeamsStandings: boolean; // Assuming type
  IsForTeamMatchStandings: boolean; // Assuming type
  Sport: number; // Assuming type
  ScoresViewModels: TeamStanding[]; // This is the array of team standings
  // Add other properties in Standings if any
}

// Update the main response interface for the GetStandingsSectionAsync call
export interface StandingsResponse {
  MatchesSectionModel: MatchesSectionModel; // Keep the existing match data
  Standings: StandingsModel; // Add the general standings data
  // Add other top-level properties if any
}

export interface GroupedPools {
  [groupName: string]: Pool[];
}
