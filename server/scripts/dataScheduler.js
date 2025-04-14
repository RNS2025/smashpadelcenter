const cron = require("node-cron");
const { DATA_UPDATE_SCHEDULE } = require("../config/schedulerConfig");
const {
  getAvailableTournaments,
  getAllTournamentPlayers,
} = require("../Services/rankedInService");
const {
  fetchOrganisationData,
  getTeamsByLeagueId,
  getTeamMatches,
} = require("../Services/LigaService");
const {
  OrganisationIdSmashHorsens,
  OrganisationIdSmashStensballe,
} = require("../Services/rankedInService");

const updateAllData = async () => {
  console.log("Starting data update...");

  try {
    // Update tournament data (rankedInService)
    for (const orgId of [
      OrganisationIdSmashHorsens,
      OrganisationIdSmashStensballe,
    ]) {
      try {
        console.log(`Updating tournaments for org ${orgId}`);
        const tournamentData = await getAvailableTournaments(orgId, false);
        if (!tournamentData.payload || tournamentData.payload.length === 0) {
          console.log(`No tournaments found for org ${orgId}`);
          continue;
        }
        for (const tournament of tournamentData.payload) {
          if (!tournament.eventId) {
            console.warn(
              `Skipping tournament with undefined eventId for org ${orgId}`
            );
            continue;
          }
          try {
            console.log(`Processing tournament ${tournament.eventId}`);
            await getAllTournamentPlayers(tournament.eventId);
          } catch (error) {
            console.error(
              `Skipping tournament ${tournament.eventId} due to error:`,
              error.message
            );
          }
        }
      } catch (error) {
        console.error(
          `Error updating tournaments for org ${orgId}:`,
          error.message
        );
      }
    }

    // Update league/team/match data (tournamentService)
    for (const orgId of [
      OrganisationIdSmashHorsens,
      OrganisationIdSmashStensballe,
    ]) {
      try {
        console.log(`Updating leagues for org ${orgId}`);
        const leagueData = await fetchOrganisationData(orgId);
        if (!leagueData.payload || leagueData.payload.length === 0) {
          console.log(`No leagues found for org ${orgId}`);
          continue;
        }
        for (const league of leagueData.payload) {
          const teams = await getTeamsByLeagueId(orgId, league.id);
          for (const team of teams) {
            await getTeamMatches(team.id);
          }
        }
      } catch (error) {
        console.error(
          `Error updating leagues for org ${orgId}:`,
          error.message
        );
      }
    }

    console.log("Data update completed.");
  } catch (error) {
    console.error("Unexpected error during data update:", error);
  }
};

// Schedule updates
cron.schedule(DATA_UPDATE_SCHEDULE, () => {
  console.log(`Running scheduled data update at ${new Date().toISOString()}`);
  updateAllData();
});

module.exports = { updateAllData };
