import { ACCESS_STATUSES, EVIDENCE_LEVELS, REPORT_STATUSES } from "@/lib/config/constants";
import { cx } from "@/lib/format";

export function Badge({ children, className, title }) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-px text-[11px] font-medium leading-5",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Marks any invented demonstration record. */
export function SampleBadge({ className }) {
  return (
    <Badge
      title="Invented demonstration record – not official Kogi State data"
      className={cx("border-purple-300 bg-purple-50 text-purple-800", className)}
    >
      Sample
    </Badge>
  );
}

/** Marks costs, capacities and recommendations as indicative (FRD Cat. 6). */
export function IndicativeBadge({ className, children = "Indicative" }) {
  return (
    <Badge
      title="Indicative estimate from documented assumptions – not a supplier quotation or engineering design"
      className={cx("border-candidate/40 bg-candidate-soft text-candidate", className)}
    >
      {children}
    </Badge>
  );
}

export function DraftBadge({ className, children = "Draft – pending approval" }) {
  return <Badge className={cx("border-slate-300 bg-slate-100 text-slate-700", className)}>{children}</Badge>;
}

/** Data whose licence is unconfirmed (SE4ALL). Internal analysis only. */
export function InternalBadge({ className, children = "Internal" }) {
  return (
    <Badge
      title="Source licence not stated (SE4ALL). Internal analysis only – not for public maps or exports."
      className={cx("border-candidate/40 bg-candidate-soft text-candidate", className)}
    >
      {children}
    </Badge>
  );
}

// ---- Geospatial evidence classes (docs/DATA_SOURCES.md) -------------------

export const DATA_EVIDENCE = {
  official: { label: "Official", cls: "border-slate-400 bg-white text-slate-700", hint: "Administrative boundary from a mandated body" },
  reported: { label: "Reported", cls: "border-dashed border-sky-500 bg-sky-50 text-sky-900", hint: "Reported by an agency or survey; not verified by this project" },
  mapped: { label: "Mapped", cls: "border-dashed border-slate-400 bg-slate-50 text-slate-700", hint: "Crowd- or remotely-mapped feature" },
  modelled: { label: "Modelled", cls: "border-violet-300 bg-violet-50 text-violet-900", hint: "Model or satellite estimate, not an observation" },
  measured: { label: "Measured", cls: "border-teal-400 bg-teal-50 text-teal-900", hint: "Direct instrument measurement" },
  verified: { label: "Field-verified", cls: "border-positive bg-positive text-white", hint: "Confirmed by a project field officer" },
  sample: { label: "Sample", cls: "border-purple-300 bg-purple-50 text-purple-800", hint: "Invented demonstration record" },
  unknown: { label: "Unknown", cls: "border-slate-300 bg-white text-slate-500", hint: "No usable evidence" },
};

/** Evidence class of a dataset or derived value. */
export function DataEvidenceBadge({ evidence, className }) {
  const m = DATA_EVIDENCE[evidence] || DATA_EVIDENCE.unknown;
  return (
    <Badge className={cx(m.cls, className)} title={m.hint}>
      {m.label}
    </Badge>
  );
}

// ---- Workflow evidence levels (public report lifecycle) ----------------

const EVIDENCE_STYLES = {
  none: "border-slate-300 bg-white text-slate-600",
  reported: "border-dashed border-candidate/50 bg-candidate-soft text-candidate",
  under_review: "border-dashed border-sky-400 bg-sky-50 text-sky-900",
  verified: "border-positive bg-positive-soft text-positive",
  assessed: "border-positive bg-positive text-white",
};

const EVIDENCE_SHORT = {
  none: "No information",
  reported: "Reported · unverified",
  under_review: "Under review · unverified",
  verified: "Verified",
  assessed: "Assessed",
};

/** Shows how trustworthy a status is: reported → under review → verified → assessed. */
export function EvidenceBadge({ level, className }) {
  const meta = EVIDENCE_LEVELS[level] || EVIDENCE_LEVELS.none;
  return (
    <Badge title={meta.description} className={cx(EVIDENCE_STYLES[level] || EVIDENCE_STYLES.none, className)}>
      {EVIDENCE_SHORT[level] || meta.label}
    </Badge>
  );
}

const ACCESS_DOT = {
  none: "bg-status-none",
  unreliable: "bg-status-unreliable",
  reliable: "bg-status-reliable",
  unknown: "bg-status-unknown",
};

export function AccessBadge({ status, className }) {
  const meta = ACCESS_STATUSES[status] || ACCESS_STATUSES.unknown;
  return (
    <Badge className={cx("border-border bg-white text-foreground", className)}>
      <span className={cx("size-2 rounded-full", ACCESS_DOT[status] || ACCESS_DOT.unknown)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

const REPORT_STYLES = {
  submitted: "border-slate-300 bg-slate-50 text-slate-700",
  under_review: "border-sky-300 bg-sky-50 text-sky-900",
  verified: "border-positive/50 bg-positive-soft text-positive",
  rejected: "border-critical/40 bg-critical-soft text-critical",
  assessed: "border-positive bg-positive text-white",
};

export function ReportStatusBadge({ status, className }) {
  return (
    <Badge className={cx(REPORT_STYLES[status] || REPORT_STYLES.submitted, className)}>
      {REPORT_STATUSES[status]?.label || status}
    </Badge>
  );
}

const PRIORITY_STYLES = {
  high: "border-critical/40 bg-critical-soft text-critical",
  medium: "border-candidate/40 bg-candidate-soft text-candidate",
  low: "border-slate-300 bg-slate-50 text-slate-700",
};

export function PriorityBadge({ band, className }) {
  const label = { high: "High priority", medium: "Medium priority", low: "Low priority" }[band] || "Not ranked";
  return <Badge className={cx(PRIORITY_STYLES[band] || PRIORITY_STYLES.low, className)}>{label}</Badge>;
}
