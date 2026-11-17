// Layer registry and colour configuration for the Intelligence Map.
//
// Data comes ONLY from /api/geo/* (built by scripts/data/build.mjs from real
// sources). The map never reads the sample/demo store.
//
// Colours avoid the red/orange/green electricity-status palette (FRD Cat. 2):
// nothing on this map is an electricity status.

export const COLORS = {
  lga: "#0f1e33",
  ward: "#3d4f6b",
  road: "#7b8494",
  school: "#0e7490",
  health: "#be185d",
  market: "#8a6a00",
  mv: "#9a3412",
  hv: "#3f0d0d",
  minigrid: "#155e75",
  osm: "#7c2d12",
  selected: "#e11d48",
};

export const EXTENT_TYPES = [
  { value: "Built-up Area", label: "Built-up area", color: "#3b0764" },
  { value: "Small Settlement Area", label: "Small settlement", color: "#7e22ce" },
  { value: "Hamlet", label: "Hamlet", color: "#c084fc" },
];

export const UNKNOWN_COLOR = "#cfd3d9";

// Night-light metaphor: dark = low modelled likelihood, bright = high.
export const HREA_STOPS = [
  [0, "#3f3f46"],
  [0.1, "#78716c"],
  [0.25, "#a16207"],
  [0.5, "#eab308"],
  [1, "#fde68a"],
];

export const POP_STOPS = [
  [0, "#ede9fe"],
  [100, "#c4b5fd"],
  [1000, "#8b5cf6"],
  [10000, "#5b21b6"],
  [50000, "#2e1065"],
];

export const COLOR_MODES = [
  { id: "type", label: "Settlement type" },
  { id: "pop", label: "Population (modelled)" },
  { id: "hrea", label: "Night-light likelihood" },
  { id: "flags", label: "Data-quality flags" },
];

export function settlementColor(mode) {
  if (mode === "hrea") {
    return ["case", ["==", ["get", "hrea"], null], UNKNOWN_COLOR, ["interpolate", ["linear"], ["get", "hrea"], ...HREA_STOPS.flat()]];
  }
  if (mode === "pop") {
    return ["case", ["==", ["get", "pop"], null], UNKNOWN_COLOR, ["interpolate", ["linear"], ["get", "pop"], ...POP_STOPS.flat()]];
  }
  if (mode === "flags") return ["case", [">", ["get", "flagCount"], 0], "#db2777", "#9ca3af"];
  return ["match", ["get", "type"], ...EXTENT_TYPES.flatMap((t) => [t.value, t.color]), UNKNOWN_COLOR];
}

/**
 * Toggleable layers, grouped by evidence class.
 *  mapLayers – MapLibre layer ids controlled by the toggle
 *  data      – lazily loaded /api/geo/<name> resources (core layers load at start)
 *  sourceKey – key in sources.json, for provenance
 *  swatch    – legend symbol
 */
export const LAYER_GROUPS = [
  {
    id: "boundaries",
    label: "Administrative boundaries",
    evidence: "official",
    layers: [
      { id: "lga", label: "LGA boundaries", mapLayers: ["lga-line", "lga-label"], sourceKey: "lgas", defaultOn: true, swatch: { kind: "line", color: COLORS.lga, width: 3 } },
      { id: "wards", label: "Ward boundaries", mapLayers: ["wards-line", "wards-label"], sourceKey: "wards", defaultOn: true, swatch: { kind: "line", color: COLORS.ward, dash: true } },
    ],
  },
  {
    id: "settlements",
    label: "Settlements & population",
    evidence: "modelled",
    layers: [
      { id: "settlements", label: "Settlement extents", mapLayers: ["settlements-fill", "settlements-outline", "settlements-points"], sourceKey: "settlementBlocks", defaultOn: true, swatch: { kind: "fill", color: EXTENT_TYPES[1].color } },
      { id: "named", label: "Named settlements", mapLayers: ["named-labels", "named-dots"], sourceKey: "settlementPoints", evidence: "reported", defaultOn: true, swatch: { kind: "text" } },
      { id: "population", label: "Population distribution", mapLayers: ["pop-heat"], sourceKey: "population", defaultOn: false, swatch: { kind: "ramp", stops: POP_STOPS } },
      { id: "nightlight", label: "Night-light indicator (2020)", mapLayers: ["hrea-points"], sourceKey: "electrification", defaultOn: false, swatch: { kind: "ramp", stops: HREA_STOPS } },
    ],
  },
  {
    id: "social",
    label: "Social infrastructure",
    evidence: "reported",
    layers: [
      { id: "schools", label: "Schools", mapLayers: ["schools-layer"], data: ["schools"], sourceKey: "schools", defaultOn: false, swatch: { kind: "point", color: COLORS.school } },
      { id: "health", label: "Health facilities", mapLayers: ["health-layer"], data: ["health"], sourceKey: "healthFacilities", defaultOn: false, swatch: { kind: "point", color: COLORS.health } },
      { id: "markets", label: "Markets", mapLayers: ["markets-layer"], data: ["markets"], sourceKey: "markets", defaultOn: false, swatch: { kind: "point", color: COLORS.market } },
    ],
  },
  {
    id: "transport",
    label: "Transport",
    evidence: "mapped",
    layers: [{ id: "roads", label: "Roads (trunk–tertiary)", mapLayers: ["roads-layer"], data: ["roads"], sourceKey: "roads", defaultOn: false, swatch: { kind: "line", color: COLORS.road } }],
  },
  {
    id: "power",
    label: "Electricity infrastructure",
    evidence: "reported",
    note: "Mapped infrastructure only. A settlement far from a mapped line is not known to be unelectrified.",
    layers: [
      { id: "mv", label: "33 / 11 kV distribution lines", mapLayers: ["mv-lines-layer"], data: ["mv-lines"], sourceKey: "mvLines", restricted: true, defaultOn: true, swatch: { kind: "line", color: COLORS.mv, dash: true } },
      { id: "hv", label: "HV lines & substations", mapLayers: ["hv-lines-layer", "substations-layer"], data: ["hv-lines", "substations"], sourceKey: "hvLines", restricted: true, defaultOn: true, swatch: { kind: "line", color: COLORS.hv, width: 3 } },
      { id: "minigrids", label: "Mini-grids", mapLayers: ["minigrids-layer"], data: ["minigrids"], sourceKey: "minigrids", restricted: true, defaultOn: true, swatch: { kind: "square", color: COLORS.minigrid } },
      { id: "osm", label: "Power lines (OpenStreetMap)", mapLayers: ["osm-power-layer"], data: ["osm-power"], sourceKey: "osmPower", evidence: "mapped", defaultOn: false, swatch: { kind: "line", color: COLORS.osm, dotted: true } },
    ],
  },
];

export const ALL_TOGGLES = LAYER_GROUPS.flatMap((g) => g.layers.map((l) => ({ ...l, group: g.id, evidence: l.evidence || g.evidence })));

/** Lazily loaded sources: name → initial empty data. */
export const LAZY_SOURCES = ["schools", "health", "markets", "roads", "mv-lines", "hv-lines", "substations", "minigrids", "osm-power"];

export const BASEMAPS = {
  streets: {
    label: "Streets",
    // OSM standard tiles (no API key). Acceptable for an internal prototype; a
    // production deployment needs its own or a commercial tile service.
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    paint: { "raster-saturation": -0.75, "raster-opacity": 0.8 },
  },
  satellite: {
    label: "Satellite",
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    paint: {},
  },
  none: { label: "None", tiles: null },
};
