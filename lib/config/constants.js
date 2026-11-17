// Shared enumerations and labels. Wording follows docs/FRD.md.

export const APP_NAME = "Kogi State Rural Electrification Needs Assessment and Planning Platform";
export const APP_SHORT_NAME = "Kogi REN Platform";

// FRD §4 – User roles. These are assigned to authenticated accounts
// (data/auth/users.json); users never choose their own role.
export const ROLES = {
  admin: { label: "System Administrator", short: "Admin" },
  analyst: { label: "Energy Analyst", short: "Energy Analyst" },
  viewer: { label: "Government Stakeholder", short: "Stakeholder" },
  lga_officer: { label: "LGA Officer", short: "LGA Officer" },
  field: { label: "Field Data Collector", short: "Field Collector" },
};
export const ROLE_IDS = Object.keys(ROLES);

// Who a report/history entry came from. Not login roles: "public" marks a
// report submitted by a resident through a (future, separate) public channel.
export const SUBMITTER_LABELS = { public: "Public submission", ...Object.fromEntries(ROLE_IDS.map((r) => [r, ROLES[r].label])) };

// FRD Cat. 3 – Report status lifecycle
export const REPORT_STATUSES = {
  submitted: { label: "Submitted" },
  under_review: { label: "Under Review" },
  verified: { label: "Verified" },
  rejected: { label: "Rejected" },
  assessed: { label: "Assessed" },
};

// FRD Cat. 3 – Public reporting options
export const REPORT_SITUATIONS = {
  none: "No electricity",
  irregular: "Irregular electricity supply",
  inadequate: "Inadequate electricity supply",
  partial: "Electricity available only in certain parts of the community",
};

export const DURATION_BANDS = {
  lt_6m: "Less than 6 months",
  "6_12m": "6–12 months",
  "1_3y": "1–3 years",
  "3_5y": "3–5 years",
  gt_5y: "More than 5 years",
  always: "Never had electricity",
  unknown: "Not sure",
};

export const FACILITY_TYPES = {
  school: "School",
  health: "Hospital / health facility",
  business: "Business",
  water: "Water supply point",
  other_public: "Other public facility",
};

// FRD Cat. 2 – electricity-access status (map indicators)
export const ACCESS_STATUSES = {
  none: { label: "No electricity access", color: "red" },
  unreliable: { label: "Unreliable / inadequate electricity", color: "orange" },
  reliable: { label: "Relatively reliable electricity", color: "green" },
  unknown: { label: "Status not yet established", color: "gray" },
};

// Evidence level for a community's status. Kept distinct throughout the app:
// a public report is a lead, not confirmed data (FRD §6).
export const EVIDENCE_LEVELS = {
  none: { label: "No information", rank: 0, description: "No report, verification or assessment yet." },
  reported: { label: "Reported", rank: 1, description: "Based on public reports only. Not verified." },
  under_review: { label: "Under review", rank: 2, description: "A report is being reviewed by an officer. Not verified." },
  verified: { label: "Verified", rank: 3, description: "An officer has confirmed a report. Detailed assessment pending." },
  assessed: { label: "Assessed", rank: 4, description: "Field assessment completed. Used for energy analysis." },
};

export const ENERGY_SOURCES = {
  grid: "National grid",
  generator_petrol: "Petrol generator",
  generator_diesel: "Diesel generator",
  solar_home: "Solar home system / lantern",
  solar_institutional: "Institutional solar",
  battery: "Rechargeable battery / torch",
  kerosene: "Kerosene lamp",
  none: "None",
};

export const SOLUTION_TYPES = {
  shs: "Solar Home Systems",
  minigrid: "Solar Mini-grid",
  institutional: "Institutional Solar Systems",
  water_pumping: "Solar Water Pumping",
  productive_use: "Productive-Use Solar Systems",
};

export const PRIORITY_BANDS = {
  high: { label: "High priority" },
  medium: { label: "Medium priority" },
  low: { label: "Low priority" },
};
