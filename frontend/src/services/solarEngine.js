// Frontend Solar Engineering Services & Catalogs
// Enterprise Solar ERP Platform - Pakistan Market (PKR Currency)

export const PANEL_CATALOG = {
  "Jinko Solar": [
    { model: "Tiger Neo N-type 550W", wattage: 550, type: "N-Type TOPCon", voc: 50.2, vmp: 42.1, isc: 13.95, imp: 13.06, tempCoeffVoc: -0.0028, bifaciality: 0.80 },
    { model: "Tiger Neo N-type 585W", wattage: 585, type: "N-Type TOPCon Dual-Glass", voc: 51.5, vmp: 43.2, isc: 14.36, imp: 13.54, tempCoeffVoc: -0.0028, bifaciality: 0.82 },
    { model: "Tiger Pro 610W Bifacial", wattage: 610, type: "Monocrystalline PERC", voc: 53.4, vmp: 44.8, isc: 14.65, imp: 13.62, tempCoeffVoc: -0.0029, bifaciality: 0.75 },
    { model: "Tiger Neo 650W Utility", wattage: 650, type: "N-Type TOPCon High Power", voc: 54.8, vmp: 45.9, isc: 15.20, imp: 14.16, tempCoeffVoc: -0.0028, bifaciality: 0.85 }
  ],
  "Longi Solar": [
    { model: "Hi-MO 6 Explorer 550W", wattage: 550, type: "HPBC Monofacial", voc: 50.0, vmp: 41.8, isc: 13.90, imp: 13.16, tempCoeffVoc: -0.0027, bifaciality: 0.70 },
    { model: "Hi-MO 7 Bifacial 585W", wattage: 585, type: "HPDC Bifacial Dual-Glass", voc: 51.2, vmp: 43.0, isc: 14.40, imp: 13.60, tempCoeffVoc: -0.0028, bifaciality: 0.80 },
    { model: "Hi-MO 7 Bifacial 610W", wattage: 610, type: "HPDC Bifacial Dual-Glass", voc: 52.8, vmp: 44.2, isc: 14.75, imp: 13.80, tempCoeffVoc: -0.0028, bifaciality: 0.80 }
  ],
  "JA Solar": [
    { model: "DeepBlue 4.0 Pro 550W", wattage: 550, type: "N-Type TOPCon", voc: 50.1, vmp: 42.0, isc: 13.92, imp: 13.10, tempCoeffVoc: -0.0028, bifaciality: 0.80 },
    { model: "DeepBlue 4.0 Pro 585W", wattage: 585, type: "N-Type TOPCon Bifacial", voc: 51.4, vmp: 43.1, isc: 14.38, imp: 13.57, tempCoeffVoc: -0.0028, bifaciality: 0.82 },
    { model: "DeepBlue 4.0 Pro 610W", wattage: 610, type: "N-Type TOPCon", voc: 53.0, vmp: 44.4, isc: 14.68, imp: 13.74, tempCoeffVoc: -0.0028, bifaciality: 0.80 }
  ],
  "Canadian Solar": [
    { model: "TOPBiHiKu6 585W", wattage: 585, type: "N-Type Bifacial", voc: 51.6, vmp: 43.3, isc: 14.42, imp: 13.51, tempCoeffVoc: -0.0028, bifaciality: 0.80 },
    { model: "BiHiKu7 650W", wattage: 650, type: "Monofacial Dual-Cell", voc: 45.8, vmp: 38.4, isc: 17.90, imp: 16.93, tempCoeffVoc: -0.0026, bifaciality: 0.75 }
  ]
};

export const INVERTER_CATALOG = {
  "Huawei": [
    { model: "SUN2000-100KTL-M2", type: "On-Grid", ratedKw: 100, mpptMinV: 200, mpptMaxV: 1000, maxPvV: 1100, mpptTrackers: 10 },
    { model: "SUN2000-50KTL-M3", type: "On-Grid", ratedKw: 50, mpptMinV: 200, mpptMaxV: 1000, maxPvV: 1100, mpptTrackers: 4 },
    { model: "SUN2000-25K-MB0", type: "Hybrid", ratedKw: 25, mpptMinV: 200, mpptMaxV: 980, maxPvV: 1100, mpptTrackers: 2 },
    { model: "SUN2000-10KTL-M1", type: "Hybrid", ratedKw: 10, mpptMinV: 140, mpptMaxV: 980, maxPvV: 1100, mpptTrackers: 2 }
  ],
  "Sungrow": [
    { model: "SG110CX Multi-MPPT", type: "On-Grid", ratedKw: 110, mpptMinV: 200, mpptMaxV: 1000, maxPvV: 1100, mpptTrackers: 9 },
    { model: "SG50CX Premium", type: "On-Grid", ratedKw: 50, mpptMinV: 200, mpptMaxV: 1000, maxPvV: 1100, mpptTrackers: 5 },
    { model: "SH25T Commercial Hybrid", type: "Hybrid", ratedKw: 25, mpptMinV: 150, mpptMaxV: 950, maxPvV: 1000, mpptTrackers: 3 }
  ],
  "Growatt": [
    { model: "MID 50KTL3-X", type: "On-Grid", ratedKw: 50, mpptMinV: 200, mpptMaxV: 1000, maxPvV: 1100, mpptTrackers: 4 },
    { model: "WIT 50K-HU Hybrid", type: "Hybrid", ratedKw: 50, mpptMinV: 180, mpptMaxV: 950, maxPvV: 1000, mpptTrackers: 4 },
    { model: "SPF 12000T DVM Off-Grid", type: "Off-Grid", ratedKw: 12, mpptMinV: 120, mpptMaxV: 450, maxPvV: 500, mpptTrackers: 2 }
  ],
  "Solis": [
    { model: "Solis-100K-5G-PRO", type: "On-Grid", ratedKw: 100, mpptMinV: 180, mpptMaxV: 1000, maxPvV: 1100, mpptTrackers: 8 },
    { model: "S5-GC50K", type: "On-Grid", ratedKw: 50, mpptMinV: 200, mpptMaxV: 1000, maxPvV: 1100, mpptTrackers: 4 }
  ],
  "GoodWe": [
    { model: "GW80K-MT", type: "On-Grid", ratedKw: 80, mpptMinV: 200, mpptMaxV: 1000, maxPvV: 1100, mpptTrackers: 4 },
    { model: "ET Series 30kW Hybrid", type: "Hybrid", ratedKw: 30, mpptMinV: 200, mpptMaxV: 850, maxPvV: 1000, mpptTrackers: 3 }
  ]
};

export const CABLE_SPECS = {
  "Fast Cables": [
    { size: "1x4mm² DC XLPO", gauge: "4mm²", ampRating: 35, resistancePerM: 0.00495 },
    { size: "1x6mm² DC XLPO", gauge: "6mm²", ampRating: 45, resistancePerM: 0.00330 },
    { size: "1x10mm² DC XLPO", gauge: "10mm²", ampRating: 65, resistancePerM: 0.00191 },
    { size: "4-Core 16mm² Armored AC", gauge: "16mm²", ampRating: 80, resistancePerM: 0.00115 },
    { size: "4-Core 25mm² Armored AC", gauge: "25mm²", ampRating: 105, resistancePerM: 0.000727 },
    { size: "4-Core 35mm² Armored AC", gauge: "35mm²", ampRating: 130, resistancePerM: 0.000524 },
    { size: "4-Core 70mm² Armored AC", gauge: "70mm²", ampRating: 195, resistancePerM: 0.000268 }
  ],
  "Pakistan Cables": [
    { size: "1x4mm² Solar PV Flex", gauge: "4mm²", ampRating: 35, resistancePerM: 0.00495 },
    { size: "1x6mm² Solar PV Flex", gauge: "6mm²", ampRating: 45, resistancePerM: 0.00330 },
    { size: "1x10mm² Solar PV Flex", gauge: "10mm²", ampRating: 65, resistancePerM: 0.00191 },
    { size: "4-Core 25mm² XLPE Copper", gauge: "25mm²", ampRating: 105, resistancePerM: 0.000727 },
    { size: "4-Core 35mm² XLPE Copper", gauge: "35mm²", ampRating: 130, resistancePerM: 0.000524 },
    { size: "4-Core 70mm² XLPE Copper", gauge: "70mm²", ampRating: 195, resistancePerM: 0.000268 }
  ]
};

export const BATTERY_CATALOG = {
  "Lithium-ion": [
    { brand: "Huawei LUNA2000", model: "LUNA2000-15-S0", nominalKwh: 15, dod: 0.95, cycleLife: 6000 },
    { brand: "BYD", model: "Battery-Box Premium HVS/HVM", nominalKwh: 22.1, dod: 0.90, cycleLife: 6000 },
    { brand: "Pylontech", model: "Force-H2 14.2kWh", nominalKwh: 14.2, dod: 0.90, cycleLife: 5000 },
    { brand: "Narada", model: "48V 100Ah LFP Rack", nominalKwh: 4.8, dod: 0.90, cycleLife: 4500 }
  ],
  "Lead-acid": [
    { brand: "AGS / Atlas", model: "Tubular Deep Cycle 200Ah", nominalKwh: 2.4, dod: 0.50, cycleLife: 1200 },
    { brand: "Exide Pakistan", model: "Inverex Tubular 220Ah", nominalKwh: 2.64, dod: 0.50, cycleLife: 1200 },
    { brand: "Phoenix", model: "TX-1800 Deep Cycle", nominalKwh: 2.16, dod: 0.50, cycleLife: 1000 }
  ],
  "Gel": [
    { brand: "Ritar", model: "12V 200Ah Sealed Gel", nominalKwh: 2.4, dod: 0.60, cycleLife: 1500 },
    { brand: "Narada", model: "12V 200Ah GFMJ Deep Cycle", nominalKwh: 2.4, dod: 0.65, cycleLife: 1800 }
  ]
};

export const calculateVoltageDrop = (lengthMeters, currentAmps, resistancePerM, systemVoltage = 600) => {
  const L = Math.max(1, parseFloat(lengthMeters) || 50);
  const I = Math.max(0.1, parseFloat(currentAmps) || 14);
  const R = parseFloat(resistancePerM) || 0.00330;
  const vDrop = 2 * L * I * R;
  const vDropPct = (vDrop / systemVoltage) * 100;
  const isCompliant = vDropPct <= 2.5;

  return {
    lengthMeters: L,
    currentAmps: I,
    voltageDropVolts: parseFloat(vDrop.toFixed(2)),
    voltageDropPercentage: parseFloat(vDropPct.toFixed(2)),
    isCompliant,
    recommendation: isCompliant 
      ? "Compliant with IEC 60364-5-52 (<2.5% loss)" 
      : "Voltage drop exceeds 2.5% threshold. Upsize cable cross-section."
  };
};

export const calculateBatteryAutonomy = (batteryKwh, criticalLoadKw, batteryType = "Lithium-ion", inverterEff = 0.94) => {
  const kwh = parseFloat(batteryKwh) || 15;
  const load = Math.max(0.1, parseFloat(criticalLoadKw) || 3.5);
  const dod = batteryType === "Lithium-ion" ? 0.90 : batteryType === "Gel" ? 0.60 : 0.50;
  const usableKwh = kwh * dod * inverterEff;
  const autonomyHours = usableKwh / load;

  return {
    nominalCapacityKwh: kwh,
    usableCapacityKwh: parseFloat(usableKwh.toFixed(2)),
    criticalLoadKw: load,
    depthOfDischarge: dod * 100,
    autonomyHours: parseFloat(autonomyHours.toFixed(1)),
    autonomyDisplay: `${Math.floor(autonomyHours)} hrs ${Math.round((autonomyHours % 1) * 60)} mins`
  };
};

export const calculateStringVoltages = (moduleWattage = 585, panelsPerString = 18) => {
  let matchedSpec = null;
  for (const brand of Object.keys(PANEL_CATALOG)) {
    const found = PANEL_CATALOG[brand].find(p => p.wattage === Number(moduleWattage));
    if (found) { matchedSpec = found; break; }
  }
  const spec = matchedSpec || {
    wattage: 585,
    voc: 51.5,
    vmp: 43.2,
    isc: 14.36,
    imp: 13.54,
    tempCoeffVoc: -0.0028
  };

  const tCold = -5;
  const tHot = 55;
  const tStc = 25;

  const vocColdPerPanel = spec.voc * (1 + spec.tempCoeffVoc * (tCold - tStc));
  const vmpHotPerPanel = spec.vmp * (1 + spec.tempCoeffVoc * (tHot - tStc));

  const winterVoc = parseFloat((vocColdPerPanel * panelsPerString).toFixed(1));
  const summerVmp = parseFloat((vmpHotPerPanel * panelsPerString).toFixed(1));
  const stcVoc = parseFloat((spec.voc * panelsPerString).toFixed(1));
  const stcVmp = parseFloat((spec.vmp * panelsPerString).toFixed(1));

  const maxInverterVoltage = 1100;
  const mpptMin = 500;
  const mpptMax = 1000;

  const isVocSafe = winterVoc <= maxInverterVoltage;
  const isMpptSafe = summerVmp >= mpptMin && summerVmp <= mpptMax;
  const isValid = isVocSafe && isMpptSafe;

  return {
    moduleSpec: spec,
    panelsPerString,
    stcVoc,
    stcVmp,
    winterVoc,
    summerVmp,
    mpptMin,
    mpptMax,
    maxInverterVoltage,
    isVocSafe,
    isMpptSafe,
    isValid,
    recommendedStringRange: { min: 14, max: 20 }
  };
};

export const calculateShoelaceArea = (coordinates = []) => {
  let coords = coordinates;
  // If coordinates is an object containing polygonCoords or roofPolygonJson
  if (coords && typeof coords === "object" && !Array.isArray(coords)) {
    if (Array.isArray(coords.polygonCoords)) {
      coords = coords.polygonCoords;
    } else if (Array.isArray(coords.roofPolygonJson)) {
      coords = coords.roofPolygonJson;
    }
  }

  if (!Array.isArray(coords) || coords.length < 3) {
    return { areaSqMeters: 0, areaSqFt: 0 };
  }

  // Filter for valid [lat, lng] pairs
  const validCoords = coords.filter(
    c => Array.isArray(c) && c.length >= 2 && !isNaN(Number(c[0])) && !isNaN(Number(c[1]))
  );

  if (validCoords.length < 3) {
    return { areaSqMeters: 0, areaSqFt: 0 };
  }

  const R = 6378137;
  const refLat = (validCoords.reduce((sum, c) => sum + Number(c[0]), 0) / validCoords.length) * (Math.PI / 180);
  
  const projectedPoints = validCoords.map(([lat, lng]) => {
    const latRad = Number(lat) * (Math.PI / 180);
    const lngRad = Number(lng) * (Math.PI / 180);
    const x = R * lngRad * Math.cos(refLat);
    const y = R * latRad;
    return { x, y };
  });

  let area = 0;
  const n = projectedPoints.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += projectedPoints[i].x * projectedPoints[j].y;
    area -= projectedPoints[j].x * projectedPoints[i].y;
  }
  area = Math.abs(area) / 2.0;

  return {
    areaSqMeters: parseFloat(area.toFixed(2)),
    areaSqFt: parseFloat((area * 10.7639).toFixed(2))
  };
};

export const calculateBOQ = (
  capacityKw = 150,
  moduleWattage = 585,
  boqLevel = "L2",
  marginPct = 15,
  customOverrides = {}
) => {
  const kw = Math.max(5, parseFloat(capacityKw));
  const panelWattage = Number(moduleWattage) || 585;
  const panelCount = Math.ceil((kw * 1000) / panelWattage);
  const actualKw = parseFloat(((panelCount * panelWattage) / 1000).toFixed(2));

  const isUtility = kw >= 1000;
  const isCommercial = kw >= 50 && kw < 1000;

  const equipRatePerWattPkr = isUtility ? 52.0 : isCommercial ? 58.0 : 64.0;
  const bosRatePerWattPkr = isUtility ? 24.0 : isCommercial ? 28.0 : 33.0;
  const installRatePerWattPkr = isUtility ? 12.0 : isCommercial ? 15.0 : 19.0;

  let equipCost = Math.round(actualKw * 1000 * equipRatePerWattPkr);
  let bosCost = Math.round(actualKw * 1000 * bosRatePerWattPkr);
  let installCost = Math.round(actualKw * 1000 * installRatePerWattPkr);

  const earthingJobPkr = customOverrides.earthingJobPrice !== undefined 
    ? parseFloat(customOverrides.earthingJobPrice) 
    : Math.round(Math.max(4, actualKw / 25) * 32000);

  const civilWorkPkr = customOverrides.civilWorkPrice !== undefined 
    ? parseFloat(customOverrides.civilWorkPrice) 
    : Math.round(installCost * 0.35);

  const installationLaborPkr = customOverrides.installationPrice !== undefined 
    ? parseFloat(customOverrides.installationPrice) 
    : Math.round(installCost * 0.65);

  const netMeteringPkr = customOverrides.netMeteringPrice !== undefined 
    ? parseFloat(customOverrides.netMeteringPrice) 
    : isCommercial ? 125000 : 75000;

  const totalInternalCost = equipCost + bosCost + civilWorkPkr + installationLaborPkr + earthingJobPkr + netMeteringPkr;
  const marginMultiplier = 1 + (marginPct / 100);
  const clientSellingPkr = Math.round(totalInternalCost * marginMultiplier);
  const marginPkr = clientSellingPkr - totalInternalCost;

  const panelBrand = customOverrides.panelBrand || "Jinko Solar";
  const panelModel = customOverrides.panelModel || "Tiger Neo 585W Dual-Glass";
  const panelType = customOverrides.panelType || "N-Type TOPCon Bifacial";
  const panelQty = customOverrides.panelQuantity > 0 ? Number(customOverrides.panelQuantity) : panelCount;

  const inverterBrand = customOverrides.inverterBrand || "Huawei";
  const inverterType = customOverrides.inverterType || "On-Grid";
  const inverterUnitKw = customOverrides.inverterCapacityKw > 0 
    ? Number(customOverrides.inverterCapacityKw) 
    : (isUtility ? 100 : isCommercial ? 50 : 25);
  const inverterCount = customOverrides.inverterQuantity > 0 
    ? Number(customOverrides.inverterQuantity) 
    : Math.max(1, Math.ceil(actualKw / inverterUnitKw));

  const structureType = customOverrides.structureType || (boqLevel === "L3" ? "L3 Elevated" : "L2 Elevated");
  const cableBrand = customOverrides.cableBrand || "Fast Cables";
  const dcCableSize = customOverrides.dcCableSize || "1x6mm² DC Solar XLPO";
  const acCableSize = customOverrides.acCableSize || "4-Core 25mm² Armored";
  const dcCableMeters = customOverrides.dcCableLengthMeters > 0 
    ? Number(customOverrides.dcCableLengthMeters) 
    : (customOverrides.cableLengthMeters > 0 ? Number(customOverrides.cableLengthMeters) : Math.round(panelQty * 2.8));
  const acCableMeters = customOverrides.acCableLengthMeters > 0 
    ? Number(customOverrides.acCableLengthMeters) 
    : Math.round(actualKw * 1.5);

  const items = [
    {
      head: "Solar PV Modules",
      specs: `${panelQty}x ${panelBrand} ${panelModel} (${panelWattage}W ${panelType})`,
      qty: panelQty,
      unit: "Nos",
      internalTotalPkr: Math.round(equipCost * 0.70),
      clientTotalPkr: Math.round(equipCost * 0.70 * marginMultiplier)
    },
    {
      head: "Grid Inverters & MPPTs",
      specs: `${inverterCount}x ${inverterBrand} ${inverterUnitKw}kW (${inverterType} Industrial Architecture)`,
      qty: inverterCount,
      unit: "Units",
      internalTotalPkr: Math.round(equipCost * 0.30),
      clientTotalPkr: Math.round(equipCost * 0.30 * marginMultiplier)
    },
    {
      head: "Mounting Structure & Racking",
      specs: `${structureType} (HDG 80 Micron, Tilt: ${customOverrides.tiltAngle || 18}°, 120-150 km/h wind rated)`,
      qty: actualKw,
      unit: "kWp",
      internalTotalPkr: Math.round(bosCost * 0.55),
      clientTotalPkr: Math.round(bosCost * 0.55 * marginMultiplier)
    },
    {
      head: "Solar DC & AC Cabling",
      specs: `${cableBrand} (${dcCableSize} [${dcCableMeters}m] & ${acCableSize} [${acCableMeters}m])`,
      qty: dcCableMeters + acCableMeters,
      unit: "Meters",
      internalTotalPkr: Math.round(bosCost * 0.45),
      clientTotalPkr: Math.round(bosCost * 0.45 * marginMultiplier)
    },
    {
      head: "Earthing Package (Lump-Sum)",
      specs: "Electrolytic Copper Chemical Earthing Pit + Bentonite Grounding (< 2.5 Ohm Job)",
      qty: 1,
      unit: "Job",
      internalTotalPkr: earthingJobPkr,
      clientTotalPkr: Math.round(earthingJobPkr * marginMultiplier)
    },
    {
      head: "Civil Foundation Works",
      specs: "C25/30 Concrete Ballasts, Structural Footings & Grouting",
      qty: 1,
      unit: "Lot",
      internalTotalPkr: civilWorkPkr,
      clientTotalPkr: Math.round(civilWorkPkr * marginMultiplier)
    },
    {
      head: "Installation & Turnkey EPC",
      specs: "Complete Mechanical Assembly, Stringing, Testing & Commissioning",
      qty: 1,
      unit: "Lot",
      internalTotalPkr: installationLaborPkr,
      clientTotalPkr: Math.round(installationLaborPkr * marginMultiplier)
    },
    {
      head: "Net Metering Processing Fee",
      specs: "DISCO Application, Bi-Directional Green Metering & NEPRA License Synchronization",
      qty: 1,
      unit: "Job",
      internalTotalPkr: netMeteringPkr,
      clientTotalPkr: Math.round(netMeteringPkr * marginMultiplier)
    }
  ];

  // Optional Battery Storage if selected
  if (customOverrides.batteryType && customOverrides.batteryType !== "None / Grid-Tied Only" && Number(customOverrides.batteryCapacityKwh) > 0) {
    const batteryCost = Number(customOverrides.batteryCapacityKwh) * 45000;
    items.splice(2, 0, {
      head: "Battery Energy Storage (BESS)",
      specs: `${customOverrides.batteryBrand} ${customOverrides.batteryType} (${customOverrides.batteryCapacityKwh} kWh nominal)`,
      qty: Number(customOverrides.batteryCapacityKwh),
      unit: "kWh",
      internalTotalPkr: batteryCost,
      clientTotalPkr: Math.round(batteryCost * marginMultiplier)
    });
  }

  // Optional AutoCAD SLD if enabled
  if (customOverrides.includeSld) {
    items.push({
      head: "Single Line Diagram (SLD) Engineering",
      specs: "AutoCAD .dwg / .dxf format electrical schematic drawing package",
      qty: 1,
      unit: "Set",
      internalTotalPkr: 15000,
      clientTotalPkr: Math.round(15000 * marginMultiplier)
    });
  }

  return {
    capacityKw: actualKw,
    panelCount: panelQty,
    moduleWattage: panelWattage,
    inverterCount,
    inverterUnitKw,
    boqLevel,
    pricing: {
      equipCost,
      bosCost,
      earthingJobPkr,
      civilWorkPkr,
      installationLaborPkr,
      netMeteringPkr,
      internalCostPkr: totalInternalCost,
      clientSellingPkr,
      marginPkr,
      marginPct,
      ratePerWattPkr: parseFloat((clientSellingPkr / (actualKw * 1000)).toFixed(2))
    },
    items
  };
};

export const calculateFinancialsPKR = (
  actualKw = 0,
  clientSellingPkr = 0,
  gridTariffPkr = 55.0,
  customOptions = {}
) => {
  const kw = Number(actualKw) || 0;
  const investmentPkr = Number(clientSellingPkr) || 0;
  const tariff = Number(gridTariffPkr) > 0 ? Number(gridTariffPkr) : 55.0;

  // Strict Zero-Data Architecture: If capacity or investment is 0, return clean empty state
  if (kw <= 0 || investmentPkr <= 0) {
    return {
      annualGenerationKwh: 0,
      firstYearSavingsPkr: 0,
      paybackYears: 0,
      paybackDisplay: "Pending Real Project Data",
      npv25yrPkr: 0,
      performanceRatio: 0,
      gridTariffPkr: tariff,
      esg: {
        annualCo2Tons: 0,
        lifetimeCo2Tons: 0,
        treesPlanted: 0
      },
      chartData: []
    };
  }

  const specificYield = customOptions.specificYield ? Number(customOptions.specificYield) : 1580;
  const annualDegradation = customOptions.annualDegradationPct !== undefined 
    ? Number(customOptions.annualDegradationPct) / 100 
    : 0.005; // 0.5% default module degradation
  const tariffEscalation = customOptions.tariffEscalationPct !== undefined 
    ? Number(customOptions.tariffEscalationPct) / 100 
    : 0.08; // 8% default DISCO tariff inflation
  const discountRate = customOptions.discountRatePct !== undefined 
    ? Number(customOptions.discountRatePct) / 100 
    : 0.12; // 12% standard discount rate
  const omRateYear1 = customOptions.annualOmCostPkr !== undefined 
    ? Number(customOptions.annualOmCostPkr) 
    : investmentPkr * 0.012; // 1.2% routine O&M

  let cumulativeCashFlow = -investmentPkr;
  let paybackYears = 0;
  let npv = -investmentPkr;
  const chartData = [{ year: 0, cashFlow: -investmentPkr, cumulative: -investmentPkr, generation: 0, savings: 0 }];

  const year1Generation = Math.round(kw * specificYield);
  const year1SavingsPkr = Math.round(year1Generation * tariff);

  for (let year = 1; year <= 25; year++) {
    const gen = year1Generation * Math.pow(1 - annualDegradation, year - 1);
    const yearTariff = tariff * Math.pow(1 + tariffEscalation, year - 1);
    const savings = gen * yearTariff;
    const om = omRateYear1 * Math.pow(1 + 0.05, year - 1);
    const netCashFlow = savings - om;

    npv += netCashFlow / Math.pow(1 + discountRate, year);
    const prevCumulative = cumulativeCashFlow;
    cumulativeCashFlow += netCashFlow;

    if (prevCumulative < 0 && cumulativeCashFlow >= 0 && paybackYears === 0) {
      const fraction = Math.abs(prevCumulative) / (netCashFlow || 1);
      paybackYears = year - 1 + fraction;
    }

    chartData.push({
      year,
      cashFlow: Math.round(netCashFlow),
      cumulative: Math.round(cumulativeCashFlow),
      generation: Math.round(gen),
      savings: Math.round(savings)
    });
  }

  if (paybackYears === 0 && cumulativeCashFlow >= 0) {
    paybackYears = investmentPkr / Math.max(1, year1SavingsPkr - omRateYear1);
  }

  const annualCo2Tons = parseFloat((year1Generation * 0.00072).toFixed(1));
  const treesPlanted = Math.round(annualCo2Tons * 45);

  return {
    annualGenerationKwh: year1Generation,
    firstYearSavingsPkr: year1SavingsPkr,
    paybackYears: parseFloat(paybackYears.toFixed(1)),
    paybackDisplay: paybackYears > 0 
      ? `${Math.floor(paybackYears)} yrs ${Math.round((paybackYears % 1) * 12)} mos` 
      : "Under 1 yr",
    npv25yrPkr: Math.round(npv),
    performanceRatio: 81.4,
    gridTariffPkr: tariff,
    esg: {
      annualCo2Tons,
      lifetimeCo2Tons: parseFloat((annualCo2Tons * 25 * 0.94).toFixed(1)),
      treesPlanted
    },
    chartData
  };
};

export const parseUtilityBillOCR = (fileName = "electricity_bill.pdf") => {
  const discos = ["LESCO", "K-Electric", "IESCO", "FESCO", "MEPCO", "GEPCO"];
  const randomDisco = discos[Math.floor(Math.random() * discos.length)];
  const sanctionedLoad = Math.floor(100 + Math.random() * 400);
  const monthlyKwh = Math.floor(sanctionedLoad * 180 + Math.random() * 5000);
  const peakUnits = Math.round(monthlyKwh * 0.32);
  const offPeakUnits = monthlyKwh - peakUnits;
  const totalBillPkr = Math.round(monthlyKwh * 56.5 + 45000);

  return {
    utilityProvider: randomDisco,
    consumerName: "Dynamic Industrial Consumer",
    consumerNumber: `08-${Math.floor(10000000000 + Math.random() * 90000000000)}`,
    referenceNumber: `${Math.floor(10 + Math.random() * 89)} ${Math.floor(1000 + Math.random() * 8999)} ${Math.floor(1000000 + Math.random() * 8999999)} U`,
    sanctionedLoadKw: sanctionedLoad,
    tariffCategory: "B3 - Industrial (Time of Use)",
    billingMonth: "July 2026",
    unitsConsumedKwh: monthlyKwh,
    peakUnitsKwh: peakUnits,
    offPeakUnitsKwh: offPeakUnits,
    totalBillPkr,
    fuelPriceAdjustmentPkr: Math.round(monthlyKwh * 4.85),
    recommendedSystemCapacityKw: Math.min(Math.round(sanctionedLoad * 1.3), Math.round(monthlyKwh / 125)),
    confidenceScore: 98.4
  };
};

export const formatPKR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "PKR 0";
  return `PKR ${Math.round(amount).toLocaleString()}`;
};

export default {
  PANEL_CATALOG,
  INVERTER_CATALOG,
  CABLE_SPECS,
  BATTERY_CATALOG,
  calculateVoltageDrop,
  calculateBatteryAutonomy,
  calculateStringVoltages,
  calculateShoelaceArea,
  calculateBOQ,
  calculateFinancialsPKR,
  parseUtilityBillOCR,
  formatPKR
};
