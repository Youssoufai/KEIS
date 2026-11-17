// Pilot geography (FRD §7 – initial implementation covers three selected LGAs).
//
// The three LGA names are confirmed by the project team.
// Map centres are APPROXIMATE and used only to position the map view; they are
// not survey data. Additional LGAs can be added here in future phases (FRD §7).

export const PILOT_LGAS = [
  { id: "ankpa", name: "Ankpa", code: "ANK", center: [7.37, 7.62] },
  { id: "dekina", name: "Dekina", code: "DEK", center: [7.69, 7.03] },
  { id: "adavi", name: "Adavi", code: "ADV", center: [7.62, 6.26] },
];

export const KOGI_MAP_CENTER = [7.55, 6.95];
export const KOGI_MAP_ZOOM = 9;

export const REPORT_REF_PREFIX = "KG-RPT-2026-";
