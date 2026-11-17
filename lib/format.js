// Formatting helpers. Fixed locale and time zone keep server and client output identical.

const LOCALE = "en-NG";
const TZ = "Africa/Lagos";

export function formatNumber(n, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString(LOCALE, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function formatNGN(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return "₦" + Math.round(n).toLocaleString(LOCALE);
}

/** Compact naira, e.g. ₦12.4m */
export function formatNGNCompact(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1e9) return `₦${(n / 1e9).toFixed(2)}bn`;
  if (Math.abs(n) >= 1e6) return `₦${(n / 1e6).toFixed(1)}m`;
  if (Math.abs(n) >= 1e3) return `₦${(n / 1e3).toFixed(0)}k`;
  return formatNGN(n);
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? value + "T12:00:00Z" : value);
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}
