"use client";

// Header search across real geospatial entities: LGAs, wards and GRID3
// settlements (by name, named places inside, or extent id). Results open the
// Intelligence Map focused on the selection.

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadGeo, loadSettlementRecords, settlementLabel } from "@/lib/geo/client";
import { cx, formatNumber } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

function buildIndex(records, wards, lgas) {
  const lgaName = Object.fromEntries(lgas.features.map((f) => [f.properties.id, f.properties.name]));
  return [
    ...lgas.features.map((f) => ({ kind: "LGA", id: f.properties.id, label: `${f.properties.name} LGA`, sub: "Local Government Area", href: `/map?lga=${f.properties.id}`, text: f.properties.name.toLowerCase() })),
    ...wards.features.map((f) => ({ kind: "Ward", id: f.properties.id, label: f.properties.name, sub: `${lgaName[f.properties.lga] || ""} LGA`, href: `/map?ward=${encodeURIComponent(f.properties.id)}`, text: `${f.properties.name} ${f.properties.altNames || ""}`.toLowerCase() })),
    ...records.map((s) => ({
      kind: "Settlement",
      id: s.id,
      label: settlementLabel(s),
      sub: `${lgaName[s.lga] || s.lga}${s.wardName ? ` · ${s.wardName}` : ""} · ${formatNumber(s.buildings)} buildings`,
      href: `/map?s=${encodeURIComponent(s.id)}`,
      text: [s.name, ...(s.altNames || []), ...(s.namedPlaces || []), s.mgrsCode].filter(Boolean).join(" ").toLowerCase(),
      weight: s.buildings,
    })),
  ];
}

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(null);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const ensureIndex = () => {
    if (index || error) return;
    Promise.all([loadSettlementRecords(), loadGeo("wards"), loadGeo("lgas")])
      .then(([r, w, l]) => setIndex(buildIndex(r, w, l)))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    const onDoc = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!index || term.length < 2) return [];
    const order = { LGA: 0, Ward: 1, Settlement: 2 };
    return index
      .filter((r) => r.text.includes(term))
      .sort((a, b) => order[a.kind] - order[b.kind] || (b.text.startsWith(term) - a.text.startsWith(term)) || (b.weight || 0) - (a.weight || 0))
      .slice(0, 12);
  }, [q, index]);

  const go = (r) => {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(r.href);
  };

  return (
    <div ref={boxRef} className="relative">
      <label className="flex items-center gap-2 rounded-sm border border-border bg-surface-2 px-2.5 py-1.5 text-sm focus-within:border-brand focus-within:bg-white sm:w-72">
        <Icon name="search" className="size-4 shrink-0 text-muted" />
        <span className="sr-only">Search settlements, wards and LGAs</span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => {
            ensureIndex();
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)));
            else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
            else if (e.key === "Enter" && results[active]) go(results[active]);
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search settlements, wards…"
          className="w-28 min-w-0 flex-1 bg-transparent placeholder:text-slate-400 focus:outline-none sm:w-auto"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="global-search-results"
          aria-autocomplete="list"
        />
        <kbd className="hidden rounded-sm border border-border px-1 font-mono text-[10px] text-muted sm:block">/</kbd>
      </label>
      {open && q.trim().length >= 2 && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[min(26rem,calc(100vw-1.5rem))] overflow-hidden rounded-sm border border-border bg-white shadow-lg">
          {error ? (
            <p className="px-3 py-3 text-sm text-critical">Search unavailable: {error}</p>
          ) : !index ? (
            <p className="px-3 py-3 text-sm text-muted">Loading settlement index…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">
              No match. Most GRID3 settlements have no recorded name; browse them on the{" "}
              <a className="text-brand-ink underline" href="/settlements">Settlements</a> page.
            </p>
          ) : (
            <ul id="global-search-results" role="listbox" className="max-h-96 overflow-y-auto py-1">
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cx("flex w-full items-start gap-3 px-3 py-2 text-left", i === active && "bg-brand-soft")}
                  >
                    <span className="mt-0.5 w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted">{r.kind}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{r.label}</span>
                      <span className="block truncate text-xs text-muted">{r.sub}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
