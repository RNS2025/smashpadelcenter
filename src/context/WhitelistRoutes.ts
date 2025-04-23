// Routes that should NOT trigger a redirect even if the user is not authenticated
export const WHITELIST_ROUTES = [
  "/turneringer/check-in",
  "/player/:playerId/:rowId, /court-times",
  "/register",
  "/login",
  "/",
  "/InstallPrompt",
];
