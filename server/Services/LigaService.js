const axios = require("axios");
const {
  API_BASE_URL,
  OrganisationIdSmashHorsens,
  OrganisationIdSmashStensballe,
} = require("./rankedInService");

const fetchOrganisationData = async (organisationId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/Organization/GetOrganisationTeamLeaguesAsync?organisationId=${organisationId}&isFinished=false&skip=0&take=10&language=en`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching organisation data:", error);
    throw error;
  }
};

// Method to extract leagues with name, id, and dates
const getLeaguesBasicInfo = async (organisationId) => {
  const data = await fetchOrganisationData(organisationId);

  return data.payload.map((league) => ({
    id: league.id,
    name: league.name,
    startDate: league.startDate,
    endDate: league.endDate,
  }));
};

// Method to get teams for a specific league by ID
const getTeamsByLeagueId = async (organisationId, leagueId) => {
  const data = await fetchOrganisationData(organisationId);
  console.log("Fetched data:", data);

  const league = data.payload.find((league) => league.id === Number(leagueId));
  console.log("Matched league:", league);

  if (!league) {
    return [];
  }

  return Array.isArray(league.teams) ? league.teams : [];
};

const getTeamByTeamId = async (leagueId, teamId) => {
  const data = await fetchOrganisationData(leagueId);

  const league = data.payload.find((league) =>
    league.teams.some((team) => team.id === teamId)
  );

  if (!league) {
    return null; // Return null if league not found
  }

  return league.teams.find((team) => team.id === teamId) || null;
};

const getTeamInfo = async (teamId) => {
  const response = await axios.get(
    `https://rankedin.com/team/tlhomepage/${teamId}`
  );
  const data = response.data;
  return data;
};

const getTeamStandings = async (teamId) => {
  const TeamInfo = await getTeamInfo(teamId);

  // Extract the poolId from the response
  const poolId = TeamInfo.PoolId;

  const response = await axios.get(
    `https://rankedin.com/team/teamsstandingsjson?poolid=${poolId}&language=en`
  );

  const data = response.data;
  return data;
};

const getTeamMatches = async (teamId) => {
  const response = await axios.get(
    `${API_BASE_URL}/teamleague/GetTeamMatchesAsync?teamid=${teamId}&language=en`
  );
  const data = response.data;
  return data;
};

const getMatchDetails = async (matchId) => {
  const response = await axios.get(
    `${API_BASE_URL}/teamleague/GetTeamLeagueTeamsMatchesAsync?teamMatchId=${matchId}&language=en`
  );
  const data = response.data;
  return data;
};

module.exports = {
  getLeaguesBasicInfo,
  getTeamsByLeagueId,
  fetchOrganisationData,
  getTeamInfo,
  getTeamStandings,
  getTeamMatches,
  getMatchDetails,
};
