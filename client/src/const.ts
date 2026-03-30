export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the login page URL.
 * Optionally includes a returnPath so the user is redirected back after login.
 */
export const getLoginUrl = (returnPath?: string): string => {
  const base = "/login";
  if (returnPath) {
    return `${base}?returnTo=${encodeURIComponent(returnPath)}`;
  }
  return base;
};
