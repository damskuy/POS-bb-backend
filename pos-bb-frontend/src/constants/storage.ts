/**
 * Storage keys for authentication and user persistence.
 * Strict compliance: MUST use "auth_token" and "auth_user".
 */
export const STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "auth_user",
} as const;
