// Common electrical appliances and equipment (FRD Cat. 5).
// Rated powers are TYPICAL indicative values; field officers should record the
// actual nameplate rating where available. Users may add custom equipment.

export const APPLIANCE_CATEGORIES = {
  household: "Household",
  school: "School / office",
  health: "Health / medical",
  business: "Business / productive use",
  community: "Community / public",
};

export const DEFAULT_APPLIANCES = [
  // Household
  { id: "led-bulb", name: "LED bulb", watts: 9, category: "household" },
  { id: "phone-charger", name: "Phone charger", watts: 5, category: "household" },
  { id: "radio", name: "Radio", watts: 10, category: "household" },
  { id: "tv-32", name: "Television (32\" LED)", watts: 50, category: "household" },
  { id: "dc-fan", name: "Fan (standing/ceiling)", watts: 60, category: "household" },
  { id: "fridge-small", name: "Refrigerator (small)", watts: 120, category: "household" },
  { id: "pressing-iron", name: "Pressing iron", watts: 1000, category: "household" },

  // School / office
  { id: "laptop", name: "Laptop computer", watts: 65, category: "school" },
  { id: "desktop", name: "Desktop computer", watts: 150, category: "school" },
  { id: "projector", name: "Projector", watts: 250, category: "school" },
  { id: "printer", name: "Printer", watts: 300, category: "school" },
  { id: "fluorescent-tube", name: "Classroom light (LED tube)", watts: 18, category: "school" },

  // Health / medical
  { id: "vaccine-fridge", name: "Vaccine refrigerator (solar direct-drive)", watts: 80, category: "health" },
  { id: "med-fridge", name: "Medical refrigerator", watts: 150, category: "health" },
  { id: "oxygen-conc", name: "Oxygen concentrator", watts: 350, category: "health" },
  { id: "sterilizer", name: "Autoclave / steriliser", watts: 1500, category: "health" },
  { id: "exam-light", name: "Examination light", watts: 20, category: "health" },
  { id: "microscope", name: "Microscope", watts: 30, category: "health" },
  { id: "ultrasound", name: "Ultrasound machine (portable)", watts: 150, category: "health" },

  // Business / productive use
  { id: "grain-mill", name: "Grain mill (motor)", watts: 5500, category: "business" },
  { id: "cassava-grater", name: "Cassava grater", watts: 3700, category: "business" },
  { id: "welding", name: "Welding machine", watts: 4000, category: "business" },
  { id: "chest-freezer", name: "Chest freezer", watts: 200, category: "business" },
  { id: "cold-room", name: "Cold room (small)", watts: 1500, category: "business" },
  { id: "hair-clipper", name: "Hair clipper", watts: 15, category: "business" },
  { id: "sewing-machine", name: "Sewing machine (electric)", watts: 100, category: "business" },
  { id: "pos-terminal", name: "POS / phone charging kiosk", watts: 40, category: "business" },

  // Community / public
  { id: "street-light", name: "Street light (LED)", watts: 40, category: "community" },
  { id: "water-pump", name: "Borehole water pump", watts: 1500, category: "community" },
];
