"use client";

import dynamic from "next/dynamic";

// MapLibre needs the browser (WebGL, window), so the map is client-only.
const GeoMap = dynamic(() => import("./GeoMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-surface-2 text-sm text-muted">Loading map…</div>
  ),
});

export function MapExplorer() {
  return <GeoMap />;
}
