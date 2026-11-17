# Data sources for the geospatial analysis

Scope: Ankpa, Dekina and Adavi LGAs, Kogi State.
Research date: 2026-11-17. Every source was queried live, not just read about in documentation.
Status: approved for prototype use, with the conditions in [Decisions](#decisions).

The machine-readable version of this document is `scripts/data/sources.mjs`. Retrieval timestamps and record counts for each run are in `data/raw/manifest.json` and in `data/derived/sources.json`. Clipped, per-LGA results and the validation checks are in `docs/GEOSPATIAL_VALIDATION.md`, which the build script generates.

## Decisions

Approved by the project owner on 2026-11-17.

1. **SE4ALL.** SE4ALL datasets may be used internally for the prototype and its analysis. Each layer records its source, retrieval date and evidence class. SE4ALL publishes no licence for any of its layers, so they are marked `publicUse: false`. They are written only to `data/derived/restricted/`, and must stay out of public-facing maps and exports until SE4ALL/REA confirms permission.
2. **Sample data.** The fabricated sample records in `lib/data/seed.js` (wards, communities, coordinates, population figures) are kept only to demonstrate non-map workflows: reporting, verification and assessment. They must never be used in the geospatial map or in real-data analysis, and must always be labelled as samples. The geospatial pipeline and the map do not import the seed data or the app store.

Requirements applied in the pipeline:

| Requirement | Where it is enforced |
|---|---|
| Check whether GRID3 v4.1 rows are blocks that must be aggregated | Confirmed, see [Unit of analysis](#unit-of-analysis). Blocks are aggregated in `build.mjs`, and the checks are written to the validation report. |
| Clip to the actual LGA boundaries, not the bounding box | `build.mjs` assigns every feature by point-in-polygon against the three GRID3 LGA polygons. The download window (`FETCH_BBOX`) is only a search area. |
| Source, date, evidence class and limitations for every derived indicator | Stored in the `indicators` dictionary in `data/derived/settlements-meta.json` and shown next to every value on the map. |
| Candidate priority kept separate from field-verified priority | No priority is calculated yet. The scoring engine waits until the geometry and indicators are validated. |
| Missing grid data is not proof of no electricity | Distance indicators are labelled "distance to nearest **mapped** line". Missing HREA values are `null` and shown as *Unknown*. Nothing in the pipeline outputs "no electricity". |
| Sample data must not contaminate geospatial calculations | The pipeline reads only `data/raw/`. The map loads only `data/derived/` through `/api/geo/*`. |

## Evidence classes

| Class | Meaning |
|---|---|
| `official` | Administrative boundary published by a mandated body |
| `reported` | Record collected or reported by an agency or survey, not verified by this project |
| `mapped` | Crowd-mapped or remotely mapped feature (for example OSM) |
| `modelled` | Model or satellite estimate, not an observation |
| `measured` | Direct instrument measurement |
| `verified` | Confirmed by a project field officer. The pipeline never assigns this class. |
| `unknown` | No usable evidence |

## Sources

The bounding-box counts from the research stage are given only for context. Final per-LGA counts after clipping are in `docs/GEOSPATIAL_VALIDATION.md`.

| Need | Dataset | Access | Licence | Public use | Evidence | Dataset date |
|---|---|---|---|---|---|---|
| LGA boundaries | GRID3 `NGA_LGA_Boundaries_2` (source WHO/eHA) | ArcGIS REST | CC BY 4.0 | Yes | official | 2019 |
| Ward boundaries | GRID3 `GRID3_NGA_operational_wards_v4_0` | ArcGIS REST | Open, attribution | Yes | official | 2026-10-16 |
| Settlement extents | GRID3 `GRID3_NGA_settlement_extents_v4_1` | ArcGIS REST | Open, attribution (exact licence to confirm) | Yes | modelled | v4.1 |
| Settlement names | GRID3 `Settlements_in_Nigeria` | ArcGIS REST | CC BY 4.0 | Yes | reported | 2018 field collection |
| Population | WorldPop R2025A constrained 100 m, 2026 | GeoTIFF (full download; the server ignores range requests) | CC BY 4.0 | Yes | modelled | 2026 projection |
| Health facilities | GRID3 `GRID3_NGA_Health_Facilities_v4_0` | ArcGIS REST | Open, attribution | Yes | reported | 2026 |
| Schools | GRID3 `Schools_in_Nigeria` | ArcGIS REST | CC BY 4.0 | Yes | reported | 2018–2019 |
| Markets | GRID3 `Markets_in_Nigeria` | ArcGIS REST | CC BY 4.0 | Yes | reported | 2018–2019 |
| Roads (trunk to tertiary) | GRID3 `GRID3_NGA_roads` | ArcGIS REST | Open, attribution (ODbL for OSM-derived parts) | Yes | mapped | 2025 |
| 33/11 kV distribution lines | SE4ALL `distribution_line_all_no_modell_mv` | GeoServer WFS | **Not stated** | **No** | reported | Unknown |
| HV lines | SE4ALL `existing_lines_high_voltage` | WFS | **Not stated** | **No** | reported | Unknown |
| Substations | SE4ALL `substations_currently_installed` | WFS | **Not stated** | **No** | reported | Unknown |
| Mini-grids | SE4ALL `minigrids` | WFS | **Not stated** | **No** | reported | Unknown |
| Power lines and substations | OpenStreetMap via Overpass | Overpass API | ODbL 1.0 | Yes, with attribution | mapped | Retrieved live |
| Electrification likelihood | HREA v1.1 `set_prplit` 2020 (Univ. of Michigan, from VIIRS) | Cloud-optimised GeoTIFF on S3 (range reads) | Free, citation required | Yes | modelled | 2020 |
| Solar resource | Global Solar Atlas PVOUT/GHI | Manual country GeoTIFF download | CC BY 4.0 | Yes | modelled | **Not yet acquired** |

Sources from the research stage that are not used yet:

- **SE4ALL off-grid clusters** (`cluster_offgrid`, `cluster_all_new`). These are SE4ALL's own modelled analysis. They are left out so that our indicators come from primary layers.
- **SE4ALL night-light hexagons, 2019.** HREA covers the same signal at finer resolution.
- **Global Solar Atlas.** It needs a manual download and varies little across three neighbouring LGAs. It will be added later as a low-weight indicator.

## Unit of analysis

**Check: are GRID3 v4.1 rows settlement blocks that need aggregating? Yes.**

- Each row has a `block_id` and a `blocks_per_settl_extent` field, and some `blocks_per_settl_extent` values are in the thousands. A single row is a block, not a settlement.
- The layer has no explicit settlement ID. The `mgrs_code` field (MGRS 1 km cell plus a suffix, for example `32NLP4509_1`) behaves as one. In the download window, 5,319 of 5,435 `mgrs_code` groups have exactly `blocks_per_settl_extent` blocks and a single `extent_type`.
- The geometry agrees with this. 400 of 401 sampled multi-block groups merge into one contiguous polygon.
- Groups whose block count does not match are flagged, not hidden. Most are settlements cut off at the edge of the download window, which the LGA clip then excludes. The rest differ by a few blocks. The build lists every mismatch inside the pilot LGAs in the validation report.

**Unit of analysis: the GRID3 settlement extent**, made by merging blocks that share an `mgrs_code`. Each settlement gets:

- an LGA and a ward, from point-in-polygon of a representative point that lies inside the settlement. Settlements whose blocks cross an LGA boundary are flagged.
- a name only when a GRID3 named settlement point lies inside the extent or within 150 m of it. Otherwise it is labelled "Unnamed settlement (GRID3 …)". Names are never invented.

## Indicators

Each indicator's source, dataset date, evidence class, method and limitations are stored once in `data/derived/settlements-meta.json` (`indicators`) and shown alongside the value on the map. A missing value is stored as `null` and shown as *Unknown*.

| Indicator | Source | Evidence | Method |
|---|---|---|---|
| Building count, built area | GRID3 settlement extents | modelled | Sum over blocks |
| Population 2026 | WorldPop | modelled | Sum of 100 m cells whose centre falls inside the extent |
| Electrification likelihood 2020 | HREA `set_prplit` | modelled | Mean of the valid 30 m cells inside the extent, otherwise the cell at the representative point, otherwise `null` |
| Distance to nearest mapped 33/11 kV line | SE4ALL (restricted) | reported | Planar distance from the representative point |
| Distance to nearest mapped HV line or substation | SE4ALL (restricted) + OSM | reported / mapped | as above |
| Distance to nearest mini-grid | SE4ALL (restricted) | reported | as above |
| Distance to nearest health facility, school, market; count within 2 km | GRID3 | reported | as above |
| Distance to nearest trunk–tertiary road | GRID3 roads | mapped | as above |

**Edge effects.** Counts and displayed layers are clipped to the LGA boundaries. Distance indicators are measured against infrastructure inside the LGAs **plus a 10 km buffer**, because a settlement near the boundary can be served by a line or clinic just across it. The validation report states this, and each distance indicator records it in its method.

## Known gaps and limitations

- **No dataset says whether a household or settlement is connected.** Electricity access is only ever inferred from evidence: distance to mapped lines and night-light likelihood. A settlement with no mapped line nearby is *Unknown*, never "unelectrified".
- **The SE4ALL licence is unstated** for all 27 of its layers. They are for internal use only, as set out under Decisions.
- **The time series is old.** HREA's latest year is 2020 and the GRID3 settlement names are from 2018. The map shows these dates.
- **Settlement names are sparse.** Most extents have no named point inside them, and Adavi has the fewest. Field officers can add names through verification.
- **GRID3's own substation and government-building layers are empty** for this area.
- **The LGA boundaries (2019) and the ward boundaries (2026) do not line up exactly.** The size of the mismatch is in the validation report.
- **Solar varies little across the three LGAs**, so it will carry little weight in any later scoring.

## Pipeline

```
npm run data:fetch   # downloads sources into data/raw/ (git-ignored; ~200 MB including the WorldPop file)
npm run data:build   # clips, aggregates and measures, then writes data/derived/ and docs/GEOSPATIAL_VALIDATION.md
```

- `data/derived/*.geojson`: open-licence layers (boundaries, wards, settlements, facilities, roads, OSM power).
- `data/derived/restricted/*.geojson`: SE4ALL layers. Internal only.
- `data/derived/settlements-meta.json`: the indicator dictionary and the per-LGA summary.
- `data/derived/sources.json`: the source registry merged with retrieval metadata.

The internal map loads these files through `app/api/geo/[layer]/route.js`. The prototype has **no authentication** (the role switcher is not access control), so "internal only" is enforced by convention and by the route's `publicUse` flag. Real access control is needed before deployment.

## References

- [GRID3 ArcGIS services](https://services3.arcgis.com/BU6Aadhn6tbBEdyk/arcgis/rest/services)
- [WorldPop data API](https://hub.worldpop.org/rest/data/pop)
- [Nigeria SE4ALL data portal](https://data.nigeriase4all.gov.ng/api/v2/datasets/)
- [HREA data page](https://hrea.isr.umich.edu/data.html) · [Microsoft AI for Earth: HREA](https://microsoft.github.io/AIforEarthDataSets/data/hrea.html)
- [Global Solar Atlas (World Bank catalogue)](https://datacatalog.worldbank.org/search/dataset/0038509)
- [Reiner Lemoine Institute, SE4ALL portal launch](https://reiner-lemoine-institut.de/?p=10053)
- [OpenStreetMap copyright and licence](https://www.openstreetmap.org/copyright)
