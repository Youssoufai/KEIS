// Minimal inline icon set (stroke icons, 24×24 viewBox) – avoids an icon dependency.
const PATHS = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  pin: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  layers: "m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  inbox: "M4 13h4l2 3h4l2-3h4M5 5h14l1 8v6H4v-6l1-8z",
  clipboard: "M9 4h6v3H9zM7 5H5v16h14V5h-2M8 11h8M8 15h6",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8z",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  rank: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  file: "M14 3H6v18h12V7l-4-4zM14 3v4h4M9 13h6M9 17h6",
  sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  reset: "M4 4v6h6M20 12a8 8 0 1 1-2.3-5.7L20 9",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12l5 5 9-10",
  alert: "M12 3 2 21h20L12 3zM12 10v5M12 18h0",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  database: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  download: "M12 4v11M7 10l5 5 5-5M4 20h16",
  printer: "M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h0",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h0",
  collapse: "M4 4v16M20 12H9M13 8l-4 4 4 4",
  expand: "M4 4v16M9 12h11M16 8l4 4-4 4",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  home: "M3 11l9-7 9 7M5 10v10h14V10",
  filter: "M4 5h16l-6 8v6l-4-2v-4L4 5z",
};

export function Icon({ name, className = "size-4", title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name] || PATHS.file} />
    </svg>
  );
}
