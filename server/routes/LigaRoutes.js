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

/**
 * @swagger
 * tags:
 *   - name: Liga
 *     description: API endpoints for Liga data
 */

/**
 * @swagger
 * /api/v1/liga/horsens/leagues:
 *   get:
 *     summary: Get all leagues for Smash Horsens
 *     tags: [Liga]
 *     responses:
 *       200:
 *         description: A list of leagues for Smash Horsens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 764
 *                   name:
 *                     type: string
 *                     example: "Lunar Ligaen - Forår 2025"
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-02-01T00:00:00"
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-05-18T23:55:00"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch leagues"
 */
router.get("/horsens/leagues", async (req, res) => {
  try {
    const leagues = await getLeaguesBasicInfo(OrganisationIdSmashHorsens);
    res.json(leagues);
  } catch (error) {
    console.error("Failed to fetch Horsens leagues:", error);
    res.status(500).json({ error: "Failed to fetch leagues" });
  }
});

/**
 * @swagger
 * /api/v1/liga/horsens/leagues/{leagueId}/teams:
 *   get:
 *     summary: Get teams for a specific league in Smash Horsens
 *     tags: [Liga]
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the league
 *     responses:
 *       200:
 *         description: A list of teams for the specified league
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1805762
 *                   name:
 *                     type: string
 *                     example: "Adios by Por Tres feat. PadelCoach Askholt x Smash Stensballe"
 *                   playersCount:
 *                     type: integer
 *                     example: 11
 *                   division:
 *                     type: string
 *                     example: "Serie 3 - G"
 *                   region:
 *                     type: string
 *                     example: "Vest"
 *                   rating:
 *                     type: number
 *                     format: float
 *                     example: 19.42
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch teams"
 */
router.get("/horsens/leagues/:leagueId/teams", async (req, res) => {
  try {
    const leagueId = req.params.leagueId;
    const teams = await getTeamsByLeagueId(
      OrganisationIdSmashHorsens,
      leagueId
    );
    res.json(teams);
  } catch (error) {
    console.error("Failed to fetch Horsens teams:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

/**
 * @swagger
 * /api/v1/liga/stensballe/leagues:
 *   get:
 *     summary: Get all leagues for Smash Stensballe
 *     tags: [Liga]
 *     responses:
 *       200:
 *         description: A list of leagues for Smash Stensballe
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 778
 *                   name:
 *                     type: string
 *                     example: "HH-Listen Foråret 2025"
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-02-01T10:00:00"
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-06-01T10:00:00"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch leagues"
 */
router.get("/stensballe/leagues", async (req, res) => {
  try {
    const leagues = await getLeaguesBasicInfo(OrganisationIdSmashStensballe);
    res.json(leagues);
  } catch (error) {
    console.error("Failed to fetch Stensballe leagues:", error);
    res.status(500).json({ error: "Failed to fetch leagues" });
  }
});

/**
 * @swagger
 * /api/v1/liga/stensballe/leagues/{leagueId}/teams:
 *   get:
 *     summary: Get teams for a specific league in Smash Stensballe
 *     tags: [Liga]
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the league
 *     responses:
 *       200:
 *         description: A list of teams for the specified league
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1812983
 *                   name:
 *                     type: string
 *                     example: "Just Smash it"
 *                   playersCount:
 *                     type: integer
 *                     example: 6
 *                   division:
 *                     type: string
 *                     example: "Række D"
 *                   region:
 *                     type: string
 *                     example: "Horsens, Hedensted, Vejle"
 *                   rating:
 *                     type: number
 *                     format: float
 *                     example: 19.42
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch teams"
 */
router.get("/stensballe/leagues/:leagueId/teams", async (req, res) => {
  try {
    const leagueId = req.params.leagueId;
    const teams = await getTeamsByLeagueId(
      OrganisationIdSmashStensballe,
      leagueId
    );
    res.json(teams);
  } catch (error) {
    console.error("Failed to fetch Stensballe teams:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

/**
 * @swagger
 * /api/v1/liga/all/leagues:
 *   get:
 *     summary: Get leagues from both Smash Horsens and Smash Stensballe
 *     tags: [Liga]
 *     responses:
 *       200:
 *         description: Leagues from both organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 horsens:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                 stensballe:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch leagues"
 */
router.get("/all/leagues", async (req, res) => {
  try {
    const [horsensLeagues, stensballeLeagues] = await Promise.all([
      getLeaguesBasicInfo(OrganisationIdSmashHorsens),
      getLeaguesBasicInfo(OrganisationIdSmashStensballe),
    ]);

    res.json({
      horsens: horsensLeagues,
      stensballe: stensballeLeagues,
    });
  } catch (error) {
    console.error("Failed to fetch all leagues:", error);
    res.status(500).json({ error: "Failed to fetch leagues" });
  }
});

/**
 * @swagger
 * /api/v1/liga/team/{teamId}:
 *   get:
 *     summary: Get detailed information about a specific team
 *     tags: [Liga]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the team
 *     responses:
 *       200:
 *         description: Detailed information about the specified team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1805762
 *                 name:
 *                   type: string
 *                   example: "Adios by Por Tres feat. PadelCoach Askholt x Smash Stensballe"
 *                 playersCount:
 *                   type: integer
 *                   example: 11
 *                 division:
 *                   type: string
 *                   example: "Serie 3 - G"
 *                 region:
 *                   type: string
 *                   example: "Vest"
 *                 rating:
 *                   type: number
 *                   format: float
 *                   example: 19.42
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Team not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch team information"
 */
router.get("/team/:teamId", async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = await getTeamInfo(teamId);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Failed to fetch team info:", error);
    res.status(500).json({ error: "Failed to fetch team information" });
  }
});

/**
 * @swagger
 * /api/v1/liga/team/{teamId}/standings:
 *   get:
 *     summary: Get standings for a specific team
 *     tags: [Liga]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the team
 *     responses:
 *       200:
 *         description: Team standings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 position:
 *                   type: integer
 *                   example: 3
 *                 points:
 *                   type: integer
 *                   example: 21
 *                 matchesPlayed:
 *                   type: integer
 *                   example: 10
 *                 matchesWon:
 *                   type: integer
 *                   example: 7
 *                 matchesLost:
 *                   type: integer
 *                   example: 3
 *       404:
 *         description: Team standings not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Standings not found for team"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch team standings"
 */
router.get("/team/:teamId/standings", async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const standings = await getTeamStandings(teamId);

    if (!standings) {
      return res.status(404).json({ error: "Standings not found for team" });
    }

    res.json(standings);
  } catch (error) {
    console.error("Failed to fetch team standings:", error);
    res.status(500).json({ error: "Failed to fetch team standings" });
  }
});

/**
 * @swagger
 * /api/v1/liga/team/{teamId}/matches:
 *   get:
 *     summary: Get all matches for a specific team
 *     tags: [Liga]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the team
 *     responses:
 *       200:
 *         description: A list of matches for the specified team
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 123456
 *                   homeTeam:
 *                     type: string
 *                     example: "Padel Smashers"
 *                   awayTeam:
 *                     type: string
 *                     example: "Padel Kings"
 *                   homeScore:
 *                     type: integer
 *                     example: 2
 *                   awayScore:
 *                     type: integer
 *                     example: 1
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-04-06T18:00:00"
 *       404:
 *         description: Matches not found for team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Matches not found for team"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch team matches"
 */
router.get("/team/:teamId/matches", async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const matches = await getTeamMatches(teamId);

    if (!matches || matches.length === 0) {
      return res.status(404).json({ error: "Matches not found for team" });
    }

    res.json(matches);
  } catch (error) {
    console.error("Failed to fetch team matches:", error);
    res.status(500).json({ error: "Failed to fetch team matches" });
  }
});

/**
 * @swagger
 * /api/v1/liga/match/{matchId}/details:
 *   get:
 *     summary: Get detailed information about a specific match
 *     tags: [Liga]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the match
 *     responses:
 *       200:
 *         description: Detailed match information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1002345
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-06T18:00:00"
 *                 homeTeam:
 *                   type: string
 *                   example: "Padel Smashers"
 *                 awayTeam:
 *                   type: string
 *                   example: "Padel Kings"
 *                 result:
 *                   type: string
 *                   example: "2-1"
 *                 sets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       setNumber:
 *                         type: integer
 *                         example: 1
 *                       homeScore:
 *                         type: integer
 *                         example: 6
 *                       awayScore:
 *                         type: integer
 *                         example: 4
 *       404:
 *         description: Match not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Match not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch match details"
 */
router.get("/match/:matchId/details", async (req, res) => {
  try {
    const { matchId } = req.params;
    const matchDetails = await getMatchDetails(matchId);

    if (matchDetails.length === 0) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.json(matchDetails);
  } catch (error) {
    console.error("Failed to fetch match details:", error);
    res.status(500).json({ error: "Failed to fetch match details" });
  }
});

/**
 * @swagger
 * /api/v1/liga/teams/batch:
 *   post:
 *     summary: Get detailed information for multiple teams
 *     tags: [Liga]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1805762, 1812983]
 *     responses:
 *       200:
 *         description: Detailed information for the specified teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   playersCount:
 *                     type: integer
 *                   division:
 *                     type: string
 *                   region:
 *                     type: string
 *                   rating:
 *                     type: number
 *       500:
 *         description: Server error
 */
router.post("/teams/batch", async (req, res) => {
  try {
    const { teamIds } = req.body;
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res
        .status(400)
        .json({ error: "teamIds must be a non-empty array" });
    }

    const teamInfos = await Promise.all(
      teamIds.map(async (teamId) => {
        try {
          return await getTeamInfo(teamId);
        } catch (error) {
          console.error(`Failed to fetch team ${teamId}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed requests
    const validTeamInfos = teamInfos.filter((info) => info !== null);
    res.json(validTeamInfos);
  } catch (error) {
    console.error("Failed to fetch batch team info:", error);
    res.status(500).json({ error: "Failed to fetch team information" });
  }
});

module.exports = router;
