module.exports = {
  // Schedule for data updates (cron format)
  // "0 0 * * *" means every day at midnight
  DATA_UPDATE_SCHEDULE: "0 0 * * *",
  // Optional: If you want to change to a different interval, e.g., every 12 hours
  // DATA_UPDATE_SCHEDULE: "0 */12 * * *",

  // Tournament notification schedule (cron format)
  // "0 9,12,17 * * *" means every day at 9 AM, 12 PM, and 5 PM
  TOURNAMENT_NOTIFICATION_SCHEDULE: "0 9,12,17 * * *",

  // Match notification schedule (cron format)
  // "*/5 * * * *" means every 5 minutes
  // This frequently checks for matches that start in the next 30 minutes
  MATCH_NOTIFICATION_SCHEDULE: "*/5 * * * *",
};
