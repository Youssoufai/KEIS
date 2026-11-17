// Signed session tokens (HMAC-SHA256), used by proxy.js and the data access layer.
//
// Token: base64url(JSON payload) + "." + base64url(HMAC(SESSION_SECRET, payload)).
// The payload holds only the user id and timestamps. The role is NOT trusted from
// the token: lib/auth/dal.js looks the account up on every request.

import { createHmac, timingSafeEqual } from "node:crypto";
import { DEMO_AUTH } from "./mode";

export const SESSION_COOKIE = "kogi_ren_session";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  // Demo mode needs no configuration; the cookie only marks "signed in to the demo".
  return DEMO_AUTH ? "kogi-ren-demo-mode-session-secret-not-for-production" : null;
}

export function authConfigured() {
  return secret() !== null;
}

function sign(data, key) {
  return createHmac("sha256", key).update(data).digest("base64url");
}

/** @param {{ sub: string, exp: number }} payload  exp in ms since epoch */
export function createToken(payload) {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET is not set (min. 32 characters).");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  return `${body}.${sign(body, key)}`;
}

/** Returns the payload if the token is authentic and unexpired, else null. */
export function readToken(token) {
  const key = secret();
  if (!key || typeof token !== "string") return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
