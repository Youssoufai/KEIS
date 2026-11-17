import "server-only";

// Account store.
//
// INTERIM: accounts live in a JSON file on the server (data/auth/users.json,
// git-ignored), managed with `npm run users -- …`. Passwords are scrypt-hashed.
// Replace with the production database once FRD §9 item 9 is decided.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ROLE_IDS } from "@/lib/config/constants";
import { DUMMY_HASH, verifyPassword } from "./password.mjs";
import { DEMO_AUTH, DEMO_USER } from "./mode";

function usersFile() {
  return process.env.AUTH_USERS_FILE || path.join(process.cwd(), "data", "auth", "users.json");
}

async function loadUsers() {
  try {
    const parsed = JSON.parse(await readFile(/* turbopackIgnore: true */ usersFile(), "utf8"));
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

/** Only the fields the app needs (never the password hash). */
function toPublicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, lgaId: u.lgaId || null };
}

function usable(u) {
  return u && u.active !== false && ROLE_IDS.includes(u.role);
}

export async function findActiveUserById(id) {
  if (DEMO_AUTH) return id === DEMO_USER.id ? DEMO_USER : null;
  const u = (await loadUsers()).find((x) => x.id === id);
  return usable(u) ? toPublicUser(u) : null;
}

/** Checks an email/username + password. Returns the public user or null. */
export async function verifyCredentials(identifier, password) {
  if (DEMO_AUTH) return DEMO_USER; // open demo: any input signs in
  const key = identifier.trim().toLowerCase();
  const u = (await loadUsers()).find(
    (x) => x.email?.toLowerCase() === key || (x.username && x.username.toLowerCase() === key),
  );
  // Always run one hash so response time does not reveal whether the account exists.
  const ok = await verifyPassword(password, u?.passwordHash || DUMMY_HASH);
  return ok && usable(u) ? toPublicUser(u) : null;
}

export async function hasAnyUsers() {
  return (await loadUsers()).length > 0;
}
