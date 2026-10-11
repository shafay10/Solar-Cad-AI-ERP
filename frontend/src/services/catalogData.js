/**
 * catalogData.js — Complete Pakistan-Market Solar Catalog
 * Inverters (line-by-line har size) + Wiring ke liye ready specs.
 * Sidebar dropdown isi se populate hoga.
 */

export const INVERTER_SPECS = [
  // ═══ HUAWEI — 1-Phase (On-Grid) ═══
  { id: "HW-3KTL-L1",  brand: "Huawei",   model: "SUN2000-3KTL-L1",   kw: 3,   phases: 1, type: "ON_GRID", maxDcVoltage: 600,  mpptMin: 90,  mpptMax: 560, mppts: 1 },
  { id: "HW-4KTL-L1",  brand: "Huawei",   model: "SUN2000-4KTL-L1",   kw: 4,   phases: 1, type: "ON_GRID", maxDcVoltage: 600,  mpptMin: 90,  mpptMax: 560, mppts: 1 },
  { id: "HW-5KTL-L1",  brand: "Huawei",   model: "SUN2000-5KTL-L1",   kw: 5,   phases: 1, type: "ON_GRID", maxDcVoltage: 600,  mpptMin: 90,  mpptMax: 560, mppts: 1 },
  { id: "HW-6KTL-L1",  brand: "Huawei",   model: "SUN2000-6KTL-L1",   kw: 6,   phases: 1, type: "ON_GRID", maxDcVoltage: 600,  mpptMin: 90,  mpptMax: 560, mppts: 1 },
  // ═══ HUAWEI — 3-Phase M2 Series ═══
  { id: "HW-10KTL-M2", brand: "Huawei",   model: "SUN2000-10KTL-M2 (2 MPPT)", kw: 10,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 950, mppts: 2 },
  { id: "HW-12KTL-M2", brand: "Huawei",   model: "SUN2000-12KTL-M2 (2 MPPT)", kw: 12,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 950, mppts: 2 },
  { id: "HW-15KTL-M2", brand: "Huawei",   model: "SUN2000-15KTL-M2 (2 MPPT)", kw: 15,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 950, mppts: 2 },
  { id: "HW-17KTL-M2", brand: "Huawei",   model: "SUN2000-17KTL-M2 (2 MPPT)", kw: 17,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 950, mppts: 2 },
  { id: "HW-20KTL-M2", brand: "Huawei",   model: "SUN2000-20KTL-M2 (2 MPPT)", kw: 20,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 950, mppts: 2 },
  { id: "HW-25KTL-M2", brand: "Huawei",   model: "SUN2000-25KTL-M2 (2 MPPT)", kw: 25,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 950, mppts: 2 },
  // ═══ HUAWEI — 3-Phase M3 / Commercial ═══
  { id: "HW-30KTL-M3", brand: "Huawei",   model: "SUN2000-30KTL-M3",  kw: 30,  phases: 3, type: "ON_GRID", maxDcVoltage: 1100, mpptMin: 200, mpptMax: 1000, mppts: 2 },
  { id: "HW-36KTL-M3", brand: "Huawei",   model: "SUN2000-36KTL-M3",  kw: 36,  phases: 3, type: "ON_GRID", maxDcVoltage: 1100, mpptMin: 200, mpptMax: 1000, mppts: 2 },
  { id: "HW-50KTL-M3", brand: "Huawei",   model: "SUN2000-50KTL-M3",  kw: 50,  phases: 3, type: "ON_GRID", maxDcVoltage: 1100, mpptMin: 200, mpptMax: 1000, mppts: 2 },
  { id: "HW-60KTL-M3", brand: "Huawei",   model: "SUN2000-60KTL-M3",  kw: 60,  phases: 3, type: "ON_GRID", maxDcVoltage: 1100, mpptMin: 200, mpptMax: 1000, mppts: 2 },
  { id: "HW-100KTL-M2", brand: "Huawei",  model: "SUN2000-100KTL-M2", kw: 100, phases: 3, type: "ON_GRID", maxDcVoltage: 1100, mpptMin: 200, mpptMax: 1000, mppts: 6 },

  // ═══ SUNGROW — Residential 1-Phase (RS Series) ═══
  { id: "SG-5RS",  brand: "Sungrow", model: "SG5.0RS",  kw: 5,  phases: 1, type: "ON_GRID", maxDcVoltage: 600, mpptMin: 50,  mpptMax: 550, mppts: 2 },
  { id: "SG-6RS",  brand: "Sungrow", model: "SG6.0RS",  kw: 6,  phases: 1, type: "ON_GRID", maxDcVoltage: 600, mpptMin: 50,  mpptMax: 550, mppts: 2 },
  { id: "SG-8RS",  brand: "Sungrow", model: "SG8.0RS",  kw: 8,  phases: 1, type: "ON_GRID", maxDcVoltage: 600, mpptMin: 50,  mpptMax: 550, mppts: 2 },
  { id: "SG-10RS", brand: "Sungrow", model: "SG10RS",   kw: 10, phases: 1, type: "ON_GRID", maxDcVoltage: 600, mpptMin: 50,  mpptMax: 550, mppts: 2 },
  // ═══ SUNGROW — 3-Phase CX Series ═══
  { id: "SG-10CX",  brand: "Sungrow", model: "SG10CX",   kw: 10,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 850, mppts: 2 },
  { id: "SG-33CX",  brand: "Sungrow", model: "SG33CX",   kw: 33,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 850, mppts: 3 },
  { id: "SG-50CX",  brand: "Sungrow", model: "SG50CX",   kw: 50,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 850, mppts: 4 },
  { id: "SG-110CX", brand: "Sungrow", model: "SG110CX",  kw: 110, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 850, mppts: 6 },

  // ═══ SOLIS — 1-Phase ═══
  { id: "SOL-1P5K",  brand: "Solis", model: "S6-GR1P5K",  kw: 5,  phases: 1, type: "ON_GRID", maxDcVoltage: 600, mpptMin: 50,  mpptMax: 550, mppts: 2 },
  { id: "SOL-1P6K",  brand: "Solis", model: "S6-GR1P6K",  kw: 6,  phases: 1, type: "ON_GRID", maxDcVoltage: 600, mpptMin: 50,  mpptMax: 550, mppts: 2 },
  { id: "SOL-1P8K",  brand: "Solis", model: "S6-GR1P8K",  kw: 8,  phases: 1, type: "ON_GRID", maxDcVoltage: 600, mpptMin: 50,  mpptMax: 550, mppts: 2 },
  { id: "SOL-1P10K", brand: "Solis", model: "S6-GR1P10K", kw: 10, phases: 1, type: "ON_GRID", maxDcVoltage: 600, mpptMin: 50,  mpptMax: 550, mppts: 2 },
  // ═══ SOLIS — 3-Phase ═══
  { id: "SOL-15K", brand: "Solis", model: "S6-GC15K",      kw: 15, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 160, mpptMax: 850, mppts: 2 },
  { id: "SOL-20K", brand: "Solis", model: "S6-GC20K",      kw: 20, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 160, mpptMax: 850, mppts: 2 },
  { id: "SOL-25K", brand: "Solis", model: "S6-GC25K",      kw: 25, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 160, mpptMax: 850, mppts: 2 },
  { id: "SOL-30K", brand: "Solis", model: "S6-GC30K",      kw: 30, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 160, mpptMax: 850, mppts: 2 },
  { id: "SOL-36K", brand: "Solis", model: "S6-GC36K",      kw: 36, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 160, mpptMax: 850, mppts: 2 },
  { id: "SOL-50K", brand: "Solis", model: "Solis-50K-5G",  kw: 50, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 850, mppts: 3 },

  // ═══ GROWATT ═══
  { id: "GW-MIN5",   brand: "Growatt", model: "MIN 5000TL-X",    kw: 5,   phases: 1, type: "ON_GRID", maxDcVoltage: 600,  mpptMin: 50,  mpptMax: 550, mppts: 2 },
  { id: "GW-MOD10",  brand: "Growatt", model: "MOD 10KTL3-X",    kw: 10,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 140, mpptMax: 850, mppts: 2 },
  { id: "GW-MOD15",  brand: "Growatt", model: "MOD 15KTL3-X",    kw: 15,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 140, mpptMax: 850, mppts: 2 },
  { id: "GW-MOD20",  brand: "Growatt", model: "MOD 20KTL3-X",    kw: 20,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 140, mpptMax: 850, mppts: 2 },
  { id: "GW-MAX50",  brand: "Growatt", model: "MAX 50KTL3-X",    kw: 50,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 850, mppts: 2 },
  { id: "GW-MAX100", brand: "Growatt", model: "MAX 100KTL3-X",   kw: 100, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 850, mppts: 2 },
  { id: "GW-MAX125", brand: "Growatt", model: "MAX 125KTL3-X LV", kw: 125, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 850, mppts: 2 },

  // ═══ FRONIUS — Symo 3-Phase ═══
  { id: "FRO-10",  brand: "Fronius", model: "Symo 10.0-3-M",        kw: 10,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 800, mppts: 2 },
  { id: "FRO-12",  brand: "Fronius", model: "Symo 12.5-3-M",        kw: 12.5, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 800, mppts: 2 },
  { id: "FRO-15",  brand: "Fronius", model: "Symo 15.0-3-M",        kw: 15,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 800, mppts: 2 },
  { id: "FRO-17",  brand: "Fronius", model: "Symo 17.5-3-M",        kw: 17.5, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 800, mppts: 2 },
  { id: "FRO-20",  brand: "Fronius", model: "Symo 20.0-3-M",        kw: 20,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 800, mppts: 2 },
  { id: "FRO-25",  brand: "Fronius", model: "Symo 25.0-3-M",        kw: 25,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 800, mppts: 3 },
  { id: "FRO-G24-15", brand: "Fronius", model: "Symo GEN24 Plus 15kW", kw: 15, phases: 3, type: "HYBRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 800, mppts: 2 },
  { id: "FRO-G24-20", brand: "Fronius", model: "Symo GEN24 Plus 20kW", kw: 20, phases: 3, type: "HYBRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 800, mppts: 2 },

  // ═══ SMA ═══
  { id: "SMA-10",  brand: "SMA", model: "Sunny Tripower 10000TL-20", kw: 10,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 150, mpptMax: 800, mppts: 2 },
  { id: "SMA-25",  brand: "SMA", model: "Sunny Tripower 25000TL",  kw: 25,  phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 150, mpptMax: 800, mppts: 3 },
  { id: "SMA-C110", brand: "SMA", model: "Sunny Tripower CORE2 110kW", kw: 110, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 260, mpptMax: 800, mppts: 3 },

  // ═══ GOODWE ═══
  { id: "GDW-5MS",  brand: "GoodWe", model: "GW5K-MS",   kw: 5,  phases: 1, type: "HYBRID", maxDcVoltage: 580, mpptMin: 90,  mpptMax: 520, mppts: 2 },
  { id: "GDW-10MS", brand: "GoodWe", model: "GW10K-MS",  kw: 10, phases: 1, type: "HYBRID", maxDcVoltage: 580, mpptMin: 90,  mpptMax: 520, mppts: 2 },
  { id: "GDW-25MT", brand: "GoodWe", model: "GW25K-MT",  kw: 25, phases: 3, type: "ON_GRID", maxDcVoltage: 1000, mpptMin: 200, mpptMax: 850, mppts: 3 },

  // ═══ DEYE — Hybrid (Battery-Ready) — Pakistan ka sab se popular ═══
  { id: "DEY-5K",  brand: "Deye", model: "SUN-5K-SG04LP1",  kw: 5,  phases: 1, type: "HYBRID", maxDcVoltage: 500, mpptMin: 125, mpptMax: 425, mppts: 2 },
  { id: "DEY-6K",  brand: "Deye", model: "SUN-6K-SG04LP1",  kw: 6,  phases: 1, type: "HYBRID", maxDcVoltage: 500, mpptMin: 125, mpptMax: 425, mppts: 2 },
  { id: "DEY-8K",  brand: "Deye", model: "SUN-8K-SG04LP1",  kw: 8,  phases: 1, type: "HYBRID", maxDcVoltage: 500, mpptMin: 125, mpptMax: 425, mppts: 2 },
  { id: "DEY-10K", brand: "Deye", model: "SUN-10K-SG04LP1", kw: 10, phases: 1, type: "HYBRID", maxDcVoltage: 500, mpptMin: 125, mpptMax: 425, mppts: 2 },
  { id: "DEY-12K", brand: "Deye", model: "SUN-12K-SG04LP1", kw: 12, phases: 1, type: "HYBRID", maxDcVoltage: 500, mpptMin: 125, mpptMax: 425, mppts: 2 },
  { id: "DEY-12K3P", brand: "Deye", model: "SUN-12K-SG04LP3", kw: 12, phases: 3, type: "HYBRID", maxDcVoltage: 800, mpptMin: 160, mpptMax: 650, mppts: 2 },
  { id: "DEY-16K3P", brand: "Deye", model: "SUN-16K-SG04LP3", kw: 16, phases: 3, type: "HYBRID", maxDcVoltage: 800, mpptMin: 160, mpptMax: 650, mppts: 2 },
  { id: "DEY-20K3P", brand: "Deye", model: "SUN-20K-SG04LP3", kw: 20, phases: 3, type: "HYBRID", maxDcVoltage: 800, mpptMin: 160, mpptMax: 650, mppts: 2 },
  { id: "DEY-25K3P", brand: "Deye", model: "SUN-25K-SG01HP3", kw: 25, phases: 3, type: "HYBRID", maxDcVoltage: 800, mpptMin: 160, mpptMax: 650, mppts: 2 },
  { id: "DEY-30K3P", brand: "Deye", model: "SUN-30K-SG01HP3", kw: 30, phases: 3, type: "HYBRID", maxDcVoltage: 800, mpptMin: 160, mpptMax: 650, mppts: 2 },
  { id: "DEY-50K3P", brand: "Deye", model: "SUN-50K-SG01HP3", kw: 50, phases: 3, type: "HYBRID", maxDcVoltage: 800, mpptMin: 160, mpptMax: 650, mppts: 2 },

  // ═══ INVEREX (Local Market — Rebranded Hybrid) ═══
  { id: "INV-N6",  brand: "Inverex", model: "Nitrox 6KW Hybrid",  kw: 6,  phases: 1, type: "HYBRID", maxDcVoltage: 500, mpptMin: 120, mpptMax: 430, mppts: 2 },
  { id: "INV-N8",  brand: "Inverex", model: "Nitrox 8KW Hybrid",  kw: 8,  phases: 1, type: "HYBRID", maxDcVoltage: 500, mpptMin: 120, mpptMax: 430, mppts: 2 },
  { id: "INV-N12", brand: "Inverex", model: "Nitrox 12KW Hybrid", kw: 12, phases: 1, type: "HYBRID", maxDcVoltage: 500, mpptMin: 120, mpptMax: 430, mppts: 2 }
];

/** Dropdown ke liye ready options: [{ value, label }] — line-by-line sab models */
export function buildInverterOptions() {
  return INVERTER_SPECS.map(i => ({
    value: i.id,
    label: `${i.brand} ${i.model} — ${i.kw} kW${i.phases === 1 ? " (1-Ph)" : " (3-Ph)"}${i.type === "HYBRID" ? " ⚡Hybrid" : ""}`,
    ...i
  }));
}

/** ID ya model se spec nikaalo */
export function getInverterSpec(idOrModel) {
  if (!idOrModel) return INVERTER_SPECS[0];
  const query = String(idOrModel).trim().toLowerCase();
  return (
    INVERTER_SPECS.find(i => i.id.toLowerCase() === query) ||
    INVERTER_SPECS.find(i => i.model.toLowerCase() === query) ||
    INVERTER_SPECS.find(i => i.model.toLowerCase().includes(query)) ||
    INVERTER_SPECS.find(i => query.includes(i.model.toLowerCase())) ||
    null
  );
}

export default {
  INVERTER_SPECS,
  buildInverterOptions,
  getInverterSpec
};
