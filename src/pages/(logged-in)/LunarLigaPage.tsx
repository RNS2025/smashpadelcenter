import React, { useEffect, useState } from "react";
import {
  fetchLeaguesHorsens,
  fetchLeaguesStensballe,
  fetchTeamsByLeagueHorsens,
  fetchTeamsByLeagueStensballe,
  fetchTeamInfo,
  fetchTeamStandings,
  fetchTeamMatches,
  fetchMatchDetails,
} from "../../services/LigaService";

interface League {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

interface Team {
  id: number;
  name: string;
}

interface TeamInfo {
  Team: TeamDetails;
  PoolId: number;
  SportId: number;
  CountryId: number;
  StateMessage: string;
  TeamLeagueId: number;
  TeamLeagueName: string;
}

interface TeamDetails {
  Id: number;
  CurrentPlayerId: number;
  Name: string;
  RankedinId: string;
  IsTournamentAdmin: boolean;
  IsTeamAdmin: boolean;
  IsTeamParticipant: boolean;
  Initiator: Player[];
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

interface Player {
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

interface Club {
  Id: number;
  Name: string;
  CountryShort: string | null;
  City: string;
  Country: string | null;
  Address: string | null;
  Url: string;
}

interface TeamStandingsResponse {
  EventType: number;
  PoolId: number;
  IsForTeamsStandings: boolean;
  IsForTeamMatchStandings: boolean;
  Sport: number;
  ScoresViewModels: TeamStanding[];
}

interface TeamStanding {
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

interface TeamMatch {
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

interface MatchDetails {
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

type TeamMatches = TeamMatch[];
type MatchDetailsArray = MatchDetails[];

const TABS = ["Leagues", "Teams", "Team Info", "Standings", "Matches"];

const LunarLigaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Leagues");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatchDetails, setSelectedMatchDetails] =
    useState<MatchDetailsArray | null>(null);

  const [leaguesHorsens, setLeaguesHorsens] = useState<League[]>([]);
  const [leaguesStensballe, setLeaguesStensballe] = useState<League[]>([]);

  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);
  const [selectedLeagueRegion, setSelectedLeagueRegion] = useState<
    "horsens" | "stensballe" | null
  >(null);
  const [selectedLeagueName, setSelectedLeagueName] = useState<string>("");

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string>("");

  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [standings, setStandings] = useState<TeamStandingsResponse | null>(
    null
  );
  const [matches, setMatches] = useState<TeamMatches>([]);

  useEffect(() => {
    if (activeTab === "Leagues") {
      fetchLeaguesHorsens().then(setLeaguesHorsens);
      fetchLeaguesStensballe().then(setLeaguesStensballe);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "Teams" && selectedLeagueId && selectedLeagueRegion) {
      if (selectedLeagueRegion === "horsens") {
        fetchTeamsByLeagueHorsens(selectedLeagueId).then(setTeams);
      } else if (selectedLeagueRegion === "stensballe") {
        fetchTeamsByLeagueStensballe(selectedLeagueId).then(setTeams);
      }
    }
  }, [activeTab, selectedLeagueId, selectedLeagueRegion]);

  useEffect(() => {
    if (activeTab === "Team Info" && selectedTeamId) {
      fetchTeamInfo(selectedTeamId).then(setTeamInfo);
    }
  }, [activeTab, selectedTeamId]);

  useEffect(() => {
    if (activeTab === "Standings" && selectedTeamId) {
      fetchTeamStandings(selectedTeamId).then(setStandings);
    }
  }, [activeTab, selectedTeamId]);

  useEffect(() => {
    if (activeTab === "Matches" && selectedTeamId) {
      fetchTeamMatches(selectedTeamId).then(setMatches);
    }
  }, [activeTab, selectedTeamId]);

  const handleLeagueSelect = (
    league: League,
    region: "horsens" | "stensballe"
  ) => {
    setSelectedLeagueId(league.id);
    setSelectedLeagueRegion(region);
    setSelectedLeagueName(league.name);
    setSelectedTeamId(null);
    setSelectedTeamName("");
    setActiveTab("Teams");
  };

  const handleShowMatchDetails = async (matchId: number) => {
    try {
      const details = await fetchMatchDetails(matchId);
      console.log("Fetched match details:", details); // Should log the array
      setSelectedMatchDetails(details); // Set the array
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching match details:", error);
      setSelectedMatchDetails([]); // Fallback to empty array
      setIsModalOpen(true);
    }
  };
  const handleTeamSelect = (team: Team) => {
    setSelectedTeamId(team.id);
    setSelectedTeamName(team.name);
    setActiveTab("Team Info");
  };

  const formatDate = (dateString: string) => {
    // Ensure dateString has both date and time parts
    if (!dateString || !dateString.includes(" ")) {
      console.error("Invalid date string:", dateString);
      return "Invalid date";
    }

    const [datePart, timePart] = dateString.split(" ");

    // Check if datePart and timePart are valid
    if (!datePart || !timePart) {
      console.error("Invalid date or time part:", dateString);
      return "Invalid date";
    }

    const [day, month, year] = datePart.split("/");
    const [hour, minute] = timePart.split(":");

    // Create a new Date object
    const matchDate = new Date(
      parseInt(year), // year
      parseInt(month) - 1, // month (0-based index)
      parseInt(day), // day
      parseInt(hour), // hour
      parseInt(minute) // minute
    );
    // Format the date to a string
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short", // 'Mon', 'Tue', etc.
      year: "numeric",
      month: "short", // 'Jan', 'Feb', etc.
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format
    };

    return matchDate.toLocaleString("en-GB", options); // You can adjust locale as needed
  };

  const getMatchStatus = (dateString: string) => {
    // Split the dateString to get day, month, year, and time
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("/");
    const [hour, minute] = timePart.split(":");

    // Create a new Date object
    const matchDate = new Date(
      parseInt(year), // year
      parseInt(month) - 1, // month (0-based index, so subtract 1)
      parseInt(day), // day
      parseInt(hour), // hour
      parseInt(minute) // minute
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (matchDate < today) return "past";
    if (matchDate.toDateString() === today.toDateString()) return "today";
    return "upcoming";
  };

  // Example usage:
  const matchStatus = getMatchStatus("01/03/2025 09:00");
  console.log(matchStatus);

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center mb-4 text-sm text-gray-600">
        <span
          className="cursor-pointer hover:text-blue-600"
          onClick={() => setActiveTab("Leagues")}
        >
          Leagues
        </span>

        {selectedLeagueId && (
          <>
            <span className="mx-2">/</span>
            <span
              className="cursor-pointer hover:text-blue-600"
              onClick={() => setActiveTab("Teams")}
            >
              {selectedLeagueName} ({selectedLeagueRegion})
            </span>
          </>
        )}

        {selectedTeamId && (
          <>
            <span className="mx-2">/</span>
            <span>{selectedTeamName}</span>
          </>
        )}
      </div>
    );
  };

  function getFlagEmoji(CountryFlag: string): React.ReactNode {
    return CountryFlag.toUpperCase().replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">
        Lunar Liga Dashboard
      </h1>

      {renderBreadcrumbs()}

      <div className="flex flex-wrap mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`mr-2 mb-2 px-6 py-2 rounded-lg transition-colors duration-200 ${
              activeTab === tab
                ? "bg-blue-600 text-grey shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab)}
            disabled={
              (tab === "Teams" && !selectedLeagueId) ||
              ((tab === "Team Info" ||
                tab === "Standings" ||
                tab === "Matches") &&
                !selectedTeamId)
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Leagues" && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 border-b pb-2">
              Horsens Leagues
            </h2>
            <div className="space-y-2">
              {leaguesHorsens.length === 0 ? (
                <p className="text-gray-500 italic">Loading leagues...</p>
              ) : (
                leaguesHorsens.map((league) => (
                  <div
                    key={`league-horsens-${league.id}`}
                    className="cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    onClick={() => handleLeagueSelect(league, "horsens")}
                  >
                    <div className="font-medium text-blue-700">
                      {league.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="mr-2">
                        Start: {new Date(league.startDate).toLocaleDateString()}
                      </span>
                      <span>
                        End: {new Date(league.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-green-800 border-b pb-2">
              Stensballe Leagues
            </h2>
            <div className="space-y-2">
              {leaguesStensballe.length === 0 ? (
                <p className="text-gray-500 italic">Loading leagues...</p>
              ) : (
                leaguesStensballe.map((league) => (
                  <div
                    key={`league-stensballe-${league.id}`}
                    className="cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors"
                    onClick={() => handleLeagueSelect(league, "stensballe")}
                  >
                    <div className="font-medium text-green-700">
                      {league.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="mr-2">
                        Start: {new Date(league.startDate).toLocaleDateString()}
                      </span>
                      <span>
                        End: {new Date(league.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Teams" && (
        <div className="bg-gray-50 p-6 rounded-lg shadow text-grey-900">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">
            {selectedLeagueRegion === "horsens" ? (
              <span className="text-blue-800">
                Teams in {selectedLeagueName}
              </span>
            ) : (
              <span className="text-green-800">
                Teams in {selectedLeagueName}
              </span>
            )}
          </h2>

          {teams.length === 0 ? (
            <p className="text-gray-500 italic">
              {selectedLeagueId
                ? "Loading teams..."
                : "Please select a league from the Leagues tab first."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-grey-900">
              {teams.map((team) => (
                <div
                  key={`team-${team.id}`}
                  className="cursor-pointer p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
                  onClick={() => handleTeamSelect(team)}
                >
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    ID: {team.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Team Info" && (
        <div className="bg-gray-50 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Team Information
          </h2>

          {!teamInfo ? (
            <p className="italic">
              {selectedTeamId
                ? "Loading team information..."
                : "Select a team to see details."}
            </p>
          ) : (
            <div className="space-y-6 text-gray-700">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <h3 className="text-lg font-medium mb-3 text-blue-700">
                    General Information
                  </h3>
                  <h3 className="text-lg font-medium mb-3 text-blue-700">
                    Home Club
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2">
                      <span className="font-medium">Team Name:</span>{" "}
                      {teamInfo.Team.Name}
                    </p>
                    <p className="mb-2">
                      <span className="font-medium">League:</span>{" "}
                      {teamInfo.TeamLeagueName}
                    </p>
                  </div>
                  <div>
                    {teamInfo.Team.HomeClub ? (
                      <>
                        <p className="mb-2">
                          <span className="font-medium">Club Name:</span>{" "}
                          {teamInfo.Team.HomeClub.Name}
                        </p>
                        <p className="mb-2">
                          <span className="font-medium">City:</span>{" "}
                          {teamInfo.Team.HomeClub.City}
                        </p>
                        {teamInfo.Team.HomeClub.Country && (
                          <p className="mb-2">
                            <span className="font-medium">Country:</span>{" "}
                            {teamInfo.Team.HomeClub.Country}
                          </p>
                        )}
                        {teamInfo.Team.HomeClub.Address && (
                          <p className="mb-2">
                            <span className="font-medium">Address:</span>{" "}
                            {teamInfo.Team.HomeClub.Address}
                          </p>
                        )}
                      </>
                    ) : (
                      <p>No home club information available.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-3 text-blue-700">
                  Players
                </h3>
                {teamInfo.Team.Players && teamInfo.Team.Players.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Club
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teamInfo.Team.Players.map((player) => (
                          <tr
                            key={`player-${player.Id}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {player.CountryFlag && (
                                  <span className="mr-2 text-xl">
                                    {getFlagEmoji(player.CountryFlag)}
                                  </span>
                                )}
                                <div>
                                  {`${player.FirstName} ${
                                    player.MiddleName || ""
                                  } ${player.LastName || ""}`}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  player.TeamParticipantType === "Captain"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {player.TeamParticipantType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {player.HomeClub?.Name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No player information available.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Standings" && (
        <div className="bg-gray-50 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Team Standings
          </h2>

          {!standings ? (
            <p className="text-gray-500 italic">
              {selectedTeamId
                ? "Loading standings..."
                : "Select a team to view standings."}
            </p>
          ) : (
            <div className="space-y-6">
              {standings.ScoresViewModels &&
              standings.ScoresViewModels.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Standing
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Match Points
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Win/Loss/Draw
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Games W/L
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points Scored/Conceded
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.ScoresViewModels.map((standing, idx) => (
                        <tr key={`standing-${idx}`} className="bg-white">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-grey font-bold mr-2">
                                {standing.Standing}
                              </span>
                              <span>{standing.ParticipantName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                            {standing.MatchPoints}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                {standing.Wins}W
                              </span>
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                                {standing.Losses}L
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                                {standing.Draws}D
                              </span>
                              {standing.CancellationLosses > 0 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                  {standing.CancellationLosses} Cancel
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="text-green-600 font-medium">
                              {standing.GamesWon}
                            </span>
                            <span className="mx-1">/</span>
                            <span className="text-red-600 font-medium">
                              {standing.GamesLost}
                            </span>
                            <span className="ml-2 text-gray-500">
                              ({standing.GamesDifference > 0 ? "+" : ""}
                              {standing.GamesDifference})
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="text-green-600 font-medium">
                              {standing.ScoredPoints}
                            </span>
                            <span className="mx-1">/</span>
                            <span className="text-red-600 font-medium">
                              {standing.ConcededPoints}
                            </span>
                            <span className="ml-2 text-gray-500">
                              ({standing.PointsDifference > 0 ? "+" : ""}
                              {standing.PointsDifference})
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No standings information available.</p>
              )}

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-3 text-blue-700">
                  Team Statistics
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      Team Standing
                    </h4>
                    <p className="text-3xl font-bold text-blue-900">
                      {standings.ScoresViewModels[0]?.Standing || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-1">
                      Total Points
                    </h4>
                    <p className="text-3xl font-bold text-green-900">
                      {standings.ScoresViewModels[0]?.MatchPoints || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-800 mb-1">
                      Matches Played
                    </h4>
                    <p className="text-3xl font-bold text-purple-900">
                      {standings.ScoresViewModels[0]?.Played || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">
                      Win Rate
                    </h4>
                    <p className="text-3xl font-bold text-yellow-900">
                      {standings.ScoresViewModels[0]?.Played
                        ? Math.round(
                            (standings.ScoresViewModels[0]?.Wins /
                              standings.ScoresViewModels[0]?.Played) *
                              100
                          ) + "%"
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {standings.ScoresViewModels[0]?.TeamGamesWon !== undefined && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-blue-700">
                    Team Games Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <h4 className="text-sm font-medium text-green-800 mb-1">
                        Games Won
                      </h4>
                      <p className="text-3xl font-bold text-green-900">
                        {standings.ScoresViewModels[0]?.GamesWon}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                      <h4 className="text-sm font-medium text-red-800 mb-1">
                        Games Lost
                      </h4>
                      <p className="text-3xl font-bold text-red-900">
                        {standings.ScoresViewModels[0]?.GamesLost}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <h4 className="text-sm font-medium text-blue-800 mb-1">
                        Games Draw
                      </h4>
                      <p className="text-3xl font-bold text-blue-900">
                        {standings.ScoresViewModels[0]?.Draws > 0 ? "+" : ""}
                        {standings.ScoresViewModels[0]?.Draws}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {standings.ScoresViewModels[0]?.Player1Rating !== null && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-blue-700">
                    Player Ratings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-800 mb-1">
                        Player 1 Rating
                      </h4>
                      <p className="text-2xl font-bold text-gray-900">
                        {standings.ScoresViewModels[0]?.Player1Rating}
                      </p>
                    </div>
                    {standings.ScoresViewModels[0]?.Player2Rating !== null && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-800 mb-1">
                          Player 2 Rating
                        </h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {standings.ScoresViewModels[0]?.Player2Rating}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "Matches" && (
        <div className="bg-gray-50 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Team Matches
          </h2>

          {matches.length === 0 ? (
            <p className="text-gray-500 italic">
              {selectedTeamId
                ? "No matches found or still loading..."
                : "Select a team to view matches."}
            </p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="p-4 bg-green-50 rounded-lg text-center w-32">
                  <h4 className="text-xs font-medium text-green-800 mb-1">
                    Matches Won
                  </h4>
                  <p className="text-2xl font-bold text-green-900">
                    {
                      matches.filter(
                        (match) =>
                          (match.Team1.IsWinner &&
                            match.Team1.Name === selectedTeamName) ||
                          (match.Team2.IsWinner &&
                            match.Team2.Name === selectedTeamName)
                      ).length
                    }
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center w-32">
                  <h4 className="text-xs font-medium text-red-800 mb-1">
                    Matches Lost
                  </h4>
                  <p className="text-2xl font-bold text-red-900">
                    {
                      matches.filter(
                        (match) =>
                          (match.Team1.IsWinner &&
                            match.Team1.Name !== selectedTeamName) ||
                          (match.Team2.IsWinner &&
                            match.Team2.Name !== selectedTeamName)
                      ).length
                    }
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center w-32">
                  <h4 className="text-xs font-medium text-yellow-800 mb-1">
                    Upcoming
                  </h4>
                  <p className="text-2xl font-bold text-yellow-900">
                    {
                      matches.filter(
                        (match) =>
                          getMatchStatus(match.Details.Time) === "upcoming"
                      ).length
                    }
                  </p>
                </div>
              </div>

              {/* Upcoming matches */}
              {matches.some(
                (match) => getMatchStatus(match.Details.Time) === "upcoming"
              ) && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-blue-700">
                    Upcoming Matches
                  </h3>
                  <div className="space-y-3">
                    {matches
                      .filter(
                        (match) =>
                          getMatchStatus(match.Details.Time) === "upcoming"
                      )
                      .sort(
                        (a, b) =>
                          new Date(a.Date).getTime() -
                          new Date(b.Date).getTime()
                      )
                      .map((match) => (
                        <div
                          key={`upcoming-${match.MatchId}`}
                          className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              {formatDate(match.Details.Time)}
                              {match.Details?.LocationName && (
                                <span className="ml-2">
                                  at {match.Details.LocationName}
                                </span>
                              )}
                              {match.Details?.Round && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  Round {match.Details.Round}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <div
                              className={`font-medium ${
                                match.Team1.Name === selectedTeamName
                                  ? "text-blue-700"
                                  : ""
                              }`}
                            >
                              {match.Team1.Name}
                            </div>
                            <div className="text-gray-600">vs</div>
                            <div
                              className={`font-medium ${
                                match.Team2.Name === selectedTeamName
                                  ? "text-blue-700"
                                  : ""
                              }`}
                            >
                              {match.Team2.Name}
                            </div>
                          </div>

                          {match.Location && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Location:</span>{" "}
                              {match.Location}
                              {match.Details?.City && (
                                <span>, {match.Details.City}</span>
                              )}
                              {match.Details?.Address && (
                                <span>, {match.Details.Address}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Today's matches */}
              {matches.some(
                (match) => getMatchStatus(match.Details.Time) === "today"
              ) && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-green-700">
                    Today's Matches
                  </h3>
                  <div className="space-y-3">
                    {matches
                      .filter(
                        (match) =>
                          getMatchStatus(match.Details.Time) === "today"
                      )
                      .sort(
                        (a, b) =>
                          new Date(a.Date).getTime() -
                          new Date(b.Date).getTime()
                      )
                      .map((match) => (
                        <div
                          key={`today-${match.MatchId}`}
                          className="p-3 border border-green-200 bg-green-50 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              {formatDate(match.Date)}
                              {match.Details?.LocationName && (
                                <span className="ml-2">
                                  at {match.Details.LocationName}
                                </span>
                              )}
                            </div>
                            {match.ShowResults && (
                              <div className="text-sm font-medium">
                                {match.ShowCanceledInfoText ? (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                                    Canceled
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                    Completed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <div
                              className={`font-medium ${
                                match.Team1.IsWinner ? "text-green-700" : ""
                              } ${
                                match.Team1.Name === selectedTeamName
                                  ? "text-blue-700"
                                  : ""
                              }`}
                            >
                              {match.Team1.Name}
                            </div>

                            {match.ShowResults ? (
                              <div className="text-lg font-bold">
                                {match.Team1.Result} - {match.Team2.Result}
                              </div>
                            ) : (
                              <div className="text-gray-600">vs</div>
                            )}

                            <div
                              className={`font-medium ${
                                match.Team2.IsWinner ? "text-green-700" : ""
                              } ${
                                match.Team2.Name === selectedTeamName
                                  ? "text-blue-700"
                                  : ""
                              }`}
                            >
                              {match.Team2.Name}
                            </div>
                          </div>

                          {match.Location && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Location:</span>{" "}
                              {match.Location}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Past matches */}
              {matches.some(
                (match) => getMatchStatus(match.Details.Time) === "past"
              ) && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-gray-700">
                    Past Matches
                  </h3>
                  <div className="space-y-3">
                    {matches
                      .filter(
                        (match) => getMatchStatus(match.Details.Time) === "past"
                      )
                      .sort(
                        (a, b) =>
                          new Date(b.Date).getTime() -
                          new Date(a.Date).getTime()
                      ) // Most recent first
                      .map((match) => (
                        <div
                          key={`past-${match.MatchId}`}
                          className="p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              {formatDate(match.Details.Time)}
                              {match.Details?.LocationName && (
                                <span className="ml-2">
                                  at {match.Details.LocationName}
                                </span>
                              )}
                            </div>
                            {match.ShowCanceledInfoText ? (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                                Canceled
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                Completed
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <div
                              className={`font-medium ${
                                match.Team1.IsWinner
                                  ? "text-green-700 font-bold"
                                  : "text-gray-700"
                              } ${
                                match.Team1.Name === selectedTeamName
                                  ? "underline"
                                  : ""
                              }`}
                            >
                              {match.Team1.Name}
                              {match.Team1.AverageRating && (
                                <span className="ml-1 text-xs text-gray-500">
                                  ({match.Team1.AverageRating})
                                </span>
                              )}
                            </div>

                            <div className="text-lg font-bold">
                              {match.Team1.Result} - {match.Team2.Result}
                            </div>

                            <div
                              className={`font-medium ${
                                match.Team2.IsWinner
                                  ? "text-green-700 font-bold"
                                  : "text-gray-700"
                              } ${
                                match.Team2.Name === selectedTeamName
                                  ? "underline"
                                  : ""
                              }`}
                            >
                              {match.Team2.Name}
                              {match.Team2.AverageRating && (
                                <span className="ml-1 text-xs text-gray-500">
                                  ({match.Team2.AverageRating})
                                </span>
                              )}
                            </div>
                          </div>

                          {match.Details && match.Details.Round && (
                            <div className="mt-2 text-xs text-gray-500">
                              Round {match.Details.Round}
                            </div>
                          )}

                          {/* Add button here */}
                          <button
                            onClick={() =>
                              handleShowMatchDetails(match.MatchId)
                            }
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Show match information at a glance */}
              {matches.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-blue-700">
                    Match Summary
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Opponent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Result
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {matches
                          .sort(
                            (a, b) =>
                              new Date(b.Date).getTime() -
                              new Date(a.Date).getTime()
                          ) // Most recent first
                          .map((match) => {
                            const isTeam1 =
                              match.Team1.Name === selectedTeamName;
                            const opponent = isTeam1
                              ? match.Team2.Name
                              : match.Team1.Name;
                            const ourScore = isTeam1
                              ? match.Team1.Result
                              : match.Team2.Result;
                            const theirScore = isTeam1
                              ? match.Team2.Result
                              : match.Team1.Result;
                            const matchStatus = getMatchStatus(
                              match.Details.Time
                            );
                            const isWinner = isTeam1
                              ? match.Team1.IsWinner
                              : match.Team2.IsWinner;

                            return (
                              <tr
                                key={`summary-${match.MatchId}`}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(match.Details.Time)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {opponent}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {match.ShowResults ? (
                                    <span
                                      className={
                                        isWinner
                                          ? "text-green-600 font-medium"
                                          : "text-red-600 font-medium"
                                      }
                                    >
                                      {ourScore} - {theirScore}
                                    </span>
                                  ) : matchStatus === "upcoming" ? (
                                    <span className="text-gray-500">
                                      Upcoming
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {match.Location ||
                                    (match.Details?.LocationName &&
                                    match.Details.City
                                      ? `${match.Details.LocationName}, ${match.Details.City}`
                                      : match.Details?.LocationName || "N/A")}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {match.ShowCanceledInfoText ? (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                      Canceled
                                    </span>
                                  ) : matchStatus === "upcoming" ? (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                      Upcoming
                                    </span>
                                  ) : matchStatus === "today" ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                      Today
                                    </span>
                                  ) : match.ShowResults ? (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                      Completed
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                      Pending
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {isModalOpen && selectedMatchDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Match Details
            </h3>

            {!selectedMatchDetails.length ||
            !selectedMatchDetails[0]?.Matches ||
            !selectedMatchDetails[0]?.Matches.Matches ? (
              <p className="text-red-600">No match details available.</p>
            ) : (
              selectedMatchDetails[0].Matches.Matches.map((match: any) => (
                <div key={match.Id} className="mb-6 border-b pb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Date:</span>{" "}
                    {new Date(match.Date).toLocaleString("en-GB", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div className="col-span-1">
                      <p className="font-medium text-gray-800">
                        {match.Challenger.Name}{" "}
                        {match.Challenger.Player2Name &&
                          `& ${match.Challenger.Player2Name}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        ({match.Challenger.CountryShort.toUpperCase()})
                      </p>
                    </div>
                    <div className="col-span-1 text-center text-gray-600 font-medium">
                      vs
                    </div>
                    <div className="col-span-1">
                      <p className="font-medium text-gray-800">
                        {match.Challenged.Name}{" "}
                        {match.Challenged.Player2Name &&
                          `& ${match.Challenged.Player2Name}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        ({match.Challenged.CountryShort.toUpperCase()})
                      </p>
                    </div>
                  </div>

                  {match.MatchResult ? (
                    match.MatchResult.HasScore ? (
                      <div className="mt-2">
                        <p className="font-semibold text-gray-800">
                          Score: {match.MatchResult.Score.FirstParticipantScore}{" "}
                          - {match.MatchResult.Score.SecondParticipantScore}{" "}
                          {match.MatchResult.IsFirstParticipantWinner ? (
                            <span className="text-green-600 text-sm">
                              (Challenger Won)
                            </span>
                          ) : (
                            <span className="text-green-600 text-sm">
                              (Challenged Won)
                            </span>
                          )}
                        </p>
                        {match.MatchResult.Score.DetailedScoring && (
                          <ul className="mt-1 text-sm text-gray-700 list-disc list-inside">
                            {match.MatchResult.Score.DetailedScoring.map(
                              (set: any, index: number) => (
                                <li key={index}>
                                  Set {index + 1}: {set.FirstParticipantScore} -{" "}
                                  {set.SecondParticipantScore}{" "}
                                  {set.LoserTiebreak &&
                                    `(TB ${set.LoserTiebreak})`}
                                </li>
                              )
                            )}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-gray-600 italic">
                        {match.MatchResult.CancellationStatus ||
                          "No score available"}
                      </p>
                    )
                  ) : (
                    <p className="mt-2 text-gray-600 italic">
                      Match result not available
                    </p>
                  )}
                </div>
              ))
            )}

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LunarLigaPage;
