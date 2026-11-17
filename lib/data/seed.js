// DEMONSTRATION SEED DATA
//
// Only the three LGA names (Ankpa, Dekina, Adavi) are real. EVERY ward,
// community, report, verification, assessment, facility, officer, population
// figure and coordinate below is an invented SAMPLE record (isSample: true)
// created to demonstrate the workflow. None of it is official Kogi State data.
//
// Records are spread across the FRD §5 workflow so every stage can be shown:
// no information → reported → under review → verified → assessed.
// All dates are fixed so server and client render identically.

import { PILOT_LGAS } from "@/lib/config/pilot";
import { DEFAULT_ASSUMPTIONS } from "@/lib/config/assumptions";
import { DEFAULT_APPLIANCES } from "@/lib/config/appliances";

export const SCHEMA_VERSION = 1;

const lgaById = Object.fromEntries(PILOT_LGAS.map((l) => [l.id, l]));
const at = (lgaId, dLat, dLng) => {
  const [lat, lng] = lgaById[lgaId].center;
  return { lat: Math.round((lat + dLat) * 10000) / 10000, lng: Math.round((lng + dLng) * 10000) / 10000 };
};

const lgas = PILOT_LGAS.map((l) => ({ ...l, isPilot: true, isSample: false }));

const wards = PILOT_LGAS.flatMap((l) =>
  [1, 2].map((n) => ({
    id: `${l.id}-w${n}`,
    lgaId: l.id,
    name: `${l.name} Sample Ward ${n}`,
    isSample: true,
  })),
);

function community(lgaId, n, ward, dLat, dLng, extra = {}) {
  const lga = lgaById[lgaId];
  return {
    id: `${lgaId}-c${n}`,
    lgaId,
    wardId: `${lgaId}-w${ward}`,
    name: `Sample Community ${lga.code}-${String(n).padStart(2, "0")}`,
    description: "Sample record for demonstration. Not an official community record.",
    ...at(lgaId, dLat, dLng),
    locationSource: "sample",
    populationEst: null,
    householdsEst: null,
    popSource: null,
    isSample: true,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    updatedBy: "Seed data",
    ...extra,
  };
}

const samplePop = (pop, hh) => ({ populationEst: pop, householdsEst: hh, popSource: "sample" });

const communities = [
  community("ankpa", 1, 1, 0.05, 0.04, samplePop(980, 140)),
  community("ankpa", 2, 1, 0.09, -0.03),
  community("ankpa", 3, 2, -0.06, 0.07),
  community("ankpa", 4, 2, -0.04, -0.06),
  community("ankpa", 5, 2, 0.12, 0.1),
  community("dekina", 1, 1, 0.06, 0.05, samplePop(1540, 220)),
  community("dekina", 2, 1, -0.03, 0.02, samplePop(700, 100)),
  community("dekina", 3, 2, 0.1, -0.06),
  community("dekina", 4, 2, -0.08, -0.04),
  community("dekina", 5, 2, 0.02, 0.11),
  community("adavi", 1, 1, 0.05, -0.05, samplePop(420, 60)),
  community("adavi", 2, 1, -0.05, 0.06),
  community("adavi", 3, 2, 0.09, 0.04),
  community("adavi", 4, 2, -0.08, -0.03),
  community("adavi", 5, 2, 0.01, 0.1),
];

const OFFICER = {
  ankpa: "Sample Officer – Ankpa LGA",
  dekina: "Sample Officer – Dekina LGA",
  adavi: "Sample Officer – Adavi LGA",
};
const COLLECTOR = "Sample Field Collector";

function report(seq, communityId, situation, status, extra = {}) {
  const c = communities.find((x) => x.id === communityId);
  const submittedAt = extra.submittedAt || `2026-10-${String(2 + (seq % 25)).padStart(2, "0")}T10:15:00.000Z`;
  const history = [{ status: "submitted", at: submittedAt, by: "Public submission", role: "public", note: "" }];
  const order = ["under_review", "verified", "assessed"];
  if (status === "rejected") {
    history.push({ status: "under_review", at: "2026-10-28T09:00:00.000Z", by: OFFICER[c.lgaId], role: "lga_officer", note: "" });
    history.push({ status: "rejected", at: "2026-10-30T14:00:00.000Z", by: OFFICER[c.lgaId], role: "lga_officer", note: "See verification record." });
  } else {
    const upto = order.indexOf(status);
    order.slice(0, upto + 1).forEach((s, i) =>
      history.push({
        status: s,
        at: `2026-10-${26 + i}T09:00:00.000Z`,
        by: s === "assessed" ? COLLECTOR : OFFICER[c.lgaId],
        role: s === "assessed" ? "field" : "lga_officer",
        note: "",
      }),
    );
  }
  return {
    ref: `KG-RPT-2026-${String(seq).padStart(6, "0")}`,
    lgaId: c.lgaId,
    wardId: c.wardId,
    communityId,
    communityNameFreeText: null,
    situation,
    durationBand: "1_3y",
    affectedHouseholdsEst: null,
    affectedFacilities: [],
    description: "Sample report text for demonstration.",
    lat: c.lat,
    lng: c.lng,
    photos: [],
    contact: null,
    status,
    duplicateOf: null,
    duplicateFlag: false,
    submittedAt,
    statusHistory: history,
    isSample: true,
    ...extra,
  };
}

const reports = [
  report(101, "ankpa-c1", "none", "assessed", { durationBand: "always", affectedHouseholdsEst: 150, affectedFacilities: ["school", "health"] }),
  report(102, "ankpa-c2", "partial", "verified", { affectedHouseholdsEst: 60 }),
  report(103, "ankpa-c3", "none", "submitted", { affectedFacilities: ["school"] }),
  report(104, "ankpa-c3", "none", "submitted", {
    duplicateOf: "KG-RPT-2026-000103",
    duplicateFlag: true,
    description: "Sample report – possible duplicate of an earlier submission for the same community.",
  }),
  report(105, "ankpa-c4", "irregular", "under_review", { durationBand: "6_12m" }),
  report(106, "dekina-c1", "irregular", "assessed", { affectedHouseholdsEst: 200, affectedFacilities: ["business", "school"] }),
  report(107, "dekina-c3", "inadequate", "verified", { affectedFacilities: ["health"] }),
  report(108, "dekina-c4", "none", "submitted", { durationBand: "3_5y" }),
  report(109, "dekina-c4", "none", "rejected", { description: "Sample report – location could not be matched on verification." }),
  report(110, "adavi-c1", "none", "assessed", { durationBand: "always", affectedHouseholdsEst: 55, affectedFacilities: ["school", "health"] }),
  report(111, "adavi-c2", "partial", "under_review"),
  report(112, "adavi-c3", "none", "verified", { affectedFacilities: ["school"] }),
  report(113, "adavi-c4", "irregular", "submitted", { durationBand: "lt_6m" }),
  {
    ...report(114, "adavi-c4", "none", "submitted"),
    communityId: null,
    wardId: "adavi-w2",
    communityNameFreeText: "Sample unregistered settlement (entered by reporter)",
    description: "Sample report naming a settlement that is not yet registered on the platform.",
  },
];

function verification(id, reportRef, decision, assigned, extra = {}) {
  const r = reports.find((x) => x.ref === reportRef);
  return {
    id,
    reportRef,
    communityId: r.communityId,
    decision,
    comments:
      decision === "confirmed"
        ? "Sample verification: officer visit confirmed the reported electricity situation."
        : "Sample verification: reported location could not be matched to a community in this ward.",
    evidencePhotos: [],
    officer: OFFICER[r.lgaId],
    date: decision === "confirmed" ? "2026-10-27" : "2026-10-30",
    assignedForAssessment: assigned,
    assignedTo: assigned ? COLLECTOR : null,
    isSample: true,
    ...extra,
  };
}

const verifications = [
  verification("v-1", "KG-RPT-2026-000101", "confirmed", true),
  verification("v-2", "KG-RPT-2026-000102", "confirmed", true),
  verification("v-3", "KG-RPT-2026-000106", "confirmed", true),
  verification("v-4", "KG-RPT-2026-000107", "confirmed", true),
  verification("v-5", "KG-RPT-2026-000109", "rejected", false),
  verification("v-6", "KG-RPT-2026-000110", "confirmed", true),
  verification("v-7", "KG-RPT-2026-000112", "confirmed", false),
];

const ap = (applianceId, qty, hoursPerDay, watts) => {
  const a = DEFAULT_APPLIANCES.find((x) => x.id === applianceId);
  return { applianceId, name: a.name, watts: watts ?? a.watts, qty, hoursPerDay };
};

function assessment(id, communityId, data) {
  const c = communities.find((x) => x.id === communityId);
  return {
    id,
    communityId,
    officer: COLLECTOR,
    date: "2026-11-03",
    syncState: "synced",
    status: "submitted",
    assumptionSetId: DEFAULT_ASSUMPTIONS.id,
    isSample: true,
    ...data,
    community: { lat: c.lat, lng: c.lng, photos: [], ...data.community },
  };
}

const typicalHousehold = [ap("led-bulb", 3, 5), ap("phone-charger", 2, 3), ap("radio", 1, 4), ap("dc-fan", 1, 6)];

const assessments = [
  assessment("a-1", "ankpa-c1", {
    community: {
      accessStatus: "none",
      gridConnected: false,
      supplyHoursAvg: 0,
      interruptionFreq: "not_applicable",
      altSources: ["kerosene", "generator_petrol", "solar_home"],
      hhWith: 6,
      hhWithout: 134,
      settlementPattern: "clustered",
      waterPumpingNeed: true,
    },
    households: { assessedCount: 40, withoutElecEst: 134, sources: ["kerosene", "battery"], appliances: typicalHousehold },
    schools: [
      { id: "s-1", name: "Sample Primary School A", type: "primary", classrooms: 6, offices: 1, sources: ["none"], opHours: "8am–2pm",
        appliances: [ap("fluorescent-tube", 12, 4), ap("laptop", 2, 4), ap("dc-fan", 4, 5)] },
    ],
    health: [
      { id: "h-1", name: "Sample Primary Health Centre A", type: "phc", vaccineStorage: true, criticalNeeds: "Night-time deliveries need lighting", sources: ["generator_petrol"],
        appliances: [ap("vaccine-fridge", 1, 24), ap("exam-light", 2, 6), ap("led-bulb", 8, 12), ap("microscope", 1, 3)] },
    ],
    businesses: [
      { id: "b-1", name: "Sample Grain Mill", category: "agro_processing", type: "Grain mill", opHours: "7am–5pm", sources: ["generator_diesel"],
        appliances: [ap("grain-mill", 1, 3)] },
      { id: "b-2", name: "Sample Phone Charging Kiosk", category: "retail", type: "Kiosk", opHours: "8am–8pm", sources: ["generator_petrol"],
        appliances: [ap("pos-terminal", 1, 10), ap("led-bulb", 2, 4)] },
    ],
    communityLoads: [ap("street-light", 10, 12), ap("water-pump", 1, 5)],
  }),
  assessment("a-2", "dekina-c1", {
    community: {
      accessStatus: "unreliable",
      gridConnected: true,
      supplyHoursAvg: 6,
      interruptionFreq: "daily",
      altSources: ["generator_petrol", "kerosene"],
      hhWith: 120,
      hhWithout: 100,
      settlementPattern: "clustered",
      waterPumpingNeed: false,
    },
    households: { assessedCount: 55, withoutElecEst: 100, sources: ["generator_petrol", "kerosene"],
      appliances: [...typicalHousehold, ap("tv-32", 1, 4)] },
    schools: [
      { id: "s-2", name: "Sample Junior Secondary School B", type: "secondary", classrooms: 10, offices: 3, sources: ["grid"], opHours: "8am–3pm",
        appliances: [ap("fluorescent-tube", 20, 4), ap("desktop", 10, 4), ap("projector", 1, 2), ap("printer", 1, 1)] },
    ],
    health: [],
    businesses: [
      { id: "b-3", name: "Sample Cassava Processing Cluster", category: "agro_processing", type: "Cassava processing", opHours: "7am–4pm", sources: ["generator_diesel"],
        appliances: [ap("cassava-grater", 2, 4), ap("grain-mill", 1, 3)] },
      { id: "b-4", name: "Sample Welding Workshop", category: "artisan", type: "Welding", opHours: "9am–5pm", sources: ["generator_petrol"],
        appliances: [ap("welding", 1, 2)] },
      { id: "b-5", name: "Sample Cold Store", category: "cold_storage", type: "Cold storage", opHours: "24h", sources: ["generator_diesel"],
        appliances: [ap("cold-room", 1, 16), ap("chest-freezer", 2, 20)] },
    ],
    communityLoads: [ap("street-light", 15, 12)],
  }),
  assessment("a-3", "dekina-c2", {
    community: {
      accessStatus: "reliable",
      gridConnected: true,
      supplyHoursAvg: 18,
      interruptionFreq: "weekly",
      altSources: ["generator_petrol"],
      hhWith: 92,
      hhWithout: 8,
      settlementPattern: "clustered",
      waterPumpingNeed: false,
    },
    households: { assessedCount: 30, withoutElecEst: 8, sources: ["grid"], appliances: typicalHousehold },
    schools: [],
    health: [],
    businesses: [],
    communityLoads: [],
  }),
  assessment("a-4", "adavi-c1", {
    community: {
      accessStatus: "none",
      gridConnected: false,
      supplyHoursAvg: 0,
      interruptionFreq: "not_applicable",
      altSources: ["kerosene", "battery"],
      hhWith: 0,
      hhWithout: 60,
      settlementPattern: "dispersed",
      waterPumpingNeed: true,
    },
    households: { assessedCount: 25, withoutElecEst: 60, sources: ["kerosene", "battery"],
      appliances: [ap("led-bulb", 3, 5), ap("phone-charger", 2, 3), ap("radio", 1, 4)] },
    schools: [
      { id: "s-3", name: "Sample Primary School C", type: "primary", classrooms: 4, offices: 1, sources: ["none"], opHours: "8am–1pm",
        appliances: [ap("fluorescent-tube", 8, 3), ap("laptop", 1, 3)] },
    ],
    health: [
      { id: "h-2", name: "Sample Health Post C", type: "health_post", vaccineStorage: true, criticalNeeds: "Vaccine cold chain currently relies on ice packs", sources: ["none"],
        appliances: [ap("vaccine-fridge", 1, 24), ap("exam-light", 1, 4), ap("led-bulb", 4, 10)] },
    ],
    businesses: [],
    communityLoads: [ap("water-pump", 1, 4)],
  }),
];

export function createSeedData() {
  return structuredClone({
    schemaVersion: SCHEMA_VERSION,
    seededAt: "2026-11-01T09:00:00.000Z",
    lgas,
    wards,
    communities,
    reports,
    verifications,
    assessments,
    appliances: DEFAULT_APPLIANCES.map((a) => ({ ...a, builtIn: true })),
    assumptionSets: [DEFAULT_ASSUMPTIONS],
    currentAssumptionSetId: DEFAULT_ASSUMPTIONS.id,
    recommendationOverrides: [],
    syncQueue: [],
    counters: { reportSeq: 114 },
    activity: [],
  });
}
