// Downloads every source in sources.mjs into data/raw/ (git-ignored).
//
//   node scripts/data/fetch.mjs            fetch everything
//   node scripts/data/fetch.mjs wards mvLines   fetch only the named sources
//
// Vector layers are fetched for the FETCH_BBOX search window (or an attribute
// filter for boundaries). Rasters are read as a window from cloud-optimised
// GeoTIFFs with HTTP range requests, so the national files are not downloaded.
// data/raw/manifest.json records URL, retrieval time, record count and licence.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fromFile, fromUrl } from "geotiff";
import { FETCH_BBOX, SOURCES } from "./sources.mjs";

const RAW = path.resolve("data/raw");

// Some hosts (e.g. S3) advertise IPv6 addresses that time out on networks
// without IPv6; give each address family more time before falling back.
net.setDefaultAutoSelectFamilyAttemptTimeout(2000);
const UA = { "User-Agent": "rfn-prototype-data-pipeline/0.1" };

async function getJson(url, init = {}, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { ...init, headers: { ...UA, ...(init.headers || {}) } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.slice(0, 160)}`);
      return await res.json();
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

async function fetchArcgis(src) {
  const [x0, y0, x1, y1] = FETCH_BBOX;
  const base = {
    where: src.where || "1=1",
    outFields: (src.outFields || ["*"]).join(","),
    outSR: "4326",
    f: "geojson",
  };
  if (src.spatial) {
    Object.assign(base, {
      geometry: JSON.stringify({ xmin: x0, ymin: y0, xmax: x1, ymax: y1, spatialReference: { wkid: 4326 } }),
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
    });
  }
  const countUrl = `${src.url}/query?${new URLSearchParams({ ...base, f: "json", returnCountOnly: "true" })}`;
  const { count } = await getJson(countUrl);
  const features = [];
  const page = 2000;
  for (let offset = 0; offset < count; offset += page) {
    const q = new URLSearchParams({
      ...base,
      resultOffset: String(offset),
      resultRecordCount: String(page),
    });
    const fc = await getJson(`${src.url}/query?${q}`);
    features.push(...fc.features);
    process.stdout.write(`\r  ${features.length}/${count}`);
  }
  process.stdout.write("\n");
  if (features.length !== count) throw new Error(`expected ${count} features, got ${features.length}`);
  return { type: "FeatureCollection", features };
}

async function fetchWfs(src) {
  const [x0, y0, x1, y1] = FETCH_BBOX;
  const q = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: src.typeName,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    // WFS 2.0 with the EPSG URN uses lat/lon axis order.
    bbox: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326`,
  });
  const fc = await getJson(`${src.url}?${q}`);
  // Some GeoServer setups return lat/lon order for EPSG URN requests; normalise
  // so the first coordinate is always longitude.
  return { type: "FeatureCollection", features: fc.features.map(normaliseAxis) };
}

function normaliseAxis(f) {
  if (!f.geometry) return f;
  const first = firstCoord(f.geometry.coordinates);
  const [x0, y0, x1, y1] = FETCH_BBOX;
  const inBox = (c) => c[0] >= x0 - 1 && c[0] <= x1 + 1 && c[1] >= y0 - 1 && c[1] <= y1 + 1;
  if (first && !inBox(first) && inBox([first[1], first[0]])) {
    return { ...f, geometry: { ...f.geometry, coordinates: swap(f.geometry.coordinates) } };
  }
  return f;
}
const firstCoord = (c) => (typeof c[0] === "number" ? c : c.length ? firstCoord(c[0]) : null);
const swap = (c) => (typeof c[0] === "number" ? [c[1], c[0], ...c.slice(2)] : c.map(swap));

async function fetchOverpass(src) {
  const [x0, y0, x1, y1] = FETCH_BBOX;
  const bb = `${y0},${x0},${y1},${x1}`;
  const query = `[out:json][timeout:120];(way["power"="line"](${bb});way["power"="minor_line"](${bb});node["power"="substation"](${bb});way["power"="substation"](${bb}););out geom tags;`;
  const data = await getJson(src.url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: query }),
  });
  const features = [];
  for (const el of data.elements) {
    const props = { osm_id: `${el.type}/${el.id}`, ...el.tags };
    if (el.type === "node") {
      features.push({ type: "Feature", properties: props, geometry: { type: "Point", coordinates: [el.lon, el.lat] } });
    } else if (el.geometry) {
      const coords = el.geometry.map((g) => [g.lon, g.lat]);
      const closed = el.tags?.power === "substation";
      features.push({
        type: "Feature",
        properties: props,
        geometry: closed ? { type: "Polygon", coordinates: [coords] } : { type: "LineString", coordinates: coords },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

// Servers that ignore HTTP Range (WorldPop) need the whole file once; it is
// cached in data/raw/cache/ and reused on later runs.
async function openTiff(src) {
  if (!src.fullDownload) return fromUrl(src.url);
  const dir = path.join(RAW, "cache");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, path.basename(new URL(src.url).pathname));
  const have = await stat(file).catch(() => null);
  if (!have) {
    console.log(`  downloading full file (server ignores range requests) → ${file}`);
    try {
      const res = await fetch(src.url, { headers: UA });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(file + ".part"));
    } catch (err) {
      throw new Error(
        `Download failed (${err.cause?.code || err.message}). On slow connections, download it manually and re-run:\n` +
          `  curl -o "${file}" "${src.url}"`,
        { cause: err },
      );
    }
    const { rename } = await import("node:fs/promises");
    await rename(file + ".part", file);
  }
  return fromFile(file);
}

async function fetchRaster(src) {
  const tiff = await openTiff(src);
  const image = await tiff.getImage();
  const [ox, oy] = image.getOrigin();
  const [rx, ry] = image.getResolution();
  const [x0, y0, x1, y1] = FETCH_BBOX;
  const col0 = Math.max(0, Math.floor((x0 - ox) / rx));
  const col1 = Math.min(image.getWidth(), Math.ceil((x1 - ox) / rx));
  const row0 = Math.max(0, Math.floor((y1 - oy) / ry)); // ry is negative
  const row1 = Math.min(image.getHeight(), Math.ceil((y0 - oy) / ry));
  const [band] = await image.readRasters({ window: [col0, row0, col1, row1] });
  const nodata = image.getGDALNoData();
  const meta = {
    width: col1 - col0,
    height: row1 - row0,
    originX: ox + col0 * rx,
    originY: oy + row0 * ry,
    resX: rx,
    resY: ry,
    nodata,
    dtype: band.constructor.name,
  };
  return { meta, buffer: Buffer.from(band.buffer, band.byteOffset, band.byteLength) };
}

async function main() {
  await mkdir(RAW, { recursive: true });
  const manifestPath = path.join(RAW, "manifest.json");
  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {}

  const only = process.argv.slice(2);
  const ids = only.length ? only : Object.keys(SOURCES);
  for (const id of ids) {
    const src = SOURCES[id];
    if (!src) throw new Error(`unknown source ${id}`);
    console.log(`→ ${id} (${src.kind})`);
    const retrievedAt = new Date().toISOString();
    let records;
    if (src.kind === "raster") {
      const { meta, buffer } = await fetchRaster(src);
      await writeFile(path.join(RAW, `${id}.bin`), buffer);
      await writeFile(path.join(RAW, `${id}.json`), JSON.stringify(meta, null, 2));
      records = meta.width * meta.height;
      console.log(`  window ${meta.width}×${meta.height} cells, nodata=${meta.nodata}`);
    } else {
      const fc =
        src.kind === "arcgis" ? await fetchArcgis(src) : src.kind === "wfs" ? await fetchWfs(src) : await fetchOverpass(src);
      await writeFile(path.join(RAW, `${id}.geojson`), JSON.stringify(fc));
      records = fc.features.length;
      console.log(`  ${records} features`);
    }
    manifest[id] = {
      url: src.url,
      typeName: src.typeName,
      where: src.where,
      fetchBbox: FETCH_BBOX,
      retrievedAt,
      records,
      licence: src.licence,
      publicUse: src.publicUse,
    };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
