// Clears the session cookie and returns to the login page.
// Used when a cookie is still validly signed but its account no longer exists or
// was disabled (proxy.js alone would bounce the user between "/" and the app).

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/token";

export async function GET(request) {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.redirect(new URL("/?reason=signed-out", request.url), 303);
}
