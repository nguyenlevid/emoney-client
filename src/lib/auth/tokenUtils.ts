// JWT Token utilities for client-side expiration checking

/**
 * Decode JWT payload without verification (client-side only)
 * This is safe for expiration checking but should never be trusted for security
 */
export function decodeJWTPayload(
  token: string
): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);

    const decoded = window.atob(paddedPayload);
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired based on its exp claim
 */
export function isJWTExpired(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    // If we can't decode or no exp claim, assume expired for safety
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  const expirationTime = payload.exp;

  // Add 30 second buffer to account for clock skew
  return currentTime >= expirationTime - 30;
}

/**
 * Get JWT token from cookies
 */
export function getJWTFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'accessToken') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Check if current user's token is expired
 * Returns false if no token exists (user not logged in yet)
 * Returns true only if token exists but is expired
 */
export function isCurrentTokenExpired(): boolean {
  const token = getJWTFromCookie();

  // If no token exists, user is simply not logged in yet - don't treat as "expired"
  if (!token) return false;

  // Only check expiration if a token actually exists
  return isJWTExpired(token);
}

/**
 * Get time until token expires (in milliseconds)
 */
export function getTokenTimeToExpire(): number {
  const token = getJWTFromCookie();
  if (!token) return 0;

  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) return 0;

  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = payload.exp;
  const timeLeft = expirationTime - currentTime;

  return Math.max(0, timeLeft * 1000); // Convert to milliseconds
}
