// DEMO MODE (default): the login form accepts any input and signs in a demo
// administrator. No accounts or secrets are needed. This is NOT access control.
// Set AUTH_MODE=accounts (plus SESSION_SECRET and accounts from `npm run users`)
// to require real credentials.
export const DEMO_AUTH = process.env.AUTH_MODE !== "accounts";

export const DEMO_USER = { id: "demo", name: "Demo User", email: "demo@kogi-ren.local", role: "admin", lgaId: null };
