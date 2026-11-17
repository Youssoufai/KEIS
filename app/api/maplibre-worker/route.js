// Serves MapLibre's web-worker module from the installed package.
//
// MapLibre v6 locates its worker relative to its own module URL, which the
// bundler rewrites, so the map calls setWorkerUrl() with this route instead.
// Serving it from node_modules keeps the worker in sync with the library version.

import { readFile } from "node:fs/promises";
import path from "node:path";

const WORKER = path.join(process.cwd(), "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");

export async function GET() {
  const body = await readFile(WORKER);
  return new Response(body, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
