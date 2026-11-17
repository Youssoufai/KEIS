import Link from "next/link";
import { cx } from "@/lib/format";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-strong border-transparent",
  secondary: "bg-white text-foreground border-border hover:bg-slate-50",
  danger: "bg-white text-red-700 border-red-300 hover:bg-red-50",
  ghost: "bg-transparent text-foreground border-transparent hover:bg-slate-100",
};

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", className, type = "button", ...props }) {
  return <button type={type} className={cx(base, VARIANTS[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }) {
  return <Link className={cx(base, VARIANTS[variant], className)} {...props} />;
}

const inputBase =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50";

export function Field({ label, hint, htmlFor, required, children, className }) {
  return (
    <div className={cx("space-y-1", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }) {
  return <input className={cx(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx(inputBase, "min-h-24", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(inputBase, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}
