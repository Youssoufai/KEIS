"use client";

import Link from "next/link";
import { DataEvidenceBadge, InternalBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { cx, formatNumber } from "@/lib/format";
import { BASEMAPS, COLOR_MODES, LAYER_GROUPS } from "./layerConfig";
import { Swatch } from "./MapLegend";

export function LayerPanel({ ready, lgas, lga, onLga, summary, visible, onToggle, loading, colorMode, onColorMode, basemap, onBasemap, sources, onClose }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Intelligence Map</p>
          <p className="text-sm font-semibold">Ankpa · Dekina · Adavi</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-sm p-1 text-muted hover:bg-slate-100 lg:hidden" aria-label="Close layers">
          <Icon name="close" className="size-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-border px-4 py-3">
          <label htmlFor="lga-select" className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Area of interest
          </label>
          <select
            id="lga-select"
            value={lga}
            disabled={!ready}
            onChange={(e) => onLga(e.target.value)}
            className="mt-1 w-full rounded-sm border border-border bg-white px-2 py-1.5 text-sm"
          >
            <option value="all">All three pilot LGAs</option>
            {lgas.map((l) => (
              <option key={l.id} value={l.id}>{l.name} LGA</option>
            ))}
          </select>
          {summary ? (
            <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border text-xs">
              <Stat label="Settlements" value={formatNumber(summary.settlements)} ev="modelled" />
              <Stat label="Population" value={summary.population == null ? "Unknown" : formatNumber(summary.population)} ev="modelled" />
              <Stat label="Schools" value={formatNumber(summary.schools)} ev="reported" />
              <Stat label="Health facilities" value={formatNumber(summary.health)} ev="reported" />
            </dl>
          ) : (
            <div className="mt-3 h-[88px] animate-pulse rounded-sm bg-slate-100" />
          )}
        </section>

        {LAYER_GROUPS.map((g) => (
          <section key={g.id} className="border-b border-border px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{g.label}</h3>
              <DataEvidenceBadge evidence={g.evidence} />
            </div>
            <ul className="space-y-1">
              {g.layers.map((l) => {
                const src = sources?.[l.sourceKey];
                return (
                  <li key={l.id}>
                    <label className={cx("flex cursor-pointer items-center gap-2.5 rounded-sm px-1 py-1 text-[13px] hover:bg-slate-50", !ready && "opacity-60")}>
                      <input type="checkbox" checked={visible.has(l.id)} disabled={!ready} onChange={() => onToggle(l.id)} className="size-3.5 accent-brand" />
                      <Swatch swatch={l.swatch} />
                      <span className="min-w-0 flex-1 truncate" title={src ? `${src.provider} · ${src.datasetDate}` : undefined}>
                        {l.label}
                      </span>
                      {loading.has(l.id) && <span className="size-3 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Loading" />}
                      {l.evidence && l.evidence !== g.evidence && <DataEvidenceBadge evidence={l.evidence} />}
                      {l.restricted && <InternalBadge />}
                    </label>
                  </li>
                );
              })}
            </ul>
            {g.note && <p className="mt-2 text-[11px] leading-snug text-muted">{g.note}</p>}
          </section>
        ))}

        <section className="border-b border-border px-4 py-3">
          <label htmlFor="color-mode" className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Colour settlements by
          </label>
          <select id="color-mode" value={colorMode} disabled={!ready} onChange={(e) => onColorMode(e.target.value)} className="mt-1 w-full rounded-sm border border-border bg-white px-2 py-1.5 text-sm">
            {COLOR_MODES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </section>

        <section className="border-b border-border px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Basemap</p>
          <div className="mt-1.5 grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-border bg-border" role="radiogroup" aria-label="Basemap">
            {Object.entries(BASEMAPS).map(([id, b]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={basemap === id}
                disabled={!ready}
                onClick={() => onBasemap(id)}
                className={cx("px-2 py-1.5 text-xs font-medium", basemap === id ? "bg-brand text-white" : "bg-white hover:bg-slate-50")}
              >
                {b.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted">Satellite imagery helps check settlement extents visually.</p>
        </section>

        <section className="px-4 py-3 text-[11px] leading-snug text-muted">
          <p>
            <InternalBadge /> layers come from the Nigeria SE4ALL platform, which states no licence. Use them for internal analysis only; they are excluded from public exports.
          </p>
          <Link href="/data-sources" className="mt-2 inline-flex items-center gap-1 font-medium text-brand-ink hover:underline">
            Data sources &amp; limitations <Icon name="arrow" className="size-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, ev }) {
  return (
    <div className="bg-white px-2.5 py-2">
      <dt className="flex items-center justify-between gap-1 text-muted">
        {label}
        <span className={cx("size-1.5 rounded-full", ev === "modelled" ? "bg-violet-500" : "bg-sky-500")} title={ev === "modelled" ? "Modelled" : "Reported"} />
      </dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
