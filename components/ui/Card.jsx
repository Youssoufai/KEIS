import { cx } from "@/lib/format";

export function Card({ children, className }) {
  return <section className={cx("rounded-md border border-border bg-surface", className)}>{children}</section>;
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ children, className }) {
  return <div className={cx("px-4 py-3", className)}>{children}</div>;
}

/** Page title block. The section trail is shown in the top header breadcrumbs. */
export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink">{eyebrow}</p>}
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Metric tile. `evidence` renders the evidence chip (modelled / reported / sample…). */
export function StatTile({ label, value, hint, badge, className }) {
  return (
    <div className={cx("rounded-md border border-border bg-surface px-4 py-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        {badge}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const NOTICE_STYLES = {
  info: "border-brand/20 bg-brand-soft text-brand-strong",
  warning: "border-candidate/30 bg-candidate-soft text-[#5c3704]",
  success: "border-positive/30 bg-positive-soft text-[#123f29]",
  danger: "border-critical/30 bg-critical-soft text-[#6b150e]",
};

export function Notice({ tone = "info", title, children, className }) {
  return (
    <div className={cx("rounded-md border px-4 py-2.5 text-sm", NOTICE_STYLES[tone], className)} role="note">
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
    </div>
  );
}

export function EmptyState({ title, children, icon, className }) {
  return (
    <div className={cx("rounded-md border border-dashed border-border-strong bg-surface-2 px-6 py-8 text-center", className)}>
      {icon}
      <p className="font-medium text-foreground">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

/** Marks a workflow whose data entry is not implemented yet. */
export function AwaitingImplementation({ title = "Awaiting implementation", children, className }) {
  return (
    <div className={cx("rounded-md border border-dashed border-border-strong bg-surface-2 px-4 py-3 text-sm", className)}>
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <span className="rounded-sm border border-border-strong bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Not yet built
        </span>
        {title}
      </p>
      {children && <div className="mt-1 text-muted">{children}</div>}
    </div>
  );
}
