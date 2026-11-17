// Default calculation assumptions (FRD Cat. 5, 6, 7).
//
// STATUS: DRAFT – pending approval by the project team (FRD §9, items 7 and 8).
// All monetary values are SAMPLE rates for demonstration only. They are not
// sourced from suppliers and must be replaced with approved cost data.
//
// Every assessment, recommendation and priority score stores a snapshot of the
// assumption set (id + version) used to produce it, so results stay explainable
// after assumptions change.

export const DEFAULT_ASSUMPTIONS = {
  id: "as-v1",
  version: 1,
  status: "draft",
  label: "Draft v1 – sample values pending approval",
  createdAt: "2026-11-01T09:00:00.000Z",
  createdBy: "Prototype default",

  // Cat. 5 – Energy needs assessment
  demand: {
    // Energy (Wh/day) = Power (W) × Quantity × Operating hours (FRD Cat. 5)
    // Peak load (kW) = Σ(W × Qty) ÷ 1000 × simultaneity factor for that facility type.
    simultaneity: {
      household: 0.4,
      school: 0.6,
      health: 0.7,
      business: 0.6,
      community: 0.5, // shared/public loads such as street lights
    },
    // Community peak = Σ facility peaks × coincidence factor (not all groups peak together)
    communityCoincidence: 0.8,
    // Allowance for distribution and conversion losses applied to energy totals
    systemLossPct: 10,
  },

  // Cat. 6 – Recommendation rules (rule-based; each rule produces a stated reason)
  recommendation: {
    reliableGridMinHours: 16, // grid supply ≥ this many hours/day is treated as relatively reliable
    shsMaxHouseholdKWhDay: 0.6, // households below this daily need suit Solar Home Systems
    minigridMinHouseholds: 80, // clustered settlements with at least this many unserved households
    productiveUseMinKWhDay: 5, // business demand above this triggers productive-use solar
  },

  // Cat. 6 – Sizing parameters
  sizing: {
    peakSunHours: 5.0, // indicative solar resource
    pvDerateFactor: 0.75, // temperature, soiling, wiring and inverter losses
    batteryAutonomyDays: 1,
    batteryDepthOfDischarge: 0.8,
    inverterOversizeFactor: 1.25,
    shsPackageWp: 200, // standard SHS package size
  },

  // Cat. 6 – Cost rates in Nigerian Naira (SAMPLE – replace with approved source)
  costRates: {
    panelPerWp: 380,
    batteryPerKWh: 420000,
    inverterPerKW: 260000,
    chargeControllerPerKW: 90000,
    mountingPerKWp: 70000,
    distributionPerConnection: 150000,
    shsPackageCost: 380000,
    waterPumpingPerKWp: 1100000,
    protectionPct: 5,
    installationPct: 12,
    transportOtherPct: 8,
  },

  // Cat. 7 – Prioritisation (weights sum to 100)
  priority: {
    weights: {
      affectedHouseholds: 25,
      socialFacilities: 20, // schools + health facilities affected
      economicActivity: 15,
      demand: 10,
      feasibility: 15,
      costEfficiency: 15, // lower cost per household served scores higher
    },
    thresholds: { high: 65, medium: 40 }, // score ≥ high → High; ≥ medium → Medium; else Low
  },

  // Cat. 3 – Duplicate report flagging
  duplicates: {
    windowDays: 30,
    radiusMeters: 500,
  },
};

// Human-readable descriptions shown on the Settings page.
export const ASSUMPTION_FIELDS = {
  demand: {
    title: "Energy demand (Category 5)",
    fields: {
      "simultaneity.household": { label: "Simultaneity factor – households", step: 0.05, min: 0, max: 1 },
      "simultaneity.school": { label: "Simultaneity factor – schools", step: 0.05, min: 0, max: 1 },
      "simultaneity.health": { label: "Simultaneity factor – health facilities", step: 0.05, min: 0, max: 1 },
      "simultaneity.business": { label: "Simultaneity factor – businesses", step: 0.05, min: 0, max: 1 },
      "simultaneity.community": { label: "Simultaneity factor – community/public loads", step: 0.05, min: 0, max: 1 },
      communityCoincidence: { label: "Community coincidence factor", step: 0.05, min: 0, max: 1 },
      systemLossPct: { label: "System losses allowance", unit: "%", step: 1, min: 0, max: 50 },
    },
  },
  recommendation: {
    title: "Recommendation rules (Category 6)",
    fields: {
      reliableGridMinHours: { label: "Grid treated as reliable at ≥", unit: "hours/day", step: 1, min: 0, max: 24 },
      shsMaxHouseholdKWhDay: { label: "Solar Home System if household need ≤", unit: "kWh/day", step: 0.1, min: 0 },
      minigridMinHouseholds: { label: "Mini-grid if clustered unserved households ≥", unit: "households", step: 5, min: 0 },
      productiveUseMinKWhDay: { label: "Productive-use solar if business demand ≥", unit: "kWh/day", step: 1, min: 0 },
    },
  },
  sizing: {
    title: "System sizing (Category 6)",
    fields: {
      peakSunHours: { label: "Peak sun hours", unit: "h/day", step: 0.1, min: 1, max: 8 },
      pvDerateFactor: { label: "PV derate factor", step: 0.05, min: 0.3, max: 1 },
      batteryAutonomyDays: { label: "Battery autonomy", unit: "days", step: 0.5, min: 0 },
      batteryDepthOfDischarge: { label: "Battery depth of discharge", step: 0.05, min: 0.1, max: 1 },
      inverterOversizeFactor: { label: "Inverter oversize factor", step: 0.05, min: 1 },
      shsPackageWp: { label: "Standard SHS package size", unit: "Wp", step: 10, min: 10 },
    },
  },
  costRates: {
    title: "Cost rates – SAMPLE values (Category 6)",
    fields: {
      panelPerWp: { label: "Solar panels", unit: "₦ per Wp", step: 10, min: 0 },
      batteryPerKWh: { label: "Batteries", unit: "₦ per kWh", step: 5000, min: 0 },
      inverterPerKW: { label: "Inverters", unit: "₦ per kW", step: 5000, min: 0 },
      chargeControllerPerKW: { label: "Charge controllers", unit: "₦ per kW", step: 5000, min: 0 },
      mountingPerKWp: { label: "Mounting structures", unit: "₦ per kWp", step: 5000, min: 0 },
      distributionPerConnection: { label: "Distribution infrastructure", unit: "₦ per connection", step: 5000, min: 0 },
      shsPackageCost: { label: "Solar Home System package", unit: "₦ per unit", step: 5000, min: 0 },
      waterPumpingPerKWp: { label: "Solar water pumping", unit: "₦ per kWp", step: 10000, min: 0 },
      protectionPct: { label: "Protection equipment", unit: "% of equipment", step: 1, min: 0 },
      installationPct: { label: "Installation", unit: "% of equipment", step: 1, min: 0 },
      transportOtherPct: { label: "Transportation & other", unit: "% of equipment", step: 1, min: 0 },
    },
  },
  priority: {
    title: "Prioritisation criteria (Category 7)",
    fields: {
      "weights.affectedHouseholds": { label: "Weight – affected households", unit: "pts", step: 1, min: 0 },
      "weights.socialFacilities": { label: "Weight – affected schools & health facilities", unit: "pts", step: 1, min: 0 },
      "weights.economicActivity": { label: "Weight – economic activity / livelihoods", unit: "pts", step: 1, min: 0 },
      "weights.demand": { label: "Weight – electricity demand", unit: "pts", step: 1, min: 0 },
      "weights.feasibility": { label: "Weight – technical feasibility", unit: "pts", step: 1, min: 0 },
      "weights.costEfficiency": { label: "Weight – cost efficiency", unit: "pts", step: 1, min: 0 },
      "thresholds.high": { label: "High priority if score ≥", unit: "/100", step: 1, min: 0, max: 100 },
      "thresholds.medium": { label: "Medium priority if score ≥", unit: "/100", step: 1, min: 0, max: 100 },
    },
  },
  duplicates: {
    title: "Duplicate report flagging (Category 3)",
    fields: {
      windowDays: { label: "Flag reports for the same community within", unit: "days", step: 1, min: 0 },
      radiusMeters: { label: "Flag reports located within", unit: "metres", step: 50, min: 0 },
    },
  },
};
