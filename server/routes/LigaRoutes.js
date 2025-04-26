const express = require("express");
const router = express.Router();
const {
  OrganisationIdSmashHorsens,
  OrganisationIdSmashStensballe,
} = require("../Services/rankedInService");
const {
  getLeaguesBasicInfo,
  getTeamsByLeagueId,
  getTeamInfo,
  getTeamStandings,
  getTeamMatches,
  getMatchDetails,
} = require("../Services/LigaService");
const logger = require("../config/logger"); // Import logger

// Route handlers with added logging

router.get("/horsens/leagues", async (req, res) => {
  logger.debug("Fetching Horsens leagues");
  try {
    const leagues = await getLeaguesBasicInfo(OrganisationIdSmashHorsens);
    logger.info("Successfully fetched Horsens leagues", {
      count: leagues.length,
    });
    res.json(leagues);
  } catch (error) {
    logger.error("Failed to fetch Horsens leagues", { error: error.message });
    res.status(500).json({ error: "Failed to fetch leagues" });
  }
});

router.get("/horsens/leagues/:leagueId/teams", async (req, res) => {
  const leagueId = req.params.leagueId;
  logger.debug("Fetching teams for Horsens league", { leagueId });
  try {
    const teams = await getTeamsByLeagueId(
      OrganisationIdSmashHorsens,
      leagueId
    );
    logger.info("Successfully fetched Horsens league teams", {
      leagueId,
      teamsCount: teams.length,
    });
    res.json(teams);
  } catch (error) {
    logger.error("Failed to fetch Horsens teams", {
      leagueId,
      error: error.message,
    });
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

router.get("/stensballe/leagues", async (req, res) => {
  logger.debug("Fetching Stensballe leagues");
  try {
    const leagues = await getLeaguesBasicInfo(OrganisationIdSmashStensballe);
    logger.info("Successfully fetched Stensballe leagues", {
      count: leagues.length,
    });
    res.json(leagues);
  } catch (error) {
    logger.error("Failed to fetch Stensballe leagues", {
      error: error.message,
    });
    res.status(500).json({ error: "Failed to fetch leagues" });
  }
});

router.get("/stensballe/leagues/:leagueId/teams", async (req, res) => {
  const leagueId = req.params.leagueId;
  logger.debug("Fetching teams for Stensballe league", { leagueId });
  try {
    const teams = await getTeamsByLeagueId(
      OrganisationIdSmashStensballe,
      leagueId
    );
    logger.info("Successfully fetched Stensballe league teams", {
      leagueId,
      teamsCount: teams.length,
    });
    res.json(teams);
  } catch (error) {
    logger.error("Failed to fetch Stensballe teams", {
      leagueId,
      error: error.message,
    });
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

router.get("/all/leagues", async (req, res) => {
  logger.debug("Fetching leagues from both organizations");
  try {
    const [horsensLeagues, stensballeLeagues] = await Promise.all([
      getLeaguesBasicInfo(OrganisationIdSmashHorsens),
      getLeaguesBasicInfo(OrganisationIdSmashStensballe),
    ]);

    logger.info("Successfully fetched all leagues", {
      horsensCount: horsensLeagues.length,
      stensballeCount: stensballeLeagues.length,
    });

    res.json({
      horsens: horsensLeagues,
      stensballe: stensballeLeagues,
    });
  } catch (error) {
    logger.error("Failed to fetch all leagues", { error: error.message });
    res.status(500).json({ error: "Failed to fetch leagues" });
  }
});

router.get("/team/:teamId", async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  logger.debug("Fetching team information", { teamId });
  try {
    const team = await getTeamInfo(teamId);

    if (!team) {
      logger.info("Team not found", { teamId });
      return res.status(404).json({ error: "Team not found" });
    }

    logger.info("Successfully fetched team information", {
      teamId,
      teamName: team.name,
    });
    res.json(team);
  } catch (error) {
    logger.error("Failed to fetch team info", { teamId, error: error.message });
    res.status(500).json({ error: "Failed to fetch team information" });
  }
});

router.get("/team/:teamId/standings", async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  logger.debug("Fetching team standings", { teamId });
  try {
    const standings = await getTeamStandings(teamId);

    if (!standings) {
      logger.info("Standings not found for team", { teamId });
      return res.status(404).json({ error: "Standings not found for team" });
    }

    logger.info("Successfully fetched team standings", {
      teamId,
      position: standings.position,
      points: standings.points,
    });
    res.json(standings);
  } catch (error) {
    logger.error("Failed to fetch team standings", {
      teamId,
      error: error.message,
    });
    res.status(500).json({ error: "Failed to fetch team standings" });
  }
});

router.get("/team/:teamId/matches", async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  logger.debug("Fetching team matches", { teamId });
  try {
    const matches = await getTeamMatches(teamId);

    if (!matches || matches.length === 0) {
      logger.info("Matches not found for team", { teamId });
      return res.status(404).json({ error: "Matches not found for team" });
    }

    logger.info("Successfully fetched team matches", {
      teamId,
      matchCount: matches.length,
    });
    res.json(matches);
  } catch (error) {
    logger.error("Failed to fetch team matches", {
      teamId,
      error: error.message,
    });
    res.status(500).json({ error: "Failed to fetch team matches" });
  }
});

router.get("/match/:matchId/details", async (req, res) => {
  const matchId = req.params.matchId;
  logger.debug("Fetching match details", { matchId });
  try {
    const matchDetails = await getMatchDetails(matchId);

    if (matchDetails.length === 0) {
      logger.info("Match not found", { matchId });
      return res.status(404).json({ error: "Match not found" });
    }

    logger.info("Successfully fetched match details", { matchId });
    res.json(matchDetails);
  } catch (error) {
    logger.error("Failed to fetch match details", {
      matchId,
      error: error.message,
    });
    res.status(500).json({ error: "Failed to fetch match details" });
  }
});

router.post("/teams/batch", async (req, res) => {
  logger.debug("Processing batch team info request", {
    teamCount: req.body.teamIds?.length,
  });
  try {
    const { teamIds } = req.body;
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      logger.warn("Invalid teamIds in batch request", { teamIds });
      return res
        .status(400)
        .json({ error: "teamIds must be a non-empty array" });
    }

    const teamInfos = await Promise.all(
      teamIds.map(async (teamId) => {
        try {
          return await getTeamInfo(teamId);
        } catch (error) {
          logger.error(`Failed to fetch team in batch request`, {
            teamId,
            error: error.message,
          });
          return null;
        }
      })
    );

    // Filter out any failed requests
    const validTeamInfos = teamInfos.filter((info) => info !== null);
    logger.info("Successfully processed batch team info request", {
      requestedCount: teamIds.length,
      successfulCount: validTeamInfos.length,
    });

    res.json(validTeamInfos);
  } catch (error) {
    logger.error("Failed to fetch batch team info", { error: error.message });
    res.status(500).json({ error: "Failed to fetch team information" });
  }
});

module.exports = router;
