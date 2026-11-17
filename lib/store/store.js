"use client";

// Client-side prototype data store persisted to localStorage.
//
// PROTOTYPE ONLY: data lives in this browser. It is not shared between users
// or devices and is not a production database (agreed scope, FRD §9 item 9
// still open). Identity and role come from the server session (lib/auth); the
// store only records who made a change, it does not decide what they may do.

import { useSyncExternalStore } from "react";
import { createSeedData, SCHEMA_VERSION } from "@/lib/data/seed";

const DATA_KEY = "kogi-ren:data";

const SERVER_DATA = createSeedData();
let data = null;
let actor = null;
const listeners = new Set();

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false; // private mode / quota exceeded – prototype continues in memory
  }
}

function loadData() {
  const raw = readStorage(DATA_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.schemaVersion === SCHEMA_VERSION) return parsed;
    } catch {
      /* fall through to seed */
    }
  }
  return createSeedData();
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (e.key === DATA_KEY) data = loadData();
    if (e.key === DATA_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getData() {
  if (data === null) data = loadData();
  return data;
}

/** Set by components/auth/UserProvider from the authenticated session. */
export function setActivityActor(user) {
  actor = user ? { userId: user.id, name: user.name, role: user.role } : null;
}

// ---- Public API -----------------------------------------------------------

/**
 * Apply a mutation. `recipe` receives a deep copy of the data and may mutate
 * it freely. Optionally logs an activity entry.
 */
export function updateData(recipe, activity) {
  const next = structuredClone(getData());
  recipe(next);
  if (activity) {
    next.activity = [{ at: new Date().toISOString(), ...actor, ...activity }, ...(next.activity || [])].slice(0, 200);
  }
  data = next;
  writeStorage(DATA_KEY, JSON.stringify(next));
  emit();
  return next;
}

export function resetDemoData() {
  data = createSeedData();
  writeStorage(DATA_KEY, JSON.stringify(data));
  emit();
}

export function useData() {
  return useSyncExternalStore(subscribe, getData, () => SERVER_DATA);
}

const noopSubscribe = () => () => {};
/** False during server render / hydration, true once running in the browser. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function getCurrentAssumptions(d) {
  return d.assumptionSets.find((a) => a.id === d.currentAssumptionSetId) || d.assumptionSets[0];
}
