"use client";

// Settlement intelligence panel. Every value shows its evidence class, source
// and date. Candidate priority (desk-based, not yet calculated) is kept
// separate from field-verified priority (set only by field officers).

import Link from "next/link";
import { useEffect, useState } from "react";
import { DataEvidenceBadge, InternalBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { distanceKm, loadGeo, settlementLabel } from "@/lib/geo/client";
import { cx } from "@/lib/format";

function fmt(value, unit) {
  if (value == null) return null;
  if (unit === "0–1") return value.toFixed(2);
  if (unit === "km") return `${value.toFixed(value < 10 ? 2 : 1)} km`;
  if (unit === "m²") return `${Math.round(value).toLocaleString("en")} m²`;
  if (unit === "ha") return `${value.toLocaleString("en", { maximumFractionDigits: 1 })} ha`;
  return Math.round(value).toLocaleString("en");
}

const NAME_SOURCE = {
  grid3_point_inside: "Name from a GRID3 named settlement point inside this extent (2018 field collection).",
  grid3_point_near: "Name from a GRID3 named settlement point within 150 m of this extent (2018 field collection).",
  grid3_many_points_inside: "This extent contains several GRID3 named places, so no single name is given.",
};

const SECTIONS = [
  { title: "People & buildings", keys: ["pop", "buildings", "builtAreaM2", "areaHa"] },
  {
    title: "Electricity evidence",
    keys: ["hrea", "dMv", "dHv", "dSub", "dMg"],
    caveat: "Distances describe proximity to recorded infrastructure, not connection. A settlement far from a mapped line is not known to be unelectrified, and a low night-light value does not prove there is no electricity.",
  },
  { title: "Access & services", keys: ["dRoad", "dHealth", "nHealth2km", "dSchool", "nSchool2km", "dMarket"] },
];

function useNearby(settlement) {
  const [state, setState] = useState({ id: null, data: null, error: null });
  useEffect(() => {
    let alive = true;
    Promise.all([loadGeo("health"), loadGeo("schools")])
      .then(([health, schools]) => {
        const here = [settlement.lon, settlement.lat];
        const nearest = (fc, name) =>
          fc.features
            .map((f) => ({ name: name(f.properties), props: f.properties, km: distanceKm(here, f.geometry.coordinates) }))
            .sort((a, b) => a.km - b.km)
            .slice(0, 3);
        if (alive)
          setState({
            id: settlement.id,
            data: {
              health: nearest(health, (p) => p.facility_name || "Unnamed health facility"),
              schools: nearest(schools, (p) => p.name || "Unnamed school"),
            },
            error: null,
          });
      })
      .catch((e) => alive && setState({ id: settlement.id, data: null, error: e.message }));
    return () => {
      alive = false;
    };
  }, [settlement.id, settlement.lon, settlement.lat]);
  return state.id === settlement.id ? state : { data: null, error: null };
}

function IndicatorRow({ def, value }) {
  const v = fmt(value, def.unit);
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-[13px]">{def.label}</span>
        <span className={cx("whitespace-nowrap text-[13px] font-semibold tabular-nums", v == null && "font-normal italic text-muted")}>{v ?? "Unknown"}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <DataEvidenceBadge evidence={v == null ? "unknown" : def.evidence} />
        {!def.publicUse && <InternalBadge />}
        <span className="text-[11px] text-muted">
          {def.source} · {def.datasetDate}
        </span>
      </div>
      <details className="group mt-1 text-[11px] text-muted">
        <summary className="cursor-pointer select-none list-none text-brand-ink hover:underline">
          <span className="group-open:hidden">Method &amp; limitations</span>
          <span className="hidden group-open:inline">Hide method</span>
        </summary>
        <p className="mt-1">{def.method}</p>
        {def.limitations?.length > 0 && (
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {def.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )}
        <p className="mt-1">
          {def.provider} · Licence: {def.licence} · Retrieved {def.retrievedAt ? def.retrievedAt.slice(0, 10) : "—"}
        </p>
      </details>
    </li>
  );
}

export function SettlementPanel({ settlement: s, grid, meta, lgas, onZoom, onClose }) {
  const indicators = meta?.indicators || {};
  const values = { ...s, ...(grid || {}) };
  const lga = lgas.find((l) => l.id === s.lga);
  const nearby = useNearby(s);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{s.type}</p>
            <h2 className="mt-0.5 text-lg font-semibold leading-snug">{settlementLabel(s)}</h2>
          </div>
          <button type="button" onClick={onClose} className="-mr-1 shrink-0 rounded-sm p-1 text-muted hover:bg-slate-100" aria-label="Close settlement panel">
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          {lga?.name || s.lga} LGA · {s.wardName ? `${s.wardName} ward` : "ward not determined"}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted">GRID3 extent {s.mgrsCode}</p>
        <div className="mt-2 flex gap-3 text-xs">
          <button type="button" onClick={onZoom} className="inline-flex items-center gap-1 font-medium text-brand-ink hover:underline">
            <Icon name="target" className="size-3.5" /> Zoom to extent
          </button>
          <Link href={`/settlements?q=${encodeURIComponent(s.mgrsCode)}`} className="inline-flex items-center gap-1 font-medium text-brand-ink hover:underline">
            <Icon name="pin" className="size-3.5" /> Open in table
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
        <div className="text-[11px] text-muted">
          {NAME_SOURCE[s.nameSource] || "No GRID3 named point matches this extent. A name can be recorded through field verification; none is invented here."}
          {s.altNames?.length > 0 && <p className="mt-0.5">Other recorded names: {s.altNames.join(", ")}</p>}
          {s.namedPlaces?.length > 0 && <p className="mt-0.5">Named places inside: {s.namedPlaces.join(", ")}</p>}
        </div>

        {/* Priority – candidate and verified are never merged */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-sm border border-dashed border-candidate/50 bg-candidate-soft/60 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-candidate">Candidate priority</p>
            <p className="mt-0.5 text-sm font-semibold">Not calculated</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">Desk-based scoring is on hold until indicators are validated.</p>
          </div>
          <div className="rounded-sm border border-border bg-surface-2 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Verified priority</p>
            <p className="mt-0.5 text-sm font-semibold">Not verified</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">No field verification is linked to this settlement.</p>
          </div>
        </div>

        {s.flags?.length > 0 && (
          <div className="mt-3 rounded-sm border border-pink-200 bg-pink-50 px-3 py-2">
            <p className="text-xs font-semibold text-pink-900">Data-quality flags</p>
            <ul className="mt-0.5 list-disc pl-4 text-[11px] text-pink-900">
              {s.flags.map((f) => (
                <li key={f}>{meta?.flags?.[f] || f}</li>
              ))}
            </ul>
          </div>
        )}

        {SECTIONS.map((sec) => (
          <section key={sec.title} className="mt-4">
            <h3 className="border-b border-border pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{sec.title}</h3>
            {sec.caveat && <p className="mt-2 rounded-sm bg-surface-2 px-2.5 py-1.5 text-[11px] leading-snug text-muted">{sec.caveat}</p>}
            <ul className="divide-y divide-border">
              {sec.keys.filter((k) => indicators[k]).map((k) => (
                <IndicatorRow key={k} def={indicators[k]} value={values[k]} />
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-4">
          <h3 className="border-b border-border pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Nearest facilities</h3>
          {nearby.error ? (
            <p className="mt-2 text-xs text-critical">Could not load facilities: {nearby.error}</p>
          ) : !nearby.data ? (
            <div className="mt-2 space-y-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded-sm bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="mt-2 grid gap-3">
              {[
                ["Health facilities", nearby.data.health, (p) => [p.facility_type, p.functional && `functional: ${p.functional}`].filter(Boolean).join(" · ")],
                ["Schools", nearby.data.schools, (p) => [p.education, p.management].filter(Boolean).join(" · ")],
              ].map(([title, list, sub]) => (
                <div key={title}>
                  <p className="flex items-center justify-between text-xs font-medium">
                    {title} <DataEvidenceBadge evidence="reported" />
                  </p>
                  <ul className="mt-1 space-y-1">
                    {list.map((f, i) => (
                      <li key={i} className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="min-w-0">
                          <span className="block truncate">{f.name}</span>
                          <span className="block truncate text-[11px] text-muted">{sub(f.props)}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted">{f.km.toFixed(1)} km</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-[11px] text-muted">Straight-line distance from the settlement&apos;s representative point. GRID3 facility records; operating status is reported, not verified.</p>
            </div>
          )}
        </section>

        <p className="mb-2 mt-5 border-t border-border pt-3 text-[11px] leading-snug text-muted">
          Confidence: desk-based evidence only. Settlement extents and population are modelled; facility and grid records are reported by third parties. Confirm on the ground before using for investment decisions.
        </p>
      </div>
    </div>
  );
}
