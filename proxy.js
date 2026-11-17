// Optimistic authentication check on every request (Next.js 16 Proxy).
//
// - "/" is the login page: signed-in users are sent to /dashboard.
// - Every other page requires a valid session cookie, otherwise → login.
// - API routes answer 401 without a session.
//
// This only checks the cookie signature. Role checks and the account lookup
// happen server-side in lib/auth/dal.js (pages, route handlers, actions).

import { NextResponse } from "next/server";
import { SESSION_COOKIE, readToken } from "@/lib/auth/token";

export default function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const session = readToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/") {
    return session ? NextResponse.redirect(new URL("/dashboard", request.url)) : NextResponse.next();
  }

  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const login = new URL("/", request.url);
  login.searchParams.set("next", pathname + search);
  const res = NextResponse.redirect(login);
  // Drop a stale/invalid cookie so the login page is not bounced back.
  if (request.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const config = {
  matcher: [
    // Everything except Next internals, static assets and the MapLibre worker (library code).
    "/((?!_next/static|_next/image|favicon\\.ico|api/maplibre-worker|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)",
  ],
};
