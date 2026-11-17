import "server-only";

// Data access layer for authentication and authorisation.
// Every server-side check (pages, route handlers, server actions) goes through here.

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canAccess, can } from "@/lib/config/navigation";
import { SESSION_COOKIE, readToken } from "./token";
import { findActiveUserById } from "./users";

/** The signed-in user ({ id, name, email, role, lgaId }) or null. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = readToken(token);
  if (!payload) return null;
  // Re-read the account so disabled users and role changes take effect immediately.
  return findActiveUserById(payload.sub);
});

/** Signed-in user, or redirect to the login page. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/signout");
  return user;
}

/** Signed-in user plus whether their role may open `pathname`. */
export async function checkPageAccess(pathname) {
  const user = await requireUser();
  return { user, allowed: canAccess(user.role, pathname) };
}

/** For route handlers: { user } or { response } with 401/403. */
export async function authorizeRequest(permission) {
  const user = await getCurrentUser();
  if (!user) return { response: Response.json({ error: "Authentication required" }, { status: 401 }) };
  if (permission && !can(user.role, permission)) {
    return { response: Response.json({ error: "Not permitted for this role" }, { status: 403 }) };
  }
  return { user };
}
