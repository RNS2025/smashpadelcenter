// Routes that should NOT trigger a redirect even if the user is not authenticated
export const WHITELIST_ROUTES = [
  "/check-in",
  "/player/:playerId/:rowId, /court-times",
];
