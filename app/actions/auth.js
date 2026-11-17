"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, authConfigured, createToken } from "@/lib/auth/token";
import { verifyCredentials } from "@/lib/auth/users";
import { DEMO_AUTH } from "@/lib/auth/mode";

const SHORT_SESSION_MS = 12 * 60 * 60 * 1000; // browser session, max 12 h
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // "remember me": 30 days

// Basic brute-force protection. In-memory, so per server process only;
// move to the database / a shared store before running multiple instances.
const MAX_FAILURES = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map();

function lockedOut(key) {
  const f = failures.get(key);
  if (!f) return false;
  if (Date.now() - f.first > LOCK_WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return f.count >= MAX_FAILURES;
}

function recordFailure(key) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > LOCK_WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else f.count += 1;
}

/** Only allow redirects to internal paths (no protocol-relative or absolute URLs). */
function safeNext(value) {
  return typeof value === "string" && /^\/(?![/\\])/.test(value) && value !== "/" ? value : "/dashboard";
}

export async function login(_prev, formData) {
  const identifier = String(formData.get("identifier") || "").trim();
  const password = String(formData.get("password") || "");
  const remember = formData.get("remember") === "on";
  const values = { identifier, remember };

  const fieldErrors = {};
  // Demo mode: fields are optional.
  if (!DEMO_AUTH) {
    if (!identifier) fieldErrors.identifier = "Enter your email address or username.";
    if (!password) fieldErrors.password = "Enter your password.";
  }
  if (Object.keys(fieldErrors).length) return { values, fieldErrors };

  if (!authConfigured()) {
    return { values, error: "Sign-in is not configured on this server (SESSION_SECRET missing). Contact the system administrator." };
  }

  const key = identifier.toLowerCase();
  if (lockedOut(key)) {
    return { values, error: "Too many failed attempts. Wait 15 minutes and try again, or contact your system administrator." };
  }

  const user = await verifyCredentials(identifier, password);
  if (!user) {
    recordFailure(key);
    return { values, error: "The email/username or password is incorrect." };
  }
  failures.delete(key);

  const maxAge = remember ? REMEMBER_MS : SHORT_SESSION_MS;
  const token = createToken({ sub: user.id, exp: Date.now() + maxAge });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Without "remember me" the cookie ends with the browser session (token still expires after 12 h).
    ...(remember ? { maxAge: Math.floor(REMEMBER_MS / 1000) } : {}),
  });

  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
