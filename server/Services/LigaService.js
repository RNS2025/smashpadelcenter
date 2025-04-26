const axios = require("axios");
const logger = require("../config/logger");
const {
  API_BASE_URL,
  OrganisationIdSmashHorsens,
  OrganisationIdSmashStensballe,
} = require("./rankedInService");

const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 3600 });
const orgCache = new NodeCache({ stdTTL: 3600 });

const fetchOrganisationData = async (organisationId) => {
  const cacheKey = `orgData_${organisationId}`;
  const cachedData = orgCache.get(cacheKey);

  if (cachedData) {
    logger.debug("LigaService: Cache hit for organization", { organisationId });
    return cachedData;
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/Organization/GetOrganisationTeamLeaguesAsync?organisationId=${organisationId}&isFinished=false&skip=0&take=10&language=en`
    );
    const data = response.data;
    orgCache.set(cacheKey, data);
    return data;
  } catch (error) {
    logger.error("LigaService: Error fetching organisation data:", {
      error: error.message,
      organisationId,
    });
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

  const league = data.payload.find((league) => league.id === Number(leagueId));

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
  const cacheKey = `teamInfo_${teamId}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Cache hit for team ${teamId}`);
    return cachedData;
  }

  const response = await axios.get(
    `https://rankedin.com/team/tlhomepage/${teamId}`
  );
  const data = response.data;

  cache.set(cacheKey, data);
  return data;
};

const getTeamStandings = async (teamId) => {
  const TeamInfo = await getTeamInfo(teamId);

  // Extract the poolId from the response
  const poolId = TeamInfo.PoolId;

  const response = await axios.get(
    `https://rankedin.com/team/teamsstandingsjson?poolid=${poolId}&language=en`
  );

  return response.data;
};

const getTeamMatches = async (teamId) => {
  const response = await axios.get(
    `${API_BASE_URL}/teamleague/GetTeamMatchesAsync?teamid=${teamId}&language=en`
  );
  return response.data;
};

const getMatchDetails = async (matchId) => {
  const response = await axios.get(
    `${API_BASE_URL}/teamleague/GetTeamLeagueTeamsMatchesAsync?teamMatchId=${matchId}&language=en`
  );
  return response.data;
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
