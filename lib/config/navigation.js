// Sidebar navigation, breadcrumbs and role-based access (FRD §4).
// Shared by the server (lib/auth/dal.js enforces it) and the client (hides UI).
// Roles come from the signed-in account, never from a client-side selector.

const ALL = ["admin", "analyst", "viewer", "lga_officer", "field"];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "grid", roles: ALL },
  { href: "/map", label: "Intelligence Map", icon: "map", roles: ALL },
  { href: "/settlements", label: "Settlements", icon: "pin", roles: ALL },
  { href: "/reports", label: "Reports", icon: "inbox", roles: ["admin", "lga_officer", "analyst", "viewer"] },
  {
    href: "/field",
    label: "Field Operations",
    icon: "clipboard",
    roles: ["admin", "lga_officer", "field"],
    children: [
      { href: "/field", label: "Assignments" },
      { href: "/field/verification", label: "Verification" },
      { href: "/field/assessments", label: "Data collection" },
    ],
  },
  { href: "/energy", label: "Energy Assessments", icon: "bolt", roles: ["admin", "analyst", "lga_officer"] },
  { href: "/planning", label: "Intervention Planning", icon: "sun", roles: ["admin", "analyst", "viewer", "lga_officer"] },
  { href: "/planning-reports", label: "Planning Reports", icon: "file", roles: ["admin", "analyst", "viewer", "lga_officer"] },
  { href: "/data-sources", label: "Data Sources", icon: "database", roles: ALL },
];

/** Utility destinations reached from the profile menu, not the main nav. */
export const UTILITY_ITEMS = [{ href: "/settings", label: "Assumptions & Settings", icon: "sliders", roles: ALL }];

const ALL_ITEMS = [...NAV_ITEMS, ...UTILITY_ITEMS];

/** Find the nav item governing a pathname (longest prefix match). */
export function navItemFor(pathname) {
  return ALL_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(i.href + "/")).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}

/** Breadcrumb trail for a pathname: [{ href, label }]. */
export function breadcrumbsFor(pathname) {
  const item = navItemFor(pathname);
  if (!item) return [];
  const trail = [{ href: item.href, label: item.label }];
  const child = item.children?.find((c) => c.href === pathname && c.href !== item.href);
  if (child) trail.push(child);
  return trail;
}

/** Whether a role may open a page. Unlisted pages are denied (fail closed). */
export function canAccess(role, pathname) {
  const item = navItemFor(pathname);
  return Boolean(item?.roles.includes(role));
}

// Fine-grained permissions used by pages, actions and route handlers.
export const PERMISSIONS = {
  editGeography: ["admin"],
  editCommunity: ["admin", "lga_officer"],
  verifyReports: ["admin", "lga_officer"],
  captureAssessments: ["admin", "field"],
  editAssumptions: ["admin", "analyst"],
  overrideRecommendations: ["admin", "analyst"],
  resetDemoData: ["admin"],
  manageUsers: ["admin"],
  viewRestrictedData: ["admin", "lga_officer", "analyst", "viewer", "field"],
};

export function can(role, permission) {
  return (PERMISSIONS[permission] || []).includes(role);
}
