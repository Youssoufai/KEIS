// Account management for the interim file-based user store (data/auth/users.json).
//
//   npm run users -- add --email a.b@kogi.gov.ng --name "Ada Bello" --role analyst [--username abello] [--lga ankpa]
//   npm run users -- list
//   npm run users -- set-password --email a.b@kogi.gov.ng
//   npm run users -- set-role --email a.b@kogi.gov.ng --role viewer
//   npm run users -- disable --email a.b@kogi.gov.ng   (or: enable)
//
// Passwords are read from a hidden prompt (or from stdin when piped) and stored
// as scrypt hashes. Roles: admin, analyst, viewer, lga_officer, field.
// Set AUTH_USERS_FILE to use another file. Replace with the production
// database and an admin UI once FRD §9 item 9 is decided.

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../../lib/auth/password.mjs";

const ROLES = ["admin", "analyst", "viewer", "lga_officer", "field"];
const FILE = process.env.AUTH_USERS_FILE || path.resolve("data/auth/users.json");

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith("--")) opts[rest[i].slice(2)] = rest[i + 1]?.startsWith("--") || rest[i + 1] === undefined ? true : rest[++i];
  }
  return { cmd, opts };
}

async function load() {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return { users: [] };
    throw err;
  }
}

async function save(db) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  await writeFile(tmp, JSON.stringify(db, null, 2) + "\n", { mode: 0o600 });
  await rename(tmp, FILE);
}

async function readPassword(prompt) {
  if (!process.stdin.isTTY) {
    let data = "";
    for await (const chunk of process.stdin) data += chunk;
    return data.split(/\r?\n/)[0];
  }
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve) => {
    let value = "";
    const onData = (ch) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        process.exit(130);
      } else if (ch === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function newPassword() {
  const pw = await readPassword("Password: ");
  if (pw.length < PASSWORD_MIN_LENGTH) throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  if (process.stdin.isTTY) {
    const again = await readPassword("Repeat password: ");
    if (again !== pw) throw new Error("Passwords do not match.");
  }
  return hashPassword(pw);
}

function find(db, email) {
  if (!email || email === true) throw new Error("--email is required.");
  const u = db.users.find((x) => x.email.toLowerCase() === String(email).toLowerCase());
  if (!u) throw new Error(`No account with email ${email}.`);
  return u;
}

function checkRole(role) {
  if (!ROLES.includes(role)) throw new Error(`--role must be one of: ${ROLES.join(", ")}`);
}

async function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));
  const db = await load();

  switch (cmd) {
    case "add": {
      const { email, name, role, username, lga } = opts;
      if (!email || !name || email === true || name === true) throw new Error("--email and --name are required.");
      checkRole(role);
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error("Email already in use.");
      if (username && db.users.some((u) => u.username?.toLowerCase() === username.toLowerCase())) throw new Error("Username already in use.");
      const passwordHash = await newPassword();
      db.users.push({
        id: randomUUID(),
        email: email.toLowerCase(),
        ...(username ? { username } : {}),
        name,
        role,
        lgaId: lga || null,
        active: true,
        passwordHash,
        createdAt: new Date().toISOString(),
      });
      await save(db);
      console.log(`Added ${email} (${role}).`);
      break;
    }
    case "list":
      if (!db.users.length) console.log(`No accounts in ${FILE}.`);
      for (const u of db.users) console.log(`${u.active === false ? "[disabled] " : ""}${u.email}\t${u.role}\t${u.name}${u.username ? `\t@${u.username}` : ""}`);
      break;
    case "set-password": {
      const u = find(db, opts.email);
      u.passwordHash = await newPassword();
      u.updatedAt = new Date().toISOString();
      await save(db);
      console.log(`Password updated for ${u.email}.`);
      break;
    }
    case "set-role": {
      const u = find(db, opts.email);
      checkRole(opts.role);
      u.role = opts.role;
      u.updatedAt = new Date().toISOString();
      await save(db);
      console.log(`${u.email} is now ${opts.role}.`);
      break;
    }
    case "disable":
    case "enable": {
      const u = find(db, opts.email);
      u.active = cmd === "enable";
      u.updatedAt = new Date().toISOString();
      await save(db);
      console.log(`${u.email} ${cmd}d.`);
      break;
    }
    default:
      console.log("Usage: npm run users -- <add|list|set-password|set-role|disable|enable> [options]  (see scripts/auth/users.mjs)");
      process.exitCode = cmd ? 1 : 0;
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
