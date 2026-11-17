"use client";

// In-map search: settlements (name, named places, extent id), LGAs, or a
// "lat, lon" coordinate pair to navigate to.

import { useMemo, useState } from "react";
import { settlementLabel } from "@/lib/geo/client";
import { cx, formatNumber } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

const COORD = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/;

export function MapSearch({ core, onSettlement, onLga, onPoint }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!core || term.length < 2) return [];
    const m = q.match(COORD);
    if (m) {
      // Always "lat, lon": in the pilot area both values are 6–8, so order cannot be guessed.
      const [a, b] = [Number(m[1]), Number(m[2])];
      return [{ kind: "Location", label: `Go to ${a.toFixed(5)}, ${b.toFixed(5)}`, sub: "Latitude, longitude", run: () => onPoint(b, a) }];
    }
    const lgas = core.lgas.filter((l) => l.name.toLowerCase().includes(term)).map((l) => ({ kind: "LGA", label: `${l.name} LGA`, sub: "Focus area", run: () => onLga(l.id) }));
    const sets = [];
    for (const s of core.byId.values()) {
      const hay = [s.name, ...(s.altNames || []), ...(s.namedPlaces || []), s.mgrsCode].filter(Boolean).join(" ").toLowerCase();
      if (hay.includes(term)) sets.push(s);
    }
    sets.sort((a, b) => b.buildings - a.buildings);
    const lgaName = Object.fromEntries(core.lgas.map((l) => [l.id, l.name]));
    return [
      ...lgas,
      ...sets.slice(0, 10).map((s) => ({
        kind: "Settlement",
        label: settlementLabel(s),
        sub: `${lgaName[s.lga]}${s.wardName ? ` · ${s.wardName}` : ""} · ${formatNumber(s.buildings)} bldgs`,
        run: () => onSettlement(s.id),
      })),
    ];
  }, [q, core, onLga, onPoint, onSettlement]);

  const go = (r) => {
    r.run();
    setOpen(false);
  };

  return (
    <div className="pointer-events-auto relative w-full max-w-xs flex-1 sm:flex-none">
      <label className="flex items-center gap-2 rounded-sm border border-border bg-white px-2.5 py-2 shadow-sm focus-within:border-brand">
        <Icon name="search" className="size-4 shrink-0 text-muted" />
        <span className="sr-only">Search the map</span>
        <input
          value={q}
          disabled={!core}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)));
            else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
            else if (e.key === "Enter" && results[active]) go(results[active]);
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Find a settlement or lat, lon"
          className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="text-muted hover:text-foreground">
            <Icon name="close" className="size-3.5" />
          </button>
        )}
      </label>
      {open && q.trim().length >= 2 && (
        <ul className="absolute inset-x-0 top-full mt-1 max-h-80 overflow-y-auto rounded-sm border border-border bg-white py-1 text-sm shadow-lg" role="listbox">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-muted">No named settlement matches. Most GRID3 extents are unnamed.</li>
          ) : (
            results.map((r, i) => (
              <li key={`${r.kind}-${r.label}-${i}`} role="option" aria-selected={i === active}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => go(r)} className={cx("w-full px-3 py-1.5 text-left", i === active && "bg-brand-soft")}>
                  <span className="block truncate font-medium">{r.label}</span>
                  <span className="block truncate text-xs text-muted">{r.kind} · {r.sub}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
