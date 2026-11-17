"use client";

// Shared client-side loader for derived geospatial layers (/api/geo/*).
//
// Each layer is fetched once per page load and shared between the map,
// settlement table, overview and search. This module only ever reads the
// pipeline outputs – never the sample/demo store.

import { useEffect, useState } from "react";

const cache = new Map();

export function loadGeo(name) {
  if (!cache.has(name)) {
    const p = fetch(`/api/geo/${name}`).then(async (res) => {
      if (!res.ok) throw new Error(`${name}: ${res.status === 503 ? "layer not built yet (run npm run data:build)" : `HTTP ${res.status}`}`);
      return res.json();
    });
    p.catch(() => cache.delete(name)); // allow retry after a failure
    cache.set(name, p);
  }
  return cache.get(name);
}

/** Settlement records (properties only) merged with the internal grid indicators. */
export async function loadSettlementRecords() {
  if (!cache.has("__records")) {
    const p = Promise.all([loadGeo("settlements"), loadGeo("settlement-grid-indicators")]).then(([fc, grid]) =>
      fc.features.map((f) => ({ ...f.properties, ...(grid[f.properties.id] || {}) })),
    );
    p.catch(() => cache.delete("__records"));
    cache.set("__records", p);
  }
  return cache.get("__records");
}

/**
 * React hook: load several geo resources.
 * Returns { data: {name: value} | null, error: string | null }.
 * `records` is a pseudo-resource for loadSettlementRecords().
 */
export function useGeo(names) {
  const key = names.join("|");
  const [state, setState] = useState({ key: null, data: null, error: null });
  useEffect(() => {
    let alive = true;
    const list = key.split("|");
    Promise.all(list.map((n) => (n === "records" ? loadSettlementRecords() : loadGeo(n))))
      .then((values) => alive && setState({ key, data: Object.fromEntries(list.map((n, i) => [n, values[i]])), error: null }))
      .catch((err) => alive && setState({ key, data: null, error: err.message }));
    return () => {
      alive = false;
    };
  }, [key]);
  return state.key === key ? { data: state.data, error: state.error } : { data: null, error: null };
}

/** Display name for a settlement record – never invented. */
export function settlementLabel(s) {
  if (s.name) return s.name;
  if (s.namedPlaces?.length) return `${s.type} · ${s.namedPlaces.length} named places`;
  return `Unnamed ${String(s.type || "settlement").toLowerCase()}`;
}

/** Great-circle distance in km. */
export function distanceKm([lon1, lat1], [lon2, lat2]) {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r;
  const dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}
