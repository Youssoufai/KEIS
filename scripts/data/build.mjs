// Builds the derived geospatial layers and settlement indicators from data/raw/.
//
//   node scripts/data/build.mjs
//
// Reads ONLY data/raw/ (written by fetch.mjs). It never reads lib/data/seed.js
// or the app store, so sample/demonstration records cannot reach the analysis.
//
// Outputs (committed so the app works offline):
//   data/derived/*.geojson              open-licence layers, clipped to the 3 LGAs
//   data/derived/restricted/*           SE4ALL-derived layers/indicators (publicUse: false)
//   data/derived/settlements-meta.json  indicator dictionary + per-LGA summary
//   data/derived/sources.json           source registry + retrieval metadata
//   docs/GEOSPATIAL_VALIDATION.md       validation checks for geometry and indicators
//
// No priority score is calculated here. Scoring waits until the geometry and
// indicators in the validation report have been reviewed.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Flatbush from "flatbush";
import { fromFile } from "geotiff";
import * as turf from "@turf/turf";
import { PILOT_LGA_NAMES, SOURCES } from "./sources.mjs";

const RAW = path.resolve("data/raw");
const OUT = path.resolve("data/derived");
const OUT_RESTRICTED = path.join(OUT, "restricted");
const DISTANCE_BUFFER_KM = 10;
const NAME_NEAR_M = 150;
const COUNT_RADIUS_KM = 2;
const MAX_NAMES_FOR_SINGLE = 3;

// ---------------------------------------------------------------- helpers

const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));
const raw = (id) => readJson(path.join(RAW, `${id}.geojson`));
const round = (v, d = 2) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Local planar projection (km). Equirectangular at the pilot-area latitude;
// error < 0.1 % over ~200 km, adequate for nearest-distance indicators.
const LAT0 = 7.55;
const KX = 111.32 * Math.cos((LAT0 * Math.PI) / 180);
const KY = 110.57;
const toKm = ([lon, lat]) => [lon * KX, lat * KY];

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx - px;
  const cy = ay + t * dy - py;
  return Math.sqrt(cx * cx + cy * cy);
}

function* linesOf(geom) {
  if (!geom) return;
  const t = geom.type;
  if (t === "LineString") yield geom.coordinates;
  else if (t === "MultiLineString" || t === "Polygon") yield* geom.coordinates;
  else if (t === "MultiPolygon") for (const p of geom.coordinates) yield* p;
  else if (t === "Point") yield [geom.coordinates, geom.coordinates];
  else if (t === "MultiPoint") for (const c of geom.coordinates) yield [c, c];
}

/** Nearest-feature index over segments/points in km space. */
function makeIndex(features) {
  const segs = [];
  features.forEach((f, fi) => {
    for (const line of linesOf(f.geometry)) {
      for (let i = 0; i < line.length - 1 || (line.length === 1 && i === 0); i++) {
        const a = toKm(line[i]);
        const b = toKm(line[Math.min(i + 1, line.length - 1)]);
        segs.push([a[0], a[1], b[0], b[1], fi]);
      }
    }
  });
  if (!segs.length) return { nearest: () => null, within: () => 0, size: 0 };
  const idx = new Flatbush(segs.length);
  for (const [ax, ay, bx, by] of segs) idx.add(Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by));
  idx.finish();
  const nearest = (lonlat) => {
    const [x, y] = toKm(lonlat);
    for (const r of [1, 3, 10, 30, 100, 300]) {
      let best = Infinity;
      let bestF = -1;
      for (const i of idx.search(x - r, y - r, x + r, y + r)) {
        const s = segs[i];
        const d = segDist(x, y, s[0], s[1], s[2], s[3]);
        if (d < best) [best, bestF] = [d, s[4]];
      }
      if (best <= r) return { km: best, feature: bestF };
    }
    return null;
  };
  const within = (lonlat, r) => {
    const [x, y] = toKm(lonlat);
    const hit = new Set();
    for (const i of idx.search(x - r, y - r, x + r, y + r)) {
      const s = segs[i];
      if (segDist(x, y, s[0], s[1], s[2], s[3]) <= r) hit.add(s[4]);
    }
    return hit.size;
  };
  return { nearest, within, size: features.length };
}

/** Point-in-polygon lookup over many polygons using a bbox index. */
function makePolygonLookup(features) {
  const idx = new Flatbush(Math.max(features.length, 1));
  const boxes = features.map((f) => turf.bbox(f));
  for (const b of boxes) idx.add(b[0], b[1], b[2], b[3]);
  if (!features.length) idx.add(0, 0, 0, 0);
  idx.finish();
  return (lonlat) => {
    for (const i of idx.search(lonlat[0], lonlat[1], lonlat[0], lonlat[1])) {
      if (features[i] && turf.booleanPointInPolygon(lonlat, features[i])) return i;
    }
    return -1;
  };
}

/** Keep the parts of line features with at least one vertex inside `inside(lonlat)`. Segment-level clip. */
function clipLines(features, inside) {
  const out = [];
  for (const f of features) {
    const parts = [];
    for (const line of linesOf(f.geometry)) {
      let cur = [];
      for (let i = 0; i < line.length - 1; i++) {
        const keep = inside(line[i]) || inside(line[i + 1]);
        if (keep) {
          if (!cur.length) cur.push(line[i]);
          cur.push(line[i + 1]);
        } else if (cur.length) {
          parts.push(cur);
          cur = [];
        }
      }
      if (cur.length) parts.push(cur);
    }
    if (parts.length) out.push({ ...f, geometry: { type: "MultiLineString", coordinates: parts } });
  }
  return out;
}

function lineLengthKm(f, inside) {
  let km = 0;
  for (const line of linesOf(f.geometry)) {
    for (let i = 0; i < line.length - 1; i++) {
      const mid = [(line[i][0] + line[i + 1][0]) / 2, (line[i][1] + line[i + 1][1]) / 2];
      if (inside && !inside(mid)) continue;
      const [ax, ay] = toKm(line[i]);
      const [bx, by] = toKm(line[i + 1]);
      km += Math.hypot(bx - ax, by - ay);
    }
  }
  return km;
}

const fc = (features) => ({ type: "FeatureCollection", features });
const truncate = (f, precision = 5) => turf.truncate(f, { precision, coordinates: 2, mutate: true });

function quantiles(values) {
  const v = values.filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return null;
  const q = (p) => v[Math.min(v.length - 1, Math.floor(p * (v.length - 1)))];
  return { n: v.length, min: v[0], p25: q(0.25), median: q(0.5), p75: q(0.75), max: v[v.length - 1] };
}

async function readRasterWindow(id) {
  const meta = await readJson(path.join(RAW, `${id}.json`));
  const buf = await readFile(path.join(RAW, `${id}.bin`));
  const Ctor = globalThis[meta.dtype];
  const data = new Ctor(buf.buffer, buf.byteOffset, buf.byteLength / Ctor.BYTES_PER_ELEMENT);
  return { ...meta, data };
}

// ---------------------------------------------------------------- main

async function main() {
  await mkdir(OUT_RESTRICTED, { recursive: true });
  const manifest = await readJson(path.join(RAW, "manifest.json"));
  const report = { checks: [], notes: [] };
  const check = (status, title, detail) => report.checks.push({ status, title, detail });

  // ---- LGAs
  const lgaRaw = await raw("lgas");
  const lgas = lgaRaw.features
    .map((f) => ({
      type: "Feature",
      geometry: f.geometry,
      properties: { id: slug(f.properties.lganame), name: f.properties.lganame, code: f.properties.lgacode },
    }))
    .sort((a, b) => PILOT_LGA_NAMES.indexOf(a.properties.name) - PILOT_LGA_NAMES.indexOf(b.properties.name));
  if (lgas.length !== PILOT_LGA_NAMES.length) throw new Error(`expected ${PILOT_LGA_NAMES.length} LGAs, got ${lgas.length}`);
  const lgaLookup = makePolygonLookup(lgas);
  const lgaOf = (ll) => {
    const i = lgaLookup(ll);
    return i < 0 ? null : lgas[i].properties.id;
  };
  const inPilot = (ll) => lgaLookup(ll) >= 0;
  const lgaUnion = turf.union(fc(lgas));
  const bufferZone = turf.buffer(lgaUnion, DISTANCE_BUFFER_KM, { units: "kilometers" });
  const inBuffer = (ll) => turf.booleanPointInPolygon(ll, bufferZone);
  const lgaArea = Object.fromEntries(lgas.map((f) => [f.properties.id, turf.area(f) / 1e6]));

  // ---- Wards
  const wardRaw = await raw("wards");
  const wards = wardRaw.features.map((f) => ({
    type: "Feature",
    geometry: f.geometry,
    properties: {
      id: `${slug(f.properties.lga)}-${slug(f.properties.ward)}`,
      name: f.properties.ward,
      lga: slug(f.properties.lga),
      altNames: f.properties.ward_alt_names || null,
    },
  }));
  const dupIds = wards.map((w) => w.properties.id).filter((id, i, a) => a.indexOf(id) !== i);
  for (const d of dupIds) wards.filter((w) => w.properties.id === d).forEach((w, i) => (w.properties.id = `${d}-${i + 1}`));
  const wardLookup = makePolygonLookup(wards);

  // Ward ↔ LGA consistency
  const wardRows = [];
  for (const lga of lgas) {
    const id = lga.properties.id;
    const ws = wards.filter((w) => w.properties.lga === id);
    const wsUnion = ws.length ? turf.union(fc(ws)) : null;
    const inter = wsUnion ? turf.intersect(fc([wsUnion, lga])) : null;
    const wardsArea = wsUnion ? turf.area(wsUnion) / 1e6 : 0;
    const overlap = inter ? turf.area(inter) / 1e6 : 0;
    const misplaced = ws.filter((w) => lgaOf(turf.pointOnFeature(w).geometry.coordinates) !== id).map((w) => w.properties.name);
    wardRows.push({
      lga: lga.properties.name,
      wards: ws.length,
      lgaKm2: lgaArea[id],
      wardsKm2: wardsArea,
      overlapPctOfLga: (100 * overlap) / lgaArea[id],
      overlapPctOfWards: wardsArea ? (100 * overlap) / wardsArea : 0,
      misplaced,
    });
  }
  const minOverlap = Math.min(...wardRows.map((r) => Math.min(r.overlapPctOfLga, r.overlapPctOfWards)));
  check(
    minOverlap >= 95 ? "PASS" : "WARN",
    "Ward boundaries (2026) vs LGA boundaries (2019)",
    `Lowest mutual area overlap: ${minOverlap.toFixed(1)} %. Wards whose interior point falls in a different LGA: ${wardRows.flatMap((r) => r.misplaced).join(", ") || "none"}.`,
  );

  // ---- Settlement blocks → settlement extents
  const blocks = (await raw("settlementBlocks")).features;
  const groups = new Map();
  for (const b of blocks) {
    const k = b.properties.mgrs_code;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(b);
  }
  let groupsConsistent = 0;
  const settlements = [];
  const blockMismatches = [];
  let multipart = 0;
  let crossing = 0;
  let noWard = 0;
  let wardLgaConflict = 0;
  for (const [code, bs] of groups) {
    const expected = bs[0].properties.blocks_per_settl_extent;
    const types = [...new Set(bs.map((b) => b.properties.extent_type))];
    const consistent = bs.length === expected && types.length === 1;
    if (consistent) groupsConsistent++;

    // Clip at block level: each block belongs to the LGA containing its interior
    // point. A settlement straddling an LGA boundary is split into one part per
    // pilot LGA; blocks outside the three LGAs are dropped.
    const blockPts = bs.map((b) => turf.pointOnFeature(b).geometry.coordinates);
    const blockLga = blockPts.map((p) => lgaOf(p));
    const lgasHit = new Set(blockLga);
    const split = lgasHit.size > 1;
    for (const lga of lgasHit) {
      if (!lga) continue;
      const part = bs.filter((_, i) => blockLga[i] === lga);
      const pts = blockPts.filter((_, i) => blockLga[i] === lga);
      settlements.push(makeSettlement(code, part, pts, lga, { consistent, expected, types, split, totalBlocks: bs.length }));
    }
  }

  function makeSettlement(code, bs, pts, lga, { consistent, expected, types, split, totalBlocks }) {
    // Representative point: interior point of the block nearest the part's centroid
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    let rep = pts[0];
    let bestD = Infinity;
    for (const p of pts) {
      const d = (p[0] - cx) ** 2 + (p[1] - cy) ** 2;
      if (d < bestD) [bestD, rep] = [d, p];
    }
    const id = split ? `${code}@${lga}` : code;

    const flags = [];
    if (!consistent) {
      flags.push("block_count_mismatch");
      blockMismatches.push({ code: id, blocks: totalBlocks, expected, types: types.join("/"), lga });
    }
    if (split) {
      flags.push("split_by_lga_boundary");
      crossing++;
    }
    const wi = wardLookup(rep);
    const ward = wi >= 0 ? wards[wi].properties : null;
    if (!ward) {
      flags.push("outside_ward_boundaries");
      noWard++;
    } else if (ward.lga !== lga) {
      flags.push("ward_lga_conflict");
      wardLgaConflict++;
    }

    const geom = bs.length === 1 ? bs[0] : turf.union(fc(bs));
    if (geom.geometry.type === "MultiPolygon") {
      flags.push("multipart");
      multipart++;
    }
    const typeCount = {};
    for (const b of bs) typeCount[b.properties.extent_type] = (typeCount[b.properties.extent_type] || 0) + 1;
    const type = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0][0];

    return {
      type: "Feature",
      geometry: geom.geometry,
      properties: {
        id,
        mgrsCode: code,
        name: null,
        nameSource: null,
        altNames: [],
        namedPlaces: [],
        lga,
        ward: ward?.id ?? null,
        wardName: ward?.name ?? null,
        type,
        blocks: bs.length,
        buildings: bs.reduce((s, b) => s + (b.properties.building_count || 0), 0),
        builtAreaM2: Math.round(bs.reduce((s, b) => s + (b.properties.building_area_sum || 0), 0)),
        areaHa: null,
        lon: round(rep[0], 5),
        lat: round(rep[1], 5),
        pop: null,
        hrea: null,
        hreaCells: 0,
        dHealth: null,
        nHealth2km: null,
        dSchool: null,
        nSchool2km: null,
        dMarket: null,
        dRoad: null,
        flags,
      },
    };
  }
  for (const s of settlements) s.properties.areaHa = round(turf.area(s) / 1e4, 2);
  const settlementLookup = makePolygonLookup(settlements);
  console.log(`settlements in pilot LGAs: ${settlements.length} (from ${groups.size} block groups, ${blocks.length} blocks)`);

  check(
    "PASS",
    "GRID3 v4.1 rows are blocks and are aggregated into settlements",
    `${blocks.length} blocks in the download window form ${groups.size} mgrs_code groups; ${groupsConsistent} (${((100 * groupsConsistent) / groups.size).toFixed(1)} %) have exactly blocks_per_settl_extent blocks and one extent_type. ${settlements.length} settlements fall inside the three LGAs.`,
  );
  check(
    blockMismatches.length / settlements.length < 0.02 ? "PASS" : "WARN",
    "Block-count mismatches inside the pilot LGAs",
    `${blockMismatches.length} settlements (${((100 * blockMismatches.length) / settlements.length).toFixed(2)} %) have a block count different from blocks_per_settl_extent. They are kept and flagged 'block_count_mismatch'.`,
  );
  check(
    multipart / settlements.length < 0.02 ? "PASS" : "WARN",
    "Aggregated settlements are contiguous",
    `${multipart} settlements (${((100 * multipart) / settlements.length).toFixed(2)} %) are multipart after merging their blocks (flag 'multipart').`,
  );
  check(
    crossing ? "INFO" : "PASS",
    "Settlements crossing LGA boundaries (clipped at block level)",
    `${crossing} settlement parts come from GRID3 extents that straddle an LGA boundary (flag 'split_by_lga_boundary'). Each block is assigned to the LGA containing it; blocks outside the three LGAs are dropped, so cross-boundary towns (e.g. the Okene conurbation) only contribute the part inside the pilot LGAs.`,
  );
  check(
    noWard + wardLgaConflict ? "WARN" : "PASS",
    "Settlement ward assignment",
    `${noWard} settlements fall outside every ward polygon (flag 'outside_ward_boundaries'); ${wardLgaConflict} fall in a ward whose LGA differs from the LGA polygon (flag 'ward_lga_conflict'). Caused by the 2019 LGA vs 2026 ward boundary mismatch.`,
  );

  // ---- Names from GRID3 named settlement points
  const namePts = (await raw("settlementPoints")).features.filter((f) => f.geometry && inPilot(f.geometry.coordinates));
  const nearIdx = new Flatbush(settlements.length);
  for (const s of settlements) {
    const b = turf.bbox(s);
    const pad = NAME_NEAR_M / 1000 / KY;
    nearIdx.add(b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad);
  }
  nearIdx.finish();
  let ptsInside = 0;
  let ptsNear = 0;
  let ptsUnmatched = 0;
  const nameHits = new Map(); // settlement index → [{name, inside, d, primary}]
  for (const p of namePts) {
    const ll = p.geometry.coordinates;
    const name = (p.properties.set_name || "").trim();
    if (!name) continue;
    let hit = settlementLookup(ll);
    let inside = hit >= 0;
    let d = 0;
    if (!inside) {
      let best = Infinity;
      for (const i of nearIdx.search(ll[0], ll[1], ll[0], ll[1])) {
        const dd = turf.pointToPolygonDistance(ll, settlements[i], { units: "meters" });
        if (dd < best) [best, hit] = [dd, i];
      }
      d = best;
      if (best > NAME_NEAR_M) hit = -1;
    }
    if (hit < 0) {
      ptsUnmatched++;
      continue;
    }
    inside ? ptsInside++ : ptsNear++;
    if (!nameHits.has(hit)) nameHits.set(hit, []);
    nameHits.get(hit).push({ name, inside, d, ll, primary: p.properties.is_primary === "Yes" });
  }
  // A large extent (a town) can contain many named places; picking one would
  // mislabel the whole town, so extents with more than MAX_NAMES_FOR_SINGLE
  // inside points are left unnamed and list their named places instead.
  let multiNamed = 0;
  for (const [i, hits] of nameHits) {
    const s = settlements[i].properties;
    const inside = hits.filter((h) => h.inside);
    if (inside.length > MAX_NAMES_FOR_SINGLE) {
      s.namedPlaces = [...new Set(inside.map((h) => h.name))].sort();
      s.nameSource = "grid3_many_points_inside";
      multiNamed++;
      continue;
    }
    const rep = [s.lon, s.lat];
    for (const h of hits) h.dRep = (h.ll[0] - rep[0]) ** 2 + (h.ll[1] - rep[1]) ** 2;
    hits.sort((a, b) => b.inside - a.inside || b.primary - a.primary || a.d - b.d || a.dRep - b.dRep);
    s.name = hits[0].name;
    s.nameSource = hits[0].inside ? "grid3_point_inside" : "grid3_point_near";
    s.altNames = [...new Set(hits.slice(1).map((h) => h.name))].filter((n) => n !== s.name);
  }
  check(
    "INFO",
    "Settlement names",
    `${namePts.length} GRID3 named points lie inside the LGAs: ${ptsInside} fall inside a settlement extent, ${ptsNear} within ${NAME_NEAR_M} m of one, ${ptsUnmatched} match no extent (left unused). ${nameHits.size - multiNamed} settlements (${((100 * (nameHits.size - multiNamed)) / settlements.length).toFixed(1)} %) received a single name; ${multiNamed} large extents contain more than ${MAX_NAMES_FOR_SINGLE} named places and list them instead of taking one name; the rest are labelled 'Unnamed settlement'.`,
  );

  // ---- Population (WorldPop) — sum of cells whose centre lies inside the settlement
  const lgaPop = Object.fromEntries(lgas.map((l) => [l.properties.id, 0]));
  let popAvailable = false;
  try {
    const pop = await readRasterWindow("population");
    popAvailable = true;
    const pops = new Float64Array(settlements.length);
    for (let r = 0; r < pop.height; r++) {
      const lat = pop.originY + (r + 0.5) * pop.resY;
      for (let c = 0; c < pop.width; c++) {
        const v = pop.data[r * pop.width + c];
        if (!(v > 0) || v === pop.nodata) continue;
        const ll = [pop.originX + (c + 0.5) * pop.resX, lat];
        const lga = lgaOf(ll);
        if (!lga) continue;
        lgaPop[lga] += v;
        const si = settlementLookup(ll);
        if (si >= 0) pops[si] += v;
      }
    }
    settlements.forEach((s, i) => (s.properties.pop = Math.round(pops[i])));
  } catch (err) {
    report.notes.push(`Population raster not available (${err.code || err.message}); population left as null (Unknown). Run 'npm run data:fetch population'.`);
  }

  // ---- HREA electrification likelihood — mean of valid cells inside the settlement
  {
    const h = await readRasterWindow("electrification");
    const sum = new Float64Array(settlements.length);
    const cnt = new Uint32Array(settlements.length);
    for (let r = 0; r < h.height; r++) {
      const lat = h.originY + (r + 0.5) * h.resY;
      for (let c = 0; c < h.width; c++) {
        const v = h.data[r * h.width + c];
        if (v === h.nodata || Number.isNaN(v) || v < 0) continue;
        const si = settlementLookup([h.originX + (c + 0.5) * h.resX, lat]);
        if (si < 0) continue;
        sum[si] += v;
        cnt[si]++;
      }
    }
    settlements.forEach((s, i) => {
      const p = s.properties;
      if (cnt[i]) {
        p.hrea = round(sum[i] / cnt[i], 3);
        p.hreaCells = cnt[i];
      } else {
        const c = Math.floor((p.lon - h.originX) / h.resX);
        const r = Math.floor((p.lat - h.originY) / h.resY);
        const v = c >= 0 && r >= 0 && c < h.width && r < h.height ? h.data[r * h.width + c] : h.nodata;
        p.hrea = v === h.nodata || Number.isNaN(v) || v < 0 ? null : round(v, 3);
        p.hreaCells = p.hrea == null ? 0 : 1;
      }
    });
  }

  // ---- Infrastructure: clip for display, buffer for distance
  const pointsIn = (features, test) => features.filter((f) => f.geometry && test(f.geometry.coordinates));
  const load = async (id) => (await raw(id)).features.filter((f) => f.geometry);

  const health = await load("healthFacilities");
  const schools = await load("schools");
  const markets = await load("markets");
  const roads = await load("roads");
  const mv = await load("mvLines");
  const hv = await load("hvLines");
  const subs = await load("substations");
  const mgs = await load("minigrids");
  const osm = await load("osmPower");
  const osmVolt = (f) => Math.max(0, ...String(f.properties.voltage || "").split(";").map(Number).filter(Boolean));
  const osmLines = osm.filter((f) => f.properties.power === "line" || f.properties.power === "minor_line");
  const osmSubs = osm
    .filter((f) => f.properties.power === "substation")
    .map((f) => ({ ...f, geometry: f.geometry.type === "Point" ? f.geometry : turf.centroid(f).geometry }));
  const osmHv = osmLines.filter((f) => osmVolt(f) >= 66000);
  const osmMv = osmLines.filter((f) => osmVolt(f) > 0 && osmVolt(f) < 66000);
  const osmUnknownV = osmLines.filter((f) => osmVolt(f) === 0);

  const idx = {
    health: makeIndex(pointsIn(health, inBuffer)),
    school: makeIndex(pointsIn(schools, inBuffer)),
    market: makeIndex(pointsIn(markets, inBuffer)),
    road: makeIndex(clipLines(roads, inBuffer)),
    mv: makeIndex([...clipLines(mv, inBuffer), ...clipLines(osmMv, inBuffer)]),
    hv: makeIndex([...clipLines(hv, inBuffer), ...clipLines(osmHv, inBuffer)]),
    sub: makeIndex([...pointsIn(subs, inBuffer), ...pointsIn(osmSubs, inBuffer)]),
    mg: makeIndex(pointsIn(mgs, inBuffer)),
  };

  const restricted = {};
  for (const s of settlements) {
    const p = s.properties;
    const ll = [p.lon, p.lat];
    const d = (ix) => {
      const n = ix.nearest(ll);
      return n ? round(n.km, 2) : null;
    };
    p.dHealth = d(idx.health);
    p.nHealth2km = idx.health.within(ll, COUNT_RADIUS_KM);
    p.dSchool = d(idx.school);
    p.nSchool2km = idx.school.within(ll, COUNT_RADIUS_KM);
    p.dMarket = d(idx.market);
    p.dRoad = d(idx.road);
    restricted[p.id] = { dMv: d(idx.mv), dHv: d(idx.hv), dSub: d(idx.sub), dMg: d(idx.mg) };
  }

  // ---- Display layers clipped to the LGAs
  const pick = (f, keys) => ({
    type: "Feature",
    geometry: f.geometry,
    properties: Object.fromEntries(keys.map((k) => [k, f.properties[k] ?? null])),
  });
  const withLga = (f) => ({ ...f, properties: { ...f.properties, lga: lgaOf(f.geometry.type === "Point" ? f.geometry.coordinates : turf.pointOnFeature(f).geometry.coordinates) } });
  const open = {
    lgas: lgas,
    wards: wards,
    health: pointsIn(health, inPilot).map((f) => withLga(pick(f, ["facility_name", "facility_level", "facility_type", "facility_ownership", "functional"]))),
    schools: pointsIn(schools, inPilot).map((f) => withLga(pick(f, ["name", "education", "management", "category", "subtype"]))),
    markets: pointsIn(markets, inPilot).map((f) => withLga(pick(f, ["market_nam", "mrkt_type", "mrkt_frqcy"]))),
    roads: clipLines(roads, inPilot).map((f) => pick(f, ["class", "names", "road_surface"])),
    osmPower: [
      ...clipLines(osmLines, inPilot).map((f) => pick(f, ["osm_id", "power", "voltage", "name", "operator"])),
      ...pointsIn(osmSubs, inPilot).map((f) => pick(f, ["osm_id", "power", "voltage", "name", "operator"])),
    ],
  };
  const restrictedLayers = {
    mvLines: clipLines(mv, inPilot).map((f) => pick(f, ["name", "voltage_kv", "condition", "length_km"])),
    hvLines: clipLines(hv, inPilot).map((f) => pick(f, ["name", "volt", "km"])),
    substations: pointsIn(subs, inPilot).map((f) => pick(f, ["sub_name", "volt", "voltage"])),
    minigrids: pointsIn(mgs, inPilot).map((f) => pick(f, ["community", "power_system", "power_kw", "status", "condition", "number_of_connections", "located"])),
  };

  // ---- Per-LGA summary
  const byLga = (arr, fn = () => 1) => {
    const o = Object.fromEntries(lgas.map((l) => [l.properties.id, 0]));
    for (const x of arr) if (x.properties.lga in o) o[x.properties.lga] += fn(x);
    return o;
  };
  const lineKmByLga = (features) =>
    Object.fromEntries(lgas.map((l) => [l.properties.id, round(features.reduce((s, f) => s + lineLengthKm(f, (ll) => lgaOf(ll) === l.properties.id), 0), 1)]));
  const summary = {};
  for (const l of lgas) {
    const id = l.properties.id;
    const ss = settlements.filter((s) => s.properties.lga === id);
    summary[id] = {
      name: l.properties.name,
      areaKm2: round(lgaArea[id], 1),
      wards: wards.filter((w) => w.properties.lga === id).length,
      settlements: ss.length,
      settlementsByType: ss.reduce((o, s) => ((o[s.properties.type] = (o[s.properties.type] || 0) + 1), o), {}),
      namedSettlements: ss.filter((s) => s.properties.name).length,
      multiNamedExtents: ss.filter((s) => s.properties.namedPlaces.length).length,
      buildings: ss.reduce((a, s) => a + s.properties.buildings, 0),
      populationLga: popAvailable ? Math.round(lgaPop[id]) : null,
      populationInSettlements: popAvailable ? ss.reduce((a, s) => a + (s.properties.pop || 0), 0) : null,
      hreaKnown: ss.filter((s) => s.properties.hrea != null).length,
      healthFacilities: byLga(open.health)[id],
      schools: byLga(open.schools)[id],
      markets: byLga(open.markets)[id],
      roadKm: lineKmByLga(open.roads)[id],
      restricted: {
        mvLineKm: lineKmByLga(restrictedLayers.mvLines)[id],
        hvLineKm: lineKmByLga(restrictedLayers.hvLines)[id],
        substations: restrictedLayers.substations.filter((f) => lgaOf(f.geometry.coordinates) === id).length,
        minigrids: restrictedLayers.minigrids.filter((f) => lgaOf(f.geometry.coordinates) === id).length,
      },
    };
  }

  // ---- Indicator checks
  const all = settlements.map((s) => s.properties);
  const restrictedAll = Object.values(restricted);
  const stats = {
    pop: quantiles(all.map((p) => p.pop)),
    buildings: quantiles(all.map((p) => p.buildings)),
    hrea: quantiles(all.map((p) => p.hrea)),
    dHealth: quantiles(all.map((p) => p.dHealth)),
    dSchool: quantiles(all.map((p) => p.dSchool)),
    dMarket: quantiles(all.map((p) => p.dMarket)),
    dRoad: quantiles(all.map((p) => p.dRoad)),
    dMv: quantiles(restrictedAll.map((r) => r.dMv)),
    dHv: quantiles(restrictedAll.map((r) => r.dHv)),
    dSub: quantiles(restrictedAll.map((r) => r.dSub)),
    dMg: quantiles(restrictedAll.map((r) => r.dMg)),
  };
  if (popAvailable) {
    const zeroPop = all.filter((p) => !p.pop).length;
    const totalLga = Object.values(lgaPop).reduce((a, b) => a + b, 0);
    const totalSet = all.reduce((a, p) => a + (p.pop || 0), 0);
    check(
      totalSet / totalLga > 0.8 ? "PASS" : "WARN",
      "Population captured by settlement extents",
      `${Math.round(totalSet).toLocaleString("en")} of ${Math.round(totalLga).toLocaleString("en")} modelled residents (${((100 * totalSet) / totalLga).toFixed(1)} %) fall in settlement extents. ${zeroPop} settlements (mostly small hamlets narrower than one 100 m cell) receive 0 because no cell centre falls inside them.`,
    );
  } else {
    check("WARN", "Population", "WorldPop raster not yet available; population is Unknown for every settlement.");
  }
  const hreaNull = all.filter((p) => p.hrea == null).length;
  check(
    "INFO",
    "HREA electrification likelihood coverage",
    `${all.length - hreaNull} settlements have an HREA value; ${hreaNull} (${((100 * hreaNull) / all.length).toFixed(1)} %) fall outside HREA's settlement mask and are Unknown (not 0).`,
  );
  check(
    "INFO",
    "Distance indicators",
    `Measured from each settlement's representative point to infrastructure inside the LGAs plus a ${DISTANCE_BUFFER_KM} km buffer (edge-effect correction). Index sizes: ${Object.entries(idx).map(([k, v]) => `${k} ${v.size}`).join(", ")}.`,
  );
  // Sample-data isolation: the pipeline must not import app code (seed data,
  // store) and no output record may carry the sample marker used by seed.js.
  const pipelineSrc = await Promise.all(["build.mjs", "fetch.mjs", "sources.mjs"].map((f) => readFile(path.join(import.meta.dirname, f), "utf8")));
  const importsApp = pipelineSrc.some((src) => /from\s+["'](@\/|\.\.\/\.\.\/lib|.*seed)/.test(src));
  const sampleRecords = settlements.filter((s) => "isSample" in s.properties || /^sample /i.test(s.properties.name || "")).length;
  check(
    importsApp || sampleRecords ? "FAIL" : "PASS",
    "Sample data isolation",
    `Pipeline scripts import app code (lib/, seed, store): ${importsApp ? "YES" : "no"}. Output settlements carrying a sample marker: ${sampleRecords}. The map loads only /api/geo/* layers built from data/raw/.`,
  );

  // ---- Indicator dictionary (provenance for every derived value)
  const src = (id) => ({
    source: SOURCES[id].title,
    provider: SOURCES[id].provider,
    datasetDate: SOURCES[id].datasetDate,
    retrievedAt: manifest[id]?.retrievedAt ?? null,
    licence: SOURCES[id].licence,
  });
  const distMethod = `Planar distance (km) from the settlement's representative point to the nearest feature inside the three LGAs plus a ${DISTANCE_BUFFER_KM} km buffer.`;
  const indicators = {
    buildings: { label: "Buildings", unit: "count", evidence: "modelled", publicUse: true, ...src("settlementBlocks"), method: "Sum of building_count over the settlement's blocks.", limitations: SOURCES.settlementBlocks.limitations },
    builtAreaM2: { label: "Built-up roof area", unit: "m²", evidence: "modelled", publicUse: true, ...src("settlementBlocks"), method: "Sum of building_area_sum over blocks.", limitations: SOURCES.settlementBlocks.limitations },
    areaHa: { label: "Settlement extent area", unit: "ha", evidence: "modelled", publicUse: true, ...src("settlementBlocks"), method: "Geodesic area of the merged block polygons.", limitations: [] },
    pop: { label: "Population (2026 estimate)", unit: "people", evidence: "modelled", publicUse: true, ...src("population"), method: "Sum of WorldPop 100 m cells whose centre lies inside the settlement extent.", limitations: [...SOURCES.population.limitations, "Hamlets smaller than one cell may show 0."] },
    hrea: { label: "Night-light electrification likelihood (2020)", unit: "0–1", evidence: "modelled", publicUse: true, ...src("electrification"), method: "Mean of valid HREA set_prplit cells inside the extent; else the cell at the representative point; else Unknown.", limitations: SOURCES.electrification.limitations },
    dHealth: { label: "Distance to nearest health facility", unit: "km", evidence: "reported", publicUse: true, ...src("healthFacilities"), method: distMethod, limitations: SOURCES.healthFacilities.limitations },
    nHealth2km: { label: `Health facilities within ${COUNT_RADIUS_KM} km`, unit: "count", evidence: "reported", publicUse: true, ...src("healthFacilities"), method: `Count within ${COUNT_RADIUS_KM} km of the representative point.`, limitations: SOURCES.healthFacilities.limitations },
    dSchool: { label: "Distance to nearest school", unit: "km", evidence: "reported", publicUse: true, ...src("schools"), method: distMethod, limitations: SOURCES.schools.limitations },
    nSchool2km: { label: `Schools within ${COUNT_RADIUS_KM} km`, unit: "count", evidence: "reported", publicUse: true, ...src("schools"), method: `Count within ${COUNT_RADIUS_KM} km of the representative point.`, limitations: SOURCES.schools.limitations },
    dMarket: { label: "Distance to nearest recorded market", unit: "km", evidence: "reported", publicUse: true, ...src("markets"), method: distMethod, limitations: SOURCES.markets.limitations },
    dRoad: { label: "Distance to nearest trunk–tertiary road", unit: "km", evidence: "mapped", publicUse: true, ...src("roads"), method: distMethod, limitations: SOURCES.roads.limitations },
    dMv: { label: "Distance to nearest mapped 33/11 kV line", unit: "km", evidence: "reported", publicUse: false, ...src("mvLines"), method: `${distMethod} SE4ALL MV lines plus OSM lines tagged below 66 kV.`, limitations: SOURCES.mvLines.limitations },
    dHv: { label: "Distance to nearest mapped HV line", unit: "km", evidence: "reported", publicUse: false, ...src("hvLines"), method: `${distMethod} SE4ALL HV lines plus OSM lines tagged ≥ 66 kV.`, limitations: SOURCES.hvLines.limitations },
    dSub: { label: "Distance to nearest mapped substation", unit: "km", evidence: "reported", publicUse: false, ...src("substations"), method: `${distMethod} SE4ALL plus OSM substations.`, limitations: SOURCES.substations.limitations },
    dMg: { label: "Distance to nearest recorded mini-grid", unit: "km", evidence: "reported", publicUse: false, ...src("minigrids"), method: distMethod, limitations: SOURCES.minigrids.limitations },
  };

  // ---- Write outputs
  const simplify = (f) => truncate(turf.simplify(f, { tolerance: 0.00008, highQuality: false }));
  const writeLayer = (dir, name, features) => writeFile(path.join(dir, `${name}.geojson`), JSON.stringify(fc(features.map((f) => truncate(f)))));
  // One interior label point per polygon (tile fragments would repeat labels).
  const withLabel = (f) => {
    const [lon, lat] = turf.pointOnFeature(f).geometry.coordinates;
    return { ...f, properties: { ...f.properties, labelLon: round(lon, 5), labelLat: round(lat, 5) } };
  };
  await writeFile(path.join(OUT, "lgas.geojson"), JSON.stringify(fc(lgas.map(withLabel).map(simplify))));
  await writeFile(path.join(OUT, "wards.geojson"), JSON.stringify(fc(wards.map(withLabel).map(simplify))));
  await writeFile(path.join(OUT, "settlements.geojson"), JSON.stringify(fc(settlements.map(simplify))));
  for (const k of ["health", "schools", "markets", "roads", "osmPower"]) await writeLayer(OUT, k, open[k]);
  for (const [k, v] of Object.entries(restrictedLayers)) await writeLayer(OUT_RESTRICTED, k, v);
  await writeFile(path.join(OUT_RESTRICTED, "settlement-grid-indicators.json"), JSON.stringify(restricted));

  const builtAt = new Date().toISOString();
  await writeFile(
    path.join(OUT, "settlements-meta.json"),
    JSON.stringify({ builtAt, unit: "GRID3 settlement extent (v4.1 blocks merged by mgrs_code)", indicators, summary, stats, checks: report.checks, notes: report.notes, flags: {
      block_count_mismatch: "Number of blocks differs from GRID3's blocks_per_settl_extent.",
      split_by_lga_boundary: "The GRID3 extent straddles an LGA boundary; only the blocks inside this LGA are included.",
      outside_ward_boundaries: "Representative point is not inside any 2026 ward polygon.",
      ward_lga_conflict: "Containing ward belongs to a different LGA than the LGA polygon.",
      multipart: "Merged blocks form more than one polygon.",
    } }, null, 1),
  );
  const sourcesOut = Object.fromEntries(
    Object.entries(SOURCES).map(([id, s]) => [id, { ...s, retrievedAt: manifest[id]?.retrievedAt ?? null, recordsInWindow: manifest[id]?.records ?? null }]),
  );
  await writeFile(path.join(OUT, "sources.json"), JSON.stringify({ builtAt, sources: sourcesOut }, null, 1));

  await writeFile(path.resolve("docs/GEOSPATIAL_VALIDATION.md"), renderReport({ builtAt, report, wardRows, blockMismatches, summary, stats, lgas, osmUnknownV, manifest }));
  console.log(report.checks.map((c) => `[${c.status}] ${c.title}`).join("\n"));
}

// ---------------------------------------------------------------- report

function renderReport({ builtAt, report, wardRows, blockMismatches, summary, stats, lgas, osmUnknownV, manifest }) {
  const n = (v, d = 0) => (v == null ? "—" : Number(v).toLocaleString("en", { maximumFractionDigits: d, minimumFractionDigits: d }));
  const ids = lgas.map((l) => l.properties.id);
  const row = (label, fn) => `| ${label} | ${ids.map((id) => fn(summary[id])).join(" | ")} |`;
  const lines = [];
  lines.push("# Geospatial validation report", "");
  lines.push(`Generated by \`scripts/data/build.mjs\` on ${builtAt}. Do not edit by hand; re-run \`npm run data:build\`.`, "");
  lines.push("This report must be reviewed before the priority scoring engine is built. It covers the settlement geometry (unit of analysis) and the spatial indicators.", "");
  lines.push("## Checks", "", "| Status | Check | Detail |", "|---|---|---|");
  for (const c of report.checks) lines.push(`| ${c.status} | ${c.title} | ${c.detail} |`);
  if (report.notes.length) lines.push("", ...report.notes.map((t) => `> ${t}`));
  lines.push("", "## Per-LGA results (clipped to the LGA polygons)", "");
  lines.push(`| | ${ids.map((id) => summary[id].name).join(" | ")} |`, `|---|${ids.map(() => "---:").join("|")}|`);
  lines.push(row("Area (km²)", (s) => n(s.areaKm2)));
  lines.push(row("Wards (GRID3 v4.0)", (s) => n(s.wards)));
  lines.push(row("Settlement extents", (s) => n(s.settlements)));
  for (const t of ["Built-up Area", "Small Settlement Area", "Hamlet"]) lines.push(row(`· ${t}`, (s) => n(s.settlementsByType[t] || 0)));
  lines.push(row("Named settlements (single name)", (s) => `${n(s.namedSettlements)} (${n((100 * s.namedSettlements) / s.settlements, 1)} %)`));
  lines.push(row("Extents with > 3 named places (towns)", (s) => n(s.multiNamedExtents)));
  lines.push(row("Buildings (modelled)", (s) => n(s.buildings)));
  lines.push(row("Population 2026, whole LGA (modelled)", (s) => n(s.populationLga)));
  lines.push(row("Population in settlement extents", (s) => n(s.populationInSettlements)));
  lines.push(row("Settlements with HREA value", (s) => `${n(s.hreaKnown)} (${n((100 * s.hreaKnown) / s.settlements, 1)} %)`));
  lines.push(row("Health facilities", (s) => n(s.healthFacilities)));
  lines.push(row("Schools", (s) => n(s.schools)));
  lines.push(row("Markets", (s) => n(s.markets)));
  lines.push(row("Trunk–tertiary road (km)", (s) => n(s.roadKm, 1)));
  lines.push(row("Mapped 33/11 kV line (km) · restricted", (s) => n(s.restricted.mvLineKm, 1)));
  lines.push(row("Mapped HV line (km) · restricted", (s) => n(s.restricted.hvLineKm, 1)));
  lines.push(row("Substations · restricted", (s) => n(s.restricted.substations)));
  lines.push(row("Mini-grids · restricted", (s) => n(s.restricted.minigrids)));
  lines.push("", "Line lengths are counted by segment midpoint inside each LGA. The bounding-box counts from the research stage are superseded by this table.", "");

  lines.push("## Ward and LGA boundary alignment", "", "| LGA | Wards | LGA km² | Ward union km² | Overlap / LGA | Overlap / wards | Wards placed in another LGA |", "|---|---:|---:|---:|---:|---:|---|");
  for (const r of wardRows) lines.push(`| ${r.lga} | ${r.wards} | ${n(r.lgaKm2, 1)} | ${n(r.wardsKm2, 1)} | ${n(r.overlapPctOfLga, 1)} % | ${n(r.overlapPctOfWards, 1)} % | ${r.misplaced.join(", ") || "—"} |`);

  lines.push("", "## Indicator distributions (all settlements in the three LGAs)", "", "| Indicator | n (non-null) | min | p25 | median | p75 | max |", "|---|---:|---:|---:|---:|---:|---:|");
  const label = { pop: "Population", buildings: "Buildings", hrea: "HREA likelihood", dHealth: "Dist. health facility (km)", dSchool: "Dist. school (km)", dMarket: "Dist. market (km)", dRoad: "Dist. trunk–tertiary road (km)", dMv: "Dist. mapped MV line (km) · restricted", dHv: "Dist. mapped HV line (km) · restricted", dSub: "Dist. substation (km) · restricted", dMg: "Dist. mini-grid (km) · restricted" };
  for (const [k, q] of Object.entries(stats)) {
    const d = k === "hrea" ? 3 : k.startsWith("d") ? 2 : 0;
    lines.push(q ? `| ${label[k]} | ${n(q.n)} | ${n(q.min, d)} | ${n(q.p25, d)} | ${n(q.median, d)} | ${n(q.p75, d)} | ${n(q.max, d)} |` : `| ${label[k]} | 0 | — | — | — | — | — |`);
  }

  lines.push("", `## Block-count mismatches inside the pilot LGAs (${blockMismatches.length})`, "");
  if (blockMismatches.length) {
    lines.push("| Settlement (mgrs_code) | LGA | Blocks found | blocks_per_settl_extent | Extent type(s) |", "|---|---|---:|---:|---|");
    for (const m of blockMismatches.sort((a, b) => Math.abs(b.blocks - b.expected) - Math.abs(a.blocks - a.expected))) lines.push(`| ${m.code} | ${m.lga} | ${m.blocks} | ${m.expected} | ${m.types} |`);
  } else lines.push("None.");

  lines.push("", "## Other notes", "");
  lines.push(`- Markets: only ${Object.values(summary).reduce((a, s) => a + s.markets, 0)} markets are recorded inside the three LGAs. The market-distance indicator mostly reflects gaps in the market dataset, not real market access, and should get little or no weight in scoring.`);
  lines.push(`- ${osmUnknownV.length} OSM power lines have no voltage tag. They are shown on the map but excluded from the MV/HV distance indicators.`);
  lines.push("- Distances to mapped lines describe proximity to *recorded* infrastructure only. They are not a measure of connection, and a large distance is not evidence that a settlement has no electricity.");
  lines.push("- SE4ALL-derived layers and indicators are written to `data/derived/restricted/` and must not be shown on public-facing pages or exports.");
  lines.push("", "## Retrieval", "", "| Source | Retrieved | Records in download window |", "|---|---|---:|");
  for (const [id, m] of Object.entries(manifest)) lines.push(`| ${id} | ${m.retrievedAt} | ${n(m.records)} |`);
  return lines.join("\n") + "\n";
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
