"use client";

import { DataEvidenceBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ALL_TOGGLES, COLOR_MODES, EXTENT_TYPES, HREA_STOPS, POP_STOPS, UNKNOWN_COLOR } from "./layerConfig";

/** Legend symbol for a layer. Reported lines are dashed, mapped lines dotted, official lines solid. */
export function Swatch({ swatch }) {
  if (!swatch) return null;
  const { kind, color, width = 2, dash, dotted, stops } = swatch;
  if (kind === "line") {
    return (
      <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden className="shrink-0">
        <line x1="1" y1="5" x2="17" y2="5" stroke={color} strokeWidth={width} strokeDasharray={dash ? "4 2" : dotted ? "1 3" : undefined} strokeLinecap={dotted ? "round" : "butt"} />
      </svg>
    );
  }
  if (kind === "fill") return <span className="size-3 shrink-0 rounded-[2px] border border-black/20" style={{ background: color }} aria-hidden />;
  if (kind === "square") return <span className="size-3 shrink-0 rotate-45 border-2 border-white outline outline-1 outline-black/20" style={{ background: color }} aria-hidden />;
  if (kind === "text") return <span className="w-[18px] shrink-0 text-center text-[11px] font-semibold leading-none" aria-hidden>Aa</span>;
  if (kind === "ramp") {
    return <span className="h-2.5 w-[18px] shrink-0 rounded-[2px]" style={{ background: `linear-gradient(to right, ${stops.map(([, c]) => c).join(",")})` }} aria-hidden />;
  }
  return <span className="size-3 shrink-0 rounded-full border-2 border-white outline outline-1 outline-black/20" style={{ background: color }} aria-hidden />;
}

/** Evenly spaced stops with value ticks (scales are non-linear). */
function Ramp({ stops, format = (v) => v }) {
  return (
    <div>
      <div className="h-2 w-44 rounded-[2px]" style={{ background: `linear-gradient(to right, ${stops.map(([, c], i) => `${c} ${(100 * i) / (stops.length - 1)}%`).join(",")})` }} />
      <div className="flex w-44 justify-between text-[10px] tabular-nums text-muted">
        {stops.map(([v]) => (
          <span key={v}>{format(v)}</span>
        ))}
      </div>
    </div>
  );
}

const kfmt = (v) => (v >= 1000 ? `${v / 1000}k` : v);

export function MapLegend({ visible, colorMode, open, onToggle }) {
  const active = ALL_TOGGLES.filter((t) => visible.has(t.id) && t.id !== "settlements");
  return (
    <div className="absolute bottom-8 left-3 z-10 max-h-[calc(100%-6rem)] w-60 overflow-y-auto rounded-sm border border-border bg-white/95 text-xs shadow-sm backdrop-blur">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between px-3 py-2 font-semibold">
        Legend
        <Icon name="chevronDown" className={`size-4 text-muted transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-3 pb-3 pt-2">
          {visible.has("settlements") && (
            <div>
              <p className="mb-1 flex items-center justify-between font-medium">
                Settlements · {COLOR_MODES.find((m) => m.id === colorMode)?.label.toLowerCase()}
                <DataEvidenceBadge evidence="modelled" />
              </p>
              {colorMode === "type" &&
                EXTENT_TYPES.map((t) => (
                  <p key={t.value} className="flex items-center gap-2 py-px">
                    <span className="size-3 rounded-[2px]" style={{ background: t.color }} aria-hidden />
                    {t.label}
                  </p>
                ))}
              {colorMode === "pop" && <Ramp stops={POP_STOPS} format={kfmt} />}
              {colorMode === "hrea" && (
                <>
                  <Ramp stops={HREA_STOPS} />
                  <p className="mt-1 flex items-center gap-2">
                    <span className="size-3 rounded-[2px]" style={{ background: UNKNOWN_COLOR }} aria-hidden /> Unknown (outside HREA mask)
                  </p>
                </>
              )}
              {colorMode === "flags" && (
                <>
                  <p className="flex items-center gap-2"><span className="size-3 rounded-[2px] bg-[#db2777]" aria-hidden /> Has data-quality flag</p>
                  <p className="flex items-center gap-2"><span className="size-3 rounded-[2px] bg-[#9ca3af]" aria-hidden /> No flag</p>
                </>
              )}
              <p className="mt-1 text-[10px] text-muted">Circles below zoom 11 · sized by building count</p>
            </div>
          )}
          {active.length > 0 && (
            <ul className="space-y-1">
              {active.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <Swatch swatch={t.swatch} />
                  <span className="min-w-0 flex-1">{t.label}</span>
                  <DataEvidenceBadge evidence={t.evidence} />
                </li>
              ))}
            </ul>
          )}
          {visible.has("nightlight") && (
            <p className="text-[10px] leading-snug text-muted">Night-light: HREA 2020 modelled likelihood (0–1). Not a connection status; low values do not prove absence of electricity.</p>
          )}
          {visible.has("population") && <p className="text-[10px] leading-snug text-muted">Population: WorldPop 2026 modelled estimate, not a census.</p>}
        </div>
      )}
    </div>
  );
}
