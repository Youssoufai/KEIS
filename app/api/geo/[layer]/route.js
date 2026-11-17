// Serves derived geospatial layers built by scripts/data/build.mjs.
//
// Only the layers listed below can be requested. Layers marked restricted come
// from sources whose licence is unconfirmed (SE4ALL). They are for the
// internal map only and must not be used by public pages or public exports.
//
// Every layer requires a signed-in user (checked here, not only in proxy.js);
// restricted layers additionally require the viewRestrictedData permission.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { authorizeRequest } from "@/lib/auth/dal";

const DERIVED = path.join(process.cwd(), "data", "derived");

const LAYERS = {
  lgas: { file: "lgas.geojson", restricted: false },
  wards: { file: "wards.geojson", restricted: false },
  settlements: { file: "settlements.geojson", restricted: false },
  "settlements-meta": { file: "settlements-meta.json", restricted: false },
  sources: { file: "sources.json", restricted: false },
  health: { file: "health.geojson", restricted: false },
  schools: { file: "schools.geojson", restricted: false },
  markets: { file: "markets.geojson", restricted: false },
  roads: { file: "roads.geojson", restricted: false },
  "osm-power": { file: "osmPower.geojson", restricted: false },
  "mv-lines": { file: "restricted/mvLines.geojson", restricted: true },
  "hv-lines": { file: "restricted/hvLines.geojson", restricted: true },
  substations: { file: "restricted/substations.geojson", restricted: true },
  minigrids: { file: "restricted/minigrids.geojson", restricted: true },
  "settlement-grid-indicators": { file: "restricted/settlement-grid-indicators.json", restricted: true },
};

export async function GET(_request, { params }) {
  const { layer } = await params;
  const entry = LAYERS[layer];
  if (!entry) return Response.json({ error: "Unknown layer" }, { status: 404 });
  const auth = await authorizeRequest(entry.restricted ? "viewRestrictedData" : null);
  if (auth.response) return auth.response;
  let body;
  try {
    body = await readFile(path.join(DERIVED, entry.file));
  } catch {
    return Response.json({ error: "Layer not built. Run npm run data:build." }, { status: 503 });
  }
  return new Response(body, {
    headers: {
      "Content-Type": entry.file.endsWith(".geojson") ? "application/geo+json" : "application/json",
      // Authenticated content: never cache in shared caches.
      "Cache-Control": "private, max-age=300",
      Vary: "Cookie",
      "X-Data-Restricted": entry.restricted ? "internal-only; licence unconfirmed" : "no",
    },
  });
}
