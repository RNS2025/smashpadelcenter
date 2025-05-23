const cron = require("node-cron");
const {
  DATA_UPDATE_SCHEDULE,
  TOURNAMENT_NOTIFICATION_SCHEDULE,
  MATCH_NOTIFICATION_SCHEDULE,
} = require("../config/schedulerConfig");
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
const logger = require("../config/logger");
const {
  checkAndNotifyAboutTournaments,
  checkAndNotifyAboutUpcomingMatches,
} = require("../Schedules/TournamentNotificationSchedule");

const updateAllData = async () => {
  logger.info("Starting data update...");

  try {
    // Update tournament data (rankedInService)
    for (const orgId of [
      OrganisationIdSmashHorsens,
      OrganisationIdSmashStensballe,
    ]) {
      try {
        logger.info(`Updating tournaments for org ${orgId}`);
        const tournamentData = await getAvailableTournaments(orgId, false);
        if (!tournamentData.payload || tournamentData.payload.length === 0) {
          logger.info(`No tournaments found for org ${orgId}`);
          continue;
        }
        for (const tournament of tournamentData.payload) {
          if (!tournament.eventId) {
            logger.warn(
              `Skipping tournament with undefined eventId for org ${orgId}`
            );
            continue;
          }
          try {
            logger.info(`Processing tournament ${tournament.eventId}`);
            await getAllTournamentPlayers(tournament.eventId);
          } catch (error) {
            logger.error(
              `Skipping tournament ${tournament.eventId} due to error:`,
              {
                error: error.message,
                stack: error.stack,
              }
            );
          }
        }
      } catch (error) {
        logger.error(`Error updating tournaments for org ${orgId}:`, {
          error: error.message,
          stack: error.stack,
        });
      }
    }

    // Update league/team/match data (tournamentService)
    for (const orgId of [
      OrganisationIdSmashHorsens,
      OrganisationIdSmashStensballe,
    ]) {
      try {
        logger.info(`Updating leagues for org ${orgId}`);
        const leagueData = await fetchOrganisationData(orgId);
        if (!leagueData.payload || leagueData.payload.length === 0) {
          logger.info(`No leagues found for org ${orgId}`);
          continue;
        }
        for (const league of leagueData.payload) {
          const teams = await getTeamsByLeagueId(orgId, league.id);
          for (const team of teams) {
            await getTeamMatches(team.id);
          }
        }
      } catch (error) {
        logger.error(`Error updating leagues for org ${orgId}:`, {
          error: error.message,
          stack: error.stack,
        });
      }
    }

    logger.info("Data update completed.");
  } catch (error) {
    logger.error("Unexpected error during data update:", {
      error: error.message,
      stack: error.stack,
    });
  }
};

// Schedule updates
cron.schedule(DATA_UPDATE_SCHEDULE, () => {
  logger.info(`Running scheduled data update at ${new Date().toISOString()}`);
  updateAllData();
});

// Schedule tournament notifications
cron.schedule(TOURNAMENT_NOTIFICATION_SCHEDULE, () => {
  logger.info(
    `Running scheduled tournament notifications at ${new Date().toISOString()}`
  );
  checkAndNotifyAboutTournaments();
});

// Schedule match notifications (every 5 minutes)
cron.schedule(MATCH_NOTIFICATION_SCHEDULE, () => {
  logger.info(
    `Running upcoming match notifications at ${new Date().toISOString()}`
  );
  checkAndNotifyAboutUpcomingMatches();
});

module.exports = {
  updateAllData,
  checkAndNotifyAboutTournaments, // Export for testing purposes
  checkAndNotifyAboutUpcomingMatches, // Export for testing purposes
};
