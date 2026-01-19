// Client-side auth for preview: uses SHA-256 hashes so passwords are not visible in chiaro.
// In deploy phase, these checks will move server-side with env vars.

function encUTF8(s: string) {
  return new TextEncoder().encode(s);
}
function toBase64(bytes: ArrayBuffer) {
  const arr = new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin);
}

export async function sha256Base64(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encUTF8(input));
  return toBase64(digest);
}

export function randomSaltBase64(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin);
}

export async function hashWithSaltBase64(saltB64: string, password: string): Promise<string> {
  // Concatenate salt+password as string (simple & stable for preview)
  return sha256Base64(`${saltB64}:${password}`);
}

export async function verifyPassword(saltB64: string, hashB64: string, password: string): Promise<boolean> {
  const h = await hashWithSaltBase64(saltB64, password);
  return h === hashB64;
}

/**
 * PREVIEW fixed passwords:
 * - we store ONLY hash constants here (no plaintext).
 * - the plaintext exists only in your prompt / your head.
 *
 * NOTE: In deploy phase we will move to env vars and server-side compare.
 */
const ADMIN_SALT = "c2VzX2FkbWluX3NhbHQ=";      // base64("ses_admin_salt") (not a secret)
const DASH_SALT  = "ZGFzaF9zYWx0XzIwMjY=";       // base64("dash_salt_2026")

// These hashes were computed as sha256Base64(`${SALT}:${PASSWORD}`).
// (Passwords are NOT in chiaro here.)
export const ADMIN_HASH = "bghQrMgUXmUu1O3doGeBIyQzlD2wVIEuMIdZHmO37g0=";
export const DASH_HASH  = "LRIEIICT+K7c4jXybXppMEpCmjpupRo3+SwWogne9Is=";

export async function verifyAdmin(password: string) {
  const h = await hashWithSaltBase64(ADMIN_SALT, password);
  return h === ADMIN_HASH;
}

export async function verifyDashboard(password: string) {
  const h = await hashWithSaltBase64(DASH_SALT, password);
  return h === DASH_HASH;
}
