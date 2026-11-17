# Kogi State Rural Electrification Planning Platform (prototype)

Internal, login-first decision-support platform for authorised Kogi State personnel
(Energy Analysts, Government Stakeholders, LGA Officers, Field Data Collectors,
System Administrators). Pilot LGAs: Ankpa, Dekina, Adavi. Requirements: `docs/FRD.md`.

## Demo mode (current default)

Sign-in is **open**: any email/password (or none) signs in as "Demo User" (System Administrator).
No accounts or `SESSION_SECRET` are needed. This is not access control — do not deploy publicly like this.
Real login is already built: set `AUTH_MODE=accounts` and follow the setup below to switch it on.

## Setup (real accounts, `AUTH_MODE=accounts`)

```bash
npm install
# 1. Session signing secret (min. 32 chars) in .env.local:
echo "SESSION_SECRET=$(node -e 'console.log(require("crypto").randomBytes(48).toString("base64url"))')" >> .env.local
# 2. Create the first administrator (prompts for a password, min. 10 chars):
npm run users -- add --email you@kogi.gov.ng --name "Your Name" --role admin
npm run dev   # http://localhost:3000 → login page
```

## Authentication and access

- `/` is the login page; every other route requires a session (`proxy.js`).
- Sessions: HMAC-signed, HttpOnly cookie (`lib/auth/token.js`). "Keep me signed in" = 30 days, otherwise
  the browser session (max. 12 h).
- Roles are assigned to accounts, never chosen by users. Page access and permissions are defined in
  `lib/config/navigation.js` and enforced on the server by `lib/auth/dal.js`, `<PageGuard>` and the API routes.
- Accounts: `npm run users -- add | list | set-password | set-role | disable | enable` (see `scripts/auth/users.mjs`).
  Stored in `data/auth/users.json` (git-ignored, scrypt password hashes).

### Not yet implemented
- Production user database and an in-app user-management screen (FRD §9 item 9 open). The JSON file store is interim.
- Self-service password reset (users contact the administrator).
- Login throttling is in-memory per server process (5 failures / 15 min per account).
- Workflow records (reports, assessments, assumptions) are still stored in each browser's localStorage
  (`lib/store/store.js`), so they are not shared between users and are not protected by server-side authorisation.
- A separate public reporting channel for residents, if one is wanted, is not designed yet.

## Geospatial data

`npm run data:fetch` then `npm run data:build` (see `docs/DATA_SOURCES.md`, `docs/GEOSPATIAL_VALIDATION.md`).
Layers are served to signed-in users by `/api/geo/[layer]`; restricted layers need the `viewRestrictedData` permission.
