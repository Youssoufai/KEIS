// Source registry for the geospatial pipeline.
//
// Every dataset the pipeline touches is declared here once, with its licence,
// evidence class and known limitations. fetch.mjs records retrieval dates in
// data/raw/manifest.json; build.mjs copies this metadata onto every derived
// layer and indicator so nothing loses its provenance.
//
// Evidence classes (see docs/DATA_SOURCES.md):
//   official  – administrative boundaries published by a government/mandated body
//   reported  – records collected/reported by an agency or survey (not field-verified by us)
//   mapped    – crowd- or remotely-mapped features (e.g. OSM)
//   modelled  – derived from models/satellite inference; an estimate, not an observation
//   measured  – direct instrument measurement (e.g. satellite radiance)
//   verified  – confirmed by a project field officer (never produced by this pipeline)
//   unknown   – no usable evidence
//
// publicUse: false means the licence is unclear or unconfirmed. Such layers
// may be used for internal analysis but MUST NOT be shown on public-facing
// pages or included in public exports until permission is confirmed.

export const PILOT_STATE = "Kogi";
export const PILOT_LGA_NAMES = ["Ankpa", "Dekina", "Adavi"];

// Search window only. Derived from GRID3 ward boundaries of the three LGAs plus
// a small margin. It is NOT an analysis boundary: build.mjs clips everything to
// the real LGA polygons. [minLon, minLat, maxLon, maxLat]
export const FETCH_BBOX = [6.1, 7.25, 7.85, 7.9];

const GRID3 = "https://services3.arcgis.com/BU6Aadhn6tbBEdyk/arcgis/rest/services";
const SE4ALL_WFS = "https://data.nigeriase4all.gov.ng/geoserver/ows";

export const SOURCES = {
  lgas: {
    title: "LGA boundaries",
    provider: "GRID3 Nigeria (source: WHO/eHealth Africa)",
    kind: "arcgis",
    url: `${GRID3}/NGA_LGA_Boundaries_2/FeatureServer/0`,
    where: `statename='${PILOT_STATE}' AND lganame IN (${PILOT_LGA_NAMES.map((n) => `'${n}'`).join(",")})`,
    licence: "CC BY 4.0",
    publicUse: true,
    evidence: "official",
    datasetDate: "2019",
    limitations: [
      "Operational boundaries for vaccination planning; not a gazetted legal boundary.",
      "Edges do not align exactly with the GRID3 v4.0 ward boundaries (see validation report).",
    ],
  },
  wards: {
    title: "Operational ward boundaries v4.0",
    provider: "GRID3 Nigeria",
    kind: "arcgis",
    url: `${GRID3}/GRID3_NGA_operational_wards_v4_0/FeatureServer/0`,
    where: `state='${PILOT_STATE}' AND lga IN (${PILOT_LGA_NAMES.map((n) => `'${n}'`).join(",")})`,
    licence: "Open with attribution (GRID3 terms)",
    publicUse: true,
    evidence: "official",
    datasetDate: "2026-10-16",
    limitations: ["Operational wards; names may differ from INEC registration-area names."],
  },
  settlementBlocks: {
    title: "Settlement extents v4.1 (block level)",
    provider: "GRID3 Nigeria",
    kind: "arcgis",
    url: `${GRID3}/GRID3_NGA_settlement_extents_v4_1/FeatureServer/0`,
    spatial: true,
    outFields: [
      "block_id", "building_count", "building_area_sum", "block_area_sqm",
      "block_neighbor_count", "extent_type", "mgrs_code", "blocks_per_settl_extent",
    ],
    licence: "Open with attribution (GRID3 terms; confirm exact licence)",
    publicUse: true,
    evidence: "modelled",
    datasetDate: "2025 (v4.1)",
    limitations: [
      "Rows are settlement BLOCKS, not settlements; blocks are aggregated into settlement extents by build.mjs.",
      "Derived from building-footprint models; small or new settlements may be missing.",
      "No settlement names; names come only from GRID3 named settlement points.",
    ],
  },
  settlementPoints: {
    title: "Named settlement points",
    provider: "GRID3 Nigeria",
    kind: "arcgis",
    url: `${GRID3}/Settlements_in_Nigeria/FeatureServer/0`,
    spatial: true,
    licence: "CC BY 4.0",
    publicUse: true,
    evidence: "reported",
    datasetDate: "2018 (field collection)",
    limitations: ["Sparse in Adavi LGA.", "Names as recorded in 2018; spelling not field-verified."],
  },
  healthFacilities: {
    title: "Health facilities v4.0",
    provider: "GRID3 Nigeria",
    kind: "arcgis",
    url: `${GRID3}/GRID3_NGA_Health_Facilities_v4_0/FeatureServer/0`,
    spatial: true,
    outFields: ["facility_name", "facility_level", "facility_type", "facility_ownership", "functional", "ward_standard", "lga_standard"],
    licence: "Open with attribution (GRID3 terms)",
    publicUse: true,
    evidence: "reported",
    datasetDate: "2026",
    limitations: ["'functional' flag is reported, not field-verified.", "Electricity status of facilities is not recorded."],
  },
  schools: {
    title: "Schools",
    provider: "GRID3 Nigeria",
    kind: "arcgis",
    url: `${GRID3}/Schools_in_Nigeria/FeatureServer/0`,
    spatial: true,
    outFields: ["name", "education", "management", "category", "subtype", "lganame", "wardname"],
    licence: "CC BY 4.0",
    publicUse: true,
    evidence: "reported",
    datasetDate: "2018–2019",
    limitations: ["Older dataset; closures and new schools since collection are not reflected."],
  },
  markets: {
    title: "Markets",
    provider: "GRID3 Nigeria",
    kind: "arcgis",
    url: `${GRID3}/Markets_in_Nigeria/FeatureServer/0`,
    spatial: true,
    outFields: ["market_nam", "mrkt_type", "mrkt_frqcy", "lganame", "wardname"],
    licence: "CC BY 4.0",
    publicUse: true,
    evidence: "reported",
    datasetDate: "2018–2019",
    limitations: ["Very few markets recorded in the pilot area; absence is not evidence of no market."],
  },
  roads: {
    title: "Roads (trunk to tertiary)",
    provider: "GRID3 Nigeria (built from Overture/OSM and Meta data)",
    kind: "arcgis",
    url: `${GRID3}/GRID3_NGA_roads/FeatureServer/0`,
    spatial: true,
    where: "class IN ('motorway','trunk','primary','secondary','tertiary')",
    outFields: ["class", "names", "road_surface"],
    licence: "Open with attribution (GRID3 terms; underlying ODbL for OSM-derived segments)",
    publicUse: true,
    evidence: "mapped",
    datasetDate: "2025",
    limitations: ["Only trunk–tertiary classes are fetched; residential roads and tracks are excluded.", "Road condition is not recorded."],
  },
  mvLines: {
    title: "33 kV / 11 kV distribution lines",
    provider: "Nigeria SE4ALL platform (REA)",
    kind: "wfs",
    url: SE4ALL_WFS,
    typeName: "se4allWS:distribution_line_all_no_modell_mv",
    licence: "Not stated",
    publicUse: false,
    evidence: "reported",
    datasetDate: "Unknown (platform data, retrieved live)",
    limitations: [
      "Licence not stated: internal use only until SE4ALL/REA confirms permission.",
      "Utility-reported network; completeness and energisation are unknown.",
      "A line nearby does NOT mean a settlement is connected; no line nearby does NOT mean it is unelectrified.",
    ],
  },
  hvLines: {
    title: "High-voltage transmission lines",
    provider: "Nigeria SE4ALL platform (REA)",
    kind: "wfs",
    url: SE4ALL_WFS,
    typeName: "geonode:existing_lines_high_voltage",
    licence: "Not stated",
    publicUse: false,
    evidence: "reported",
    datasetDate: "Unknown (platform data, retrieved live)",
    limitations: ["Licence not stated: internal use only.", "Transmission lines do not supply settlements directly."],
  },
  substations: {
    title: "Substations",
    provider: "Nigeria SE4ALL platform (REA)",
    kind: "wfs",
    url: SE4ALL_WFS,
    typeName: "geonode:substations_currently_installed",
    licence: "Not stated",
    publicUse: false,
    evidence: "reported",
    datasetDate: "Unknown (platform data, retrieved live)",
    limitations: ["Licence not stated: internal use only."],
  },
  minigrids: {
    title: "Mini-grids",
    provider: "Nigeria SE4ALL platform (REA)",
    kind: "wfs",
    url: SE4ALL_WFS,
    typeName: "se4allWS:minigrids",
    licence: "Not stated",
    publicUse: false,
    evidence: "reported",
    datasetDate: "Unknown (platform data, retrieved live)",
    limitations: ["Licence not stated: internal use only.", "Operational status as reported; may be outdated."],
  },
  osmPower: {
    title: "Power lines and substations (OpenStreetMap)",
    provider: "OpenStreetMap contributors",
    kind: "overpass",
    url: "https://overpass-api.de/api/interpreter",
    licence: "ODbL 1.0",
    publicUse: true,
    evidence: "mapped",
    datasetDate: "Retrieved live",
    limitations: ["Crowd-mapped; coverage of 11/33 kV lines is sparse.", "Requires '© OpenStreetMap contributors' attribution."],
  },
  population: {
    title: "WorldPop constrained population 2026 (100 m)",
    provider: "WorldPop, University of Southampton (R2025A)",
    kind: "raster",
    fullDownload: true,
    url: "https://data.worldpop.org/GIS/Population/Global_2015_2030/R2025A/2026/NGA/v1/100m/constrained/nga_pop_2026_CN_100m_R2025A_v1.tif",
    licence: "CC BY 4.0",
    publicUse: true,
    evidence: "modelled",
    datasetDate: "2026 projection (R2025A release)",
    limitations: [
      "Modelled estimate, not a census count.",
      "100 m cells are assigned to a settlement by cell centre; edge cells may fall to neighbours.",
    ],
  },
  electrification: {
    title: "HREA probability of electrification (set_prplit) 2020",
    provider: "University of Michigan HREA v1.1 (from VIIRS night lights)",
    kind: "raster",
    url: "https://globalnightlight.s3.amazonaws.com/HREAv1.1_COGs/NGA/NGA/set_prplit/NGA_set_prplit_2020.tif",
    licence: "Free with citation",
    publicUse: true,
    evidence: "modelled",
    datasetDate: "2020",
    limitations: [
      "Modelled likelihood that a settlement is lit at night, as of 2020.",
      "Low values do NOT prove a settlement has no electricity (small loads, solar home systems and intermittent supply are often invisible).",
      "Cells with no value are reported as unknown, not as zero.",
    ],
  },
};
