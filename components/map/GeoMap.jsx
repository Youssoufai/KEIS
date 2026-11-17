"use client";

// Intelligence Map – real geospatial data for Ankpa, Dekina and Adavi.
// Loads only derived layers from /api/geo/* (never the sample/demo store).
//
// URL parameters: ?s=<settlement id>  ?lga=<lga id>  ?ward=<ward id>

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { loadGeo } from "@/lib/geo/client";
import { cx } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { ALL_TOGGLES, BASEMAPS, COLORS, HREA_STOPS, LAZY_SOURCES, POP_STOPS, settlementColor } from "./layerConfig";
import { LayerPanel } from "./LayerPanel";
import { MapLegend } from "./MapLegend";
import { MapSearch } from "./MapSearch";
import { SettlementPanel } from "./SettlementPanel";

// See app/api/maplibre-worker/route.js
if (typeof window !== "undefined") maplibregl.setWorkerUrl(new URL("/api/maplibre-worker", window.location.origin).href);

const DATA_ATTRIBUTION =
  "Boundaries, settlements, facilities, roads: GRID3 · Population: WorldPop · Night lights: HREA · Grid: Nigeria SE4ALL (internal) · © OpenStreetMap contributors";

const EMPTY = { type: "FeatureCollection", features: [] };

/** Base filters per layer; the LGA filter is combined with these. */
const BASE_FILTERS = {
  "named-labels": ["!=", ["get", "name"], null],
  "named-dots": ["!=", ["get", "name"], null],
  "hrea-points": ["!=", ["get", "hrea"], null],
};
const LGA_FILTERED = ["settlements-fill", "settlements-outline", "settlements-points", "named-labels", "named-dots", "pop-heat", "hrea-points", "wards-line", "wards-label", "schools-layer", "health-layer", "markets-layer"];

function bboxOf(features) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  const walk = (c) => {
    if (typeof c[0] === "number") {
      x0 = Math.min(x0, c[0]);
      x1 = Math.max(x1, c[0]);
      y0 = Math.min(y0, c[1]);
      y1 = Math.max(y1, c[1]);
    } else c.forEach(walk);
  };
  for (const f of features) if (f.geometry) walk(f.geometry.coordinates);
  return [[x0, y0], [x1, y1]];
}

/** Popup content built with DOM nodes (no HTML injection from data). */
function popupNode(title, rows, { restricted, evidence }) {
  const el = document.createElement("div");
  el.className = "text-xs text-slate-800";
  const h = document.createElement("p");
  h.className = "mb-1 text-[13px] font-semibold";
  h.textContent = title;
  el.appendChild(h);
  for (const [k, v] of rows) {
    if (v == null || String(v).trim() === "") continue;
    const p = document.createElement("p");
    const b = document.createElement("span");
    b.className = "text-slate-500";
    b.textContent = `${k}: `;
    p.append(b, document.createTextNode(String(v)));
    el.appendChild(p);
  }
  const foot = document.createElement("p");
  foot.className = "mt-1.5 border-t border-slate-200 pt-1 text-[11px] text-slate-500";
  foot.textContent = `${evidence} data${restricted ? " · Internal only – SE4ALL licence unconfirmed" : ""}`;
  el.appendChild(foot);
  return el;
}

const POPUPS = {
  "health-layer": { ev: "Reported", f: (p) => [p.facility_name || "Health facility", [["Type", p.facility_type], ["Level", p.facility_level], ["Ownership", p.facility_ownership], ["Functional (reported)", p.functional]]] },
  "schools-layer": { ev: "Reported", f: (p) => [p.name || "School", [["Education", p.education], ["Management", p.management], ["Category", p.category]]] },
  "markets-layer": { ev: "Reported", f: (p) => [p.market_nam || "Market", [["Type", p.mrkt_type], ["Frequency", p.mrkt_frqcy]]] },
  "roads-layer": { ev: "Mapped", line: true, f: (p) => [p.names || "Road", [["Class", p.class], ["Surface", p.road_surface]]] },
  "mv-lines-layer": { ev: "Reported", line: true, restricted: true, f: (p) => [p.name || "Distribution line", [["Voltage (kV)", p.voltage_kv], ["Condition (reported)", p.condition]]] },
  "hv-lines-layer": { ev: "Reported", line: true, restricted: true, f: (p) => [p.name || "HV line", [["Voltage", p.volt]]] },
  "substations-layer": { ev: "Reported", restricted: true, f: (p) => [p.sub_name || "Substation", [["Voltage", p.volt]]] },
  "minigrids-layer": { ev: "Reported", restricted: true, f: (p) => [p.community ? `Mini-grid – ${p.community}` : "Mini-grid", [["System", p.power_system], ["Capacity (kW)", p.power_kw], ["Status", p.status], ["Condition", p.condition], ["Connections", p.number_of_connections], ["Location certainty", p.located]]] },
  "osm-power-layer": { ev: "Mapped", line: true, f: (p) => [p.name || (p.power === "substation" ? "Substation (OSM)" : "Power line (OSM)"), [["Voltage (V)", p.voltage], ["Operator", p.operator], ["OSM id", p.osm_id]]] },
};
const POINT_POPUP_LAYERS = Object.entries(POPUPS).filter(([, v]) => !v.line).map(([k]) => k);

function addLayers(map, { lgaFc, wardFc, setFc, points }) {
  const bm = BASEMAPS.streets;
  map.addSource("basemap", { type: "raster", tiles: bm.tiles, tileSize: 256, attribution: bm.attribution, maxzoom: 19 });
  map.addLayer({ id: "basemap", type: "raster", source: "basemap", paint: bm.paint });

  map.addSource("lgas", { type: "geojson", data: lgaFc });
  map.addSource("wards", { type: "geojson", data: wardFc });
  const labelPoints = (fc) => ({
    type: "FeatureCollection",
    features: fc.features.map((f) => ({ type: "Feature", properties: f.properties, geometry: { type: "Point", coordinates: [f.properties.labelLon, f.properties.labelLat] } })),
  });
  map.addSource("lga-labels", { type: "geojson", data: labelPoints(lgaFc) });
  map.addSource("ward-labels", { type: "geojson", data: labelPoints(wardFc) });
  map.addSource("settlements", { type: "geojson", data: setFc, promoteId: "id" });
  map.addSource("settlement-points", { type: "geojson", data: points, promoteId: "id" });
  for (const name of LAZY_SOURCES) map.addSource(name, { type: "geojson", data: EMPTY });

  const hidden = { visibility: "none" };
  map.addLayer({ id: "lga-mask", type: "fill", source: "lgas", paint: { "fill-color": "#ffffff", "fill-opacity": 0.12 } });
  map.addLayer({
    id: "pop-heat",
    type: "heatmap",
    source: "settlement-points",
    layout: hidden,
    maxzoom: 15,
    paint: {
      "heatmap-weight": ["interpolate", ["linear"], ["coalesce", ["get", "pop"], 0], 0, 0, 200, 0.2, 5000, 0.7, 50000, 1],
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 13, 2],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 10, 12, 28, 15, 50],
      "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(237,233,254,0)", 0.15, POP_STOPS[1][1], 0.4, POP_STOPS[2][1], 0.7, POP_STOPS[3][1], 1, POP_STOPS[4][1]],
      "heatmap-opacity": 0.75,
    },
  });
  map.addLayer({
    id: "settlements-fill",
    type: "fill",
    source: "settlements",
    minzoom: 11,
    paint: { "fill-color": settlementColor("type"), "fill-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.8, 15, 0.35] },
  });
  map.addLayer({ id: "settlements-outline", type: "line", source: "settlements", minzoom: 11, paint: { "line-color": "#1e1b4b", "line-width": 0.6, "line-opacity": 0.6 } });
  map.addLayer({ id: "roads-layer", type: "line", source: "roads", layout: hidden, paint: { "line-color": COLORS.road, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 14, 2.5] } });
  map.addLayer({ id: "wards-line", type: "line", source: "wards", paint: { "line-color": COLORS.ward, "line-width": 0.9, "line-dasharray": [3, 2], "line-opacity": 0.75 } });
  map.addLayer({ id: "osm-power-layer", type: "line", source: "osm-power", layout: hidden, paint: { "line-color": COLORS.osm, "line-width": 2, "line-dasharray": [0.5, 1.5] } });
  map.addLayer({ id: "mv-lines-layer", type: "line", source: "mv-lines", paint: { "line-color": COLORS.mv, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.3, 14, 3], "line-dasharray": [2, 1] } });
  map.addLayer({ id: "hv-lines-layer", type: "line", source: "hv-lines", paint: { "line-color": COLORS.hv, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2.2, 14, 4.5] } });
  map.addLayer({
    id: "settlements-points",
    type: "circle",
    source: "settlement-points",
    maxzoom: 11,
    paint: {
      "circle-color": settlementColor("type"),
      "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "buildings"]], 1, 2, 10, 3.5, 50, 7, 200, 12],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 0.6,
      "circle-opacity": 0.9,
    },
  });
  map.addLayer({
    id: "hrea-points",
    type: "circle",
    source: "settlement-points",
    layout: hidden,
    filter: BASE_FILTERS["hrea-points"],
    paint: {
      "circle-color": ["interpolate", ["linear"], ["get", "hrea"], ...HREA_STOPS.flat()],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 13, 7],
      "circle-stroke-color": "#111827",
      "circle-stroke-width": 0.8,
    },
  });
  map.addLayer({ id: "settlements-selected", type: "line", source: "settlements", filter: ["==", ["get", "id"], ""], paint: { "line-color": COLORS.selected, "line-width": 3 } });
  map.addLayer({ id: "settlements-selected-pt", type: "circle", source: "settlement-points", maxzoom: 11, filter: ["==", ["get", "id"], ""], paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": 11, "circle-stroke-color": COLORS.selected, "circle-stroke-width": 2.5 } });

  const pointStyle = (color, radius) => ({ "circle-color": color, "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, radius * 0.75, 14, radius * 1.4], "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.2 });
  map.addLayer({ id: "schools-layer", type: "circle", source: "schools", layout: hidden, paint: pointStyle(COLORS.school, 4) });
  map.addLayer({ id: "health-layer", type: "circle", source: "health", layout: hidden, paint: pointStyle(COLORS.health, 4.5) });
  map.addLayer({ id: "markets-layer", type: "circle", source: "markets", layout: hidden, paint: pointStyle(COLORS.market, 5) });
  map.addLayer({ id: "substations-layer", type: "circle", source: "substations", paint: { ...pointStyle(COLORS.hv, 6), "circle-stroke-width": 2 } });
  map.addLayer({ id: "minigrids-layer", type: "circle", source: "minigrids", paint: { ...pointStyle(COLORS.minigrid, 6.5), "circle-stroke-width": 2 } });

  map.addLayer({ id: "lga-line", type: "line", source: "lgas", paint: { "line-color": COLORS.lga, "line-width": 2.6 } });
  map.addLayer({ id: "ward-selected", type: "line", source: "wards", filter: ["==", ["get", "id"], ""], paint: { "line-color": COLORS.selected, "line-width": 2.5 } });
  const text = (size, color, halo = 1.4) => ({ paint: { "text-color": color, "text-halo-color": "#ffffff", "text-halo-width": halo }, size });
  map.addLayer({
    id: "wards-label",
    type: "symbol",
    source: "ward-labels",
    minzoom: 9.6,
    layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 11, "text-letter-spacing": 0.04, "text-transform": "uppercase" },
    ...{ paint: text(11, "#55657f").paint },
  });
  map.addLayer({ id: "named-dots", type: "circle", source: "settlement-points", minzoom: 10, filter: BASE_FILTERS["named-dots"], paint: { "circle-radius": 2, "circle-color": "#111827" } });
  map.addLayer({
    id: "named-labels",
    type: "symbol",
    source: "settlement-points",
    minzoom: 10,
    filter: BASE_FILTERS["named-labels"],
    layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10.5, 14, 13], "text-offset": [0, 0.9], "text-anchor": "top", "text-optional": true },
    paint: text(11, "#111827").paint,
  });
  map.addLayer({
    id: "lga-label",
    type: "symbol",
    source: "lga-labels",
    maxzoom: 10,
    layout: { "text-field": ["upcase", ["concat", ["get", "name"], " LGA"]], "text-font": ["Noto Sans Regular"], "text-size": 13, "text-letter-spacing": 0.12 },
    paint: text(13, COLORS.lga, 2).paint,
  });
}

export default function GeoMap() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const requested = useRef(new Set()); // lazy sources already requested
  const skipFly = useRef(false); // selection came from a map click: don't move the camera
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [core, setCore] = useState(null); // { meta, sources, lgas, wards, byId, grid }
  const [visible, setVisible] = useState(() => new Set(ALL_TOGGLES.filter((t) => t.defaultOn).map((t) => t.id)));
  const [colorMode, setColorMode] = useState("type");
  const [basemap, setBasemap] = useState("streets");
  const [dataLoaded, setDataLoaded] = useState(() => new Set());
  const [panelOpen, setPanelOpen] = useState(false); // mobile layer drawer
  const [legendOpen, setLegendOpen] = useState(() => typeof window === "undefined" || window.innerHeight > 820);
  const lgaRef = useRef("all");

  // The URL is the source of truth for selection and focus, so every map
  // state can be shared as a link: ?s=<settlement> &lga=<lga> &ward=<ward>
  const selectedId = params.get("s");
  const lga = params.get("lga") || "all";
  const wardParam = params.get("ward");
  const setParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) v ? next.set(k, v) : next.delete(k);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );
  const setParamsRef = useRef(setParams);
  useEffect(() => {
    setParamsRef.current = setParams;
  }, [setParams]);

  // ---- init
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
        sources: {},
        layers: [{ id: "background", type: "background", paint: { "background-color": "#eceeea" } }],
      },
      center: [6.95, 7.55],
      zoom: 8.5,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 120 }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: DATA_ATTRIBUTION }), "bottom-right");

    let cancelled = false;
    map.on("load", async () => {
      try {
        const [lgaFc, wardFc, setFc, meta, sources, grid] = await Promise.all(
          ["lgas", "wards", "settlements", "settlements-meta", "sources", "settlement-grid-indicators"].map(loadGeo),
        );
        if (cancelled) return;
        const features = setFc.features.map((f) => ({ ...f, properties: { ...f.properties, flagCount: f.properties.flags?.length || 0 } }));
        const points = {
          type: "FeatureCollection",
          features: features.map((f) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [f.properties.lon, f.properties.lat] },
            properties: (({ id, lga, type, buildings, hrea, pop, flagCount, name }) => ({ id, lga, type, buildings, hrea, pop, flagCount, name }))(f.properties),
          })),
        };
        const byId = new Map(features.map((f) => [f.properties.id, f.properties]));
        addLayers(map, { lgaFc, wardFc, setFc: { type: "FeatureCollection", features }, points });

        const select = (e) => {
          const pts = POINT_POPUP_LAYERS.filter((l) => map.getLayer(l) && map.getLayoutProperty(l, "visibility") !== "none");
          if (pts.length && map.queryRenderedFeatures(e.point, { layers: pts }).length) return;
          const id = e.features?.[0]?.properties?.id;
          if (id) {
            skipFly.current = true;
            setParamsRef.current({ s: id });
          }
        };
        const hover = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: "pointer-events-none" });
        for (const id of ["settlements-fill", "settlements-points", "hrea-points"]) {
          map.on("click", id, select);
          map.on("mousemove", id, (e) => {
            map.getCanvas().style.cursor = "pointer";
            const p = e.features?.[0]?.properties;
            if (!p) return;
            const s = byId.get(p.id);
            const el = document.createElement("div");
            el.className = "text-xs";
            const t = document.createElement("p");
            t.className = "font-semibold";
            t.textContent = s?.name || (s?.namedPlaces?.length ? `${s.type} · ${s.namedPlaces.length} named places` : `Unnamed ${String(p.type).toLowerCase()}`);
            const sub = document.createElement("p");
            sub.className = "text-slate-500";
            sub.textContent = `${Number(p.buildings).toLocaleString("en")} buildings${p.pop != null ? ` · ~${Number(p.pop).toLocaleString("en")} people (modelled)` : ""}`;
            el.append(t, sub);
            hover.setLngLat(e.lngLat).setDOMContent(el).addTo(map);
          });
          map.on("mouseleave", id, () => {
            map.getCanvas().style.cursor = "";
            hover.remove();
          });
        }
        for (const [layer, cfg] of Object.entries(POPUPS)) {
          map.on("click", layer, (e) => {
            const f = e.features?.[0];
            if (!f) return;
            if (cfg.line && map.queryRenderedFeatures(e.point, { layers: ["settlements-fill", "settlements-points"] }).length) return;
            const [title, rows] = cfg.f(f.properties);
            new maplibregl.Popup({ maxWidth: "280px" }).setLngLat(e.lngLat).setDOMContent(popupNode(title, rows, { restricted: cfg.restricted, evidence: cfg.ev })).addTo(map);
          });
          map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
        }

        const lgaList = lgaFc.features.map((f) => ({ ...f.properties, bounds: bboxOf([f]) }));
        map.fitBounds(bboxOf(lgaFc.features), { padding: 40, duration: 0 });
        // Start with the attribution collapsed to its (i) button.
        containerRef.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
        setCore({ meta, sources: sources.sources, lgas: lgaList, allBounds: bboxOf(lgaFc.features), wards: wardFc.features, byId, grid });
        setReady(true);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    });
    map.on("error", (e) => {
      // Tile/glyph failures are non-fatal (offline basemap); data errors surface via load().
      if (e?.sourceId && !["basemap"].includes(e.sourceId)) console.warn("map source error", e.sourceId);
    });
    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ---- LGA filter
  const applyFilters = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const id = lgaRef.current;
    for (const layer of LGA_FILTERED) {
      if (!map.getLayer(layer)) continue;
      const parts = [BASE_FILTERS[layer], id === "all" ? null : ["==", ["get", "lga"], id]].filter(Boolean);
      map.setFilter(layer, parts.length === 0 ? null : parts.length === 1 ? parts[0] : ["all", ...parts]);
    }
  }, []);

  const chooseLga = useCallback((id) => setParams({ lga: id === "all" ? null : id, ward: null }), [setParams]);

  // ---- LGA focus (from URL)
  useEffect(() => {
    if (!ready || !core) return;
    lgaRef.current = lga;
    applyFilters();
    const target = core.lgas.find((l) => l.id === lga);
    if (!selectedId) mapRef.current?.fitBounds(target ? target.bounds : core.allBounds, { padding: 40 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the LGA changes
  }, [lga, ready, core, applyFilters]);

  // ---- ward focus (from URL)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !core || !map) return;
    map.setFilter("ward-selected", ["==", ["get", "id"], wardParam || ""]);
    const w = wardParam && core.wards.find((f) => f.properties.id === wardParam);
    if (w) map.fitBounds(bboxOf([w]), { padding: 60 });
  }, [wardParam, ready, core]);

  // ---- visibility + lazy data
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    for (const t of ALL_TOGGLES) {
      const on = visible.has(t.id);
      for (const id of t.mapLayers) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
      if (!on || !t.data) continue;
      for (const name of t.data) {
        if (requested.current.has(name)) continue;
        requested.current.add(name);
        loadGeo(name)
          .then((fc) => {
            mapRef.current?.getSource(name)?.setData(fc);
            setDataLoaded((s) => new Set(s).add(name));
          })
          .catch((e) => {
            requested.current.delete(name);
            setError(`Could not load ${t.label}: ${e.message}`);
          });
      }
    }
    applyFilters();
  }, [visible, ready, applyFilters]);

  // ---- colour mode
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setPaintProperty("settlements-fill", "fill-color", settlementColor(colorMode));
    map.setPaintProperty("settlements-points", "circle-color", settlementColor(colorMode));
  }, [colorMode, ready]);

  // ---- basemap
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const bm = BASEMAPS[basemap];
    if (map.getLayer("basemap")) map.removeLayer("basemap");
    if (map.getSource("basemap")) map.removeSource("basemap");
    if (bm.tiles) {
      map.addSource("basemap", { type: "raster", tiles: bm.tiles, tileSize: 256, attribution: bm.attribution, maxzoom: 19 });
      map.addLayer({ id: "basemap", type: "raster", source: "basemap", paint: bm.paint }, "lga-mask");
    }
  }, [basemap, ready]);

  const flyTo = useCallback((lon, lat, zoom = 14) => {
    const map = mapRef.current;
    if (map) map.flyTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), zoom), essential: true });
  }, []);

  // ---- selection (from URL): highlight, and fly unless it came from a map click
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !core || !map) return;
    map.setFilter("settlements-selected", ["==", ["get", "id"], selectedId || ""]);
    map.setFilter("settlements-selected-pt", ["==", ["get", "id"], selectedId || ""]);
    const rec = selectedId && core.byId.get(selectedId);
    if (rec && !skipFly.current) flyTo(rec.lon, rec.lat);
    skipFly.current = false;
  }, [selectedId, ready, core, flyTo]);

  const selectSettlement = useCallback((id) => setParams({ s: id }), [setParams]);

  const loading = useMemo(
    () => new Set(ALL_TOGGLES.filter((t) => visible.has(t.id) && t.data?.some((n) => !dataLoaded.has(n))).map((t) => t.id)),
    [visible, dataLoaded],
  );

  const toggle = (id) =>
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selected = selectedId && core ? core.byId.get(selectedId) : null;

  const summary = useMemo(() => {
    if (!core) return null;
    const ids = lga === "all" ? Object.keys(core.meta.summary) : [lga];
    const sum = (fn) => ids.reduce((a, id) => a + (fn(core.meta.summary[id]) ?? 0), 0);
    return {
      settlements: sum((s) => s.settlements),
      named: sum((s) => s.namedSettlements),
      population: ids.every((id) => core.meta.summary[id].populationLga != null) ? sum((s) => s.populationLga) : null,
      schools: sum((s) => s.schools),
      health: sum((s) => s.healthFacilities),
      wards: sum((s) => s.wards),
    };
  }, [core, lga]);

  return (
    <div className="absolute inset-0 flex">
      {/* Left: layers & filters (drawer on small screens) */}
      <div
        className={cx(
          "z-20 w-[300px] shrink-0 border-r border-border bg-surface",
          "max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:shadow-xl max-lg:transition-transform",
          panelOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
        )}
      >
        <LayerPanel
          ready={ready}
          lgas={core?.lgas || []}
          lga={lga}
          onLga={chooseLga}
          summary={summary}
          visible={visible}
          onToggle={toggle}
          loading={loading}
          colorMode={colorMode}
          onColorMode={setColorMode}
          basemap={basemap}
          onBasemap={setBasemap}
          sources={core?.sources}
          onClose={() => setPanelOpen(false)}
        />
      </div>

      {/* Centre: map */}
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-0">
          <div ref={containerRef} className="h-full w-full" role="region" aria-label="Map of Ankpa, Dekina and Adavi LGAs" />
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start gap-2 pr-12">
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="pointer-events-auto flex items-center gap-1.5 rounded-sm border border-border bg-white px-2.5 py-2 text-sm font-medium shadow-sm lg:hidden"
          >
            <Icon name="layers" className="size-4" /> Layers
          </button>
          <MapSearch core={core} onSettlement={(id) => selectSettlement(id)} onLga={chooseLga} onPoint={(lon, lat) => flyTo(lon, lat, 13)} />
          {core && (
            <div className="pointer-events-auto hidden items-center rounded-sm border border-border bg-white p-0.5 shadow-sm md:flex" role="group" aria-label="Focus LGA">
              {[{ id: "all", name: "All LGAs" }, ...core.lgas].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => chooseLga(l.id)}
                  aria-pressed={lga === l.id}
                  className={cx("rounded-[3px] px-2.5 py-1.5 text-xs font-medium", lga === l.id ? "bg-brand text-white" : "text-foreground hover:bg-slate-100")}
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {!ready && !error && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-surface-2/80">
            <div className="flex items-center gap-3 text-sm text-muted">
              <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden />
              Loading geospatial layers…
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-x-3 top-16 z-20 flex items-start justify-between gap-3 rounded-sm border border-critical/30 bg-critical-soft px-3 py-2 text-sm text-[#6b150e]" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss" className="shrink-0">
              <Icon name="close" className="size-4" />
            </button>
          </div>
        )}
        {ready && <MapLegend visible={visible} colorMode={colorMode} open={legendOpen} onToggle={() => setLegendOpen((o) => !o)} />}
      </div>

      {/* Right: settlement intelligence */}
      {selected && (
        <div className="z-20 w-[380px] shrink-0 border-l border-border bg-surface max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:h-[62%] max-md:w-full max-md:border-l-0 max-md:border-t max-md:shadow-[0_-8px_24px_rgb(15_30_51/0.18)]">
          <SettlementPanel
            settlement={selected}
            grid={core.grid[selected.id]}
            meta={core.meta}
            lgas={core.lgas}
            onZoom={() => flyTo(selected.lon, selected.lat, 15)}
            onClose={() => selectSettlement(null)}
          />
        </div>
      )}
    </div>
  );
}
