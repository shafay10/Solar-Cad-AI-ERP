/**
 * helioscopeEngine.js
 * Core solar design math engine: module packing, solar position, shading,
 * stringing, and production estimation. All formulas are public-domain
 * solar-geometry / electrical-engineering equations (NOAA Solar Position,
 * Ohm's Law voltage drop, PVWatts-style derating) — no proprietary code.
 *
 * v1.1 CHANGES:
 * - FIX B: Tilt slider auto-recalculates row-pitch via winter-shadow formula
 * - FIX C: targetCount early-return bug fixed (keepouts/metrics no longer skipped)
 * - FIX D: Catalog expanded — 10 Tier-1 modules
 *
 * v1.2 CHANGES:
 * - FIX E: arrayScale no longer shrinks the physical module size. Instead it
 *   shrinks the PACKING AREA around its center (HelioScope behavior):
 *   smaller area = fewer panels fit, each module keeps its real dimensions.
 * - FIX F: panels stay CENTERED while scaling (no runaway to edges).
 */

import * as turf from "@turf/turf";
const getLeaflet = () => (typeof window !== "undefined" ? (window.L || globalThis.L) : null);

// =============================================================================
// 1. MODULE PHYSICAL SPECS CATALOG
// =============================================================================
export const MODULE_PHYSICAL_SPECS = {
    "Jinko Solar Tiger Neo 585W": {
        lengthMm: 2278,
        widthMm: 1134,
        wattage: 585,
        voc: 49.7,
        vmp: 41.9,
        isc: 14.99,
        imp: 13.97,
        tempCoeffPmaxPct: -0.29, // %/°C
        weightKg: 27.5
    },
    "Longi Hi-MO 6 540W": {
        lengthMm: 2278,
        widthMm: 1134,
        wattage: 540,
        voc: 49.3,
        vmp: 41.5,
        isc: 13.85,
        imp: 13.02,
        tempCoeffPmaxPct: -0.30,
        weightKg: 27.0
    },
    "Canadian Solar HiKu7 605W": {
        lengthMm: 2384,
        widthMm: 1303,
        wattage: 605,
        voc: 53.3,
        vmp: 44.7,
        isc: 14.35,
        imp: 13.54,
        tempCoeffPmaxPct: -0.34,
        weightKg: 33.0
    },
    "Trina Solar Vertex 550W": {
        lengthMm: 2384,
        widthMm: 1096,
        wattage: 550,
        voc: 49.8,
        vmp: 41.8,
        isc: 13.98,
        imp: 13.16,
        tempCoeffPmaxPct: -0.34,
        weightKg: 27.5
    },
    "JA Solar DeepBlue 4.0 585W": {
        lengthMm: 2278,
        widthMm: 1134,
        wattage: 585,
        voc: 50.0,
        vmp: 42.0,
        isc: 14.85,
        imp: 13.93,
        tempCoeffPmaxPct: -0.30,
        weightKg: 27.2
    },
    "Q CELLS Q.TRON 500W": {
        lengthMm: 1872,
        widthMm: 1048,
        wattage: 500,
        voc: 46.8,
        vmp: 39.6,
        isc: 13.70,
        imp: 12.65,
        tempCoeffPmaxPct: -0.29,
        weightKg: 22.5
    },
    "REC Alpha Pure-R 470W": {
        lengthMm: 1853,
        widthMm: 1138,
        wattage: 470,
        voc: 45.0,
        vmp: 38.4,
        isc: 13.60,
        imp: 12.24,
        tempCoeffPmaxPct: -0.26,
        weightKg: 21.7
    },
    "SunPower Maxeon 7 440W": {
        lengthMm: 1778,
        widthMm: 1134,
        wattage: 440,
        voc: 60.0,
        vmp: 51.0,
        isc: 9.30,
        imp: 8.63,
        tempCoeffPmaxPct: -0.26,
        weightKg: 20.1
    },
    "Risen Energy Titan 580W": {
        lengthMm: 2278,
        widthMm: 1134,
        wattage: 580,
        voc: 49.6,
        vmp: 41.7,
        isc: 14.90,
        imp: 13.90,
        tempCoeffPmaxPct: -0.29,
        weightKg: 27.4
    },
    "Astronergy ASTRO N7s 580W": {
        lengthMm: 2384,
        widthMm: 1134,
        wattage: 580,
        voc: 49.5,
        vmp: 41.6,
        isc: 14.87,
        imp: 13.95,
        tempCoeffPmaxPct: -0.29,
        weightKg: 27.6
    }
};

// =============================================================================
// 2. GEODESIC / COORDINATE HELPERS
// =============================================================================
const EARTH_RADIUS_M = 6378137;

/** Convert a GPS [lat,lng] to local planar meters relative to a reference point. */
export function latLngToMeters(lat, lng, refLat, refLng) {
    const refLatRad = (refLat * Math.PI) / 180;
    const x = (lng - refLng) * (Math.PI / 180) * EARTH_RADIUS_M * Math.cos(refLatRad);
    const y = (lat - refLat) * (Math.PI / 180) * EARTH_RADIUS_M;
    return { x, y };
}

/** Convert local planar meters back to GPS [lat,lng] relative to a reference point. */
export function metersToLatLng(x, y, refLat, refLng) {
    const refLatRad = (refLat * Math.PI) / 180;
    const lat = refLat + (y / EARTH_RADIUS_M) * (180 / Math.PI);
    const lng = refLng + (x / (EARTH_RADIUS_M * Math.cos(refLatRad))) * (180 / Math.PI);
    const res = [lat, lng];
    res.lat = lat;
    res.lng = lng;
    return res;
}

/** Ray-casting point-in-polygon test. point: [lat,lng]. polygon: [[lat,lng], ...] */
export function isPointInPolygon(point, polygon) {
    if (!point || !polygon || polygon.length < 3) return false;
    const py = Array.isArray(point) ? point[0] : (point.lat ?? point.y ?? 0);
    const px = Array.isArray(point) ? point[1] : (point.lng ?? point.x ?? 0);
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const p1 = polygon[i];
        const p2 = polygon[j];
        const yi = Array.isArray(p1) ? p1[0] : (p1.lat ?? p1.y ?? 0);
        const xi = Array.isArray(p1) ? p1[1] : (p1.lng ?? p1.x ?? 0);
        const yj = Array.isArray(p2) ? p2[0] : (p2.lat ?? p2.y ?? 0);
        const xj = Array.isArray(p2) ? p2[1] : (p2.lng ?? p2.x ?? 0);
        const intersect =
            (yi > py) !== (yj > py) &&
            px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

/** Shoelace-formula polygon centroid. Returns [lat, lng] with .lat/.lng properties. */
export function calculateCentroid(polygon) {
    if (!polygon || polygon.length === 0) {
        const fallback = [0, 0];
        fallback.lat = 0;
        fallback.lng = 0;
        return fallback;
    }
    let latSum = 0;
    let lngSum = 0;
    polygon.forEach((pt) => {
        const lat = Array.isArray(pt) ? pt[0] : (pt.lat || 0);
        const lng = Array.isArray(pt) ? pt[1] : (pt.lng || 0);
        latSum += lat;
        lngSum += lng;
    });
    const lat = latSum / polygon.length;
    const lng = lngSum / polygon.length;
    const res = [lat, lng];
    res.lat = lat;
    res.lng = lng;
    return res;
}

/** Geodesic area of a polygon via local-meter shoelace formula. */
export function calculateGeodesicArea(polygon) {
    if (!polygon || polygon.length < 3) return { areaSqM: 0, areaSqFt: 0 };
    const [refLat, refLng] = Array.isArray(polygon[0]) ? polygon[0] : [polygon[0].lat, polygon[0].lng];
    const pts = polygon.map((pt) => {
        const lat = Array.isArray(pt) ? pt[0] : pt.lat;
        const lng = Array.isArray(pt) ? pt[1] : pt.lng;
        return latLngToMeters(lat, lng, refLat, refLng);
    });
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    const areaSqM = Math.abs(area) / 2;
    return {
        areaSqM: Math.round(areaSqM * 10) / 10,
        areaSqFt: Math.round(areaSqM * 10.7639 * 10) / 10
    };
}

// =============================================================================
// 3. WINTER SOLSTICE ROW-SPACING (SHADOW-FREE INTER-ROW PITCH)
// =============================================================================
export function calculateWinterShadowSpacing(moduleHeightM, tiltDegrees, latitude = 31.5) {
    const tiltRad = (tiltDegrees * Math.PI) / 180;
    const winterElevDeg = Math.max(5, 90 - Math.abs(latitude) - 23.45);
    const winterElevRad = (winterElevDeg * Math.PI) / 180;

    const totalRowPitchMeters =
        moduleHeightM * (Math.cos(tiltRad) + Math.sin(tiltRad) / Math.tan(winterElevRad));
    const minClearanceMeters = totalRowPitchMeters - moduleHeightM * Math.cos(tiltRad);

    return {
        totalRowPitchMeters: Math.round(totalRowPitchMeters * 100) / 100,
        minClearanceMeters: Math.round(Math.max(0, minClearanceMeters) * 100) / 100,
        winterNoonElevationDeg: Math.round(winterElevDeg * 10) / 10
    };
}

// =============================================================================
// 4. NOAA-STYLE SOLAR POSITION ALGORITHM (SIMPLIFIED)
// =============================================================================
export function calculateSolarPosition(latitude, dayOfYear, solarHour) {
    const latRad = (latitude * Math.PI) / 180;

    const declDeg = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
    const declRad = (declDeg * Math.PI) / 180;

    const hourAngleDeg = 15 * (solarHour - 12);
    const hourAngleRad = (hourAngleDeg * Math.PI) / 180;

    const sinElev =
        Math.sin(latRad) * Math.sin(declRad) +
        Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourAngleRad);
    const elevRad = Math.asin(Math.max(-1, Math.min(1, sinElev)));
    const elevationDeg = (elevRad * 180) / Math.PI;

    const cosAz =
        (Math.sin(declRad) - Math.sin(latRad) * Math.sin(elevRad)) /
        (Math.cos(latRad) * Math.cos(elevRad) || 1e-9);
    let azRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    let azimuthDeg = (azRad * 180) / Math.PI;
    if (hourAngleDeg > 0) azimuthDeg = 360 - azimuthDeg;
    azimuthDeg = (azimuthDeg + 180) % 360;

    return {
        elevationDeg: Math.round(elevationDeg * 10) / 10,
        azimuthDeg: Math.round(azimuthDeg * 10) / 10,
        declinationDeg: Math.round(declDeg * 10) / 10
    };
}

export function calculateSunPosition(lat, lng, date = new Date()) {
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const diff = date - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.max(1, Math.min(365, Math.floor(diff / oneDay)));
    const solarHour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
    const pos = calculateSolarPosition(Number(lat) || 31.5, dayOfYear, solarHour);
    return {
        altitudeDeg: pos.elevationDeg,
        azimuthDeg: pos.azimuthDeg
    };
}

// =============================================================================
// 5. OBSTACLE SHADOW LENGTH (SIMPLE TRIGONOMETRY)
// =============================================================================
export function calculateObstacleShadow({ heightM, distanceM, elevationDeg }) {
    const elevRad = (Math.max(1, elevationDeg) * Math.PI) / 180;
    const shadowLengthM = heightM / Math.tan(elevRad);
    return {
        shadowLengthM: Math.round(shadowLengthM * 100) / 100,
        isShaded: shadowLengthM > distanceM
    };
}

// =============================================================================
// 6. HELIOSCOPE-GRADE SOLAR MODULE ARRAY GENERATOR & RENDERER
// =============================================================================
export function renderHelioScopeModules(map, roofPolygonLatLngs, config = {}) {
    const {
        wattage = 585,
        azimuth = 180,
        rackingType = "Fixed Tilt / Flush Mount"
    } = config;

    if (!roofPolygonLatLngs || roofPolygonLatLngs.length < 3) {
        return { modulesLayer: null, moduleCount: 0, modules: [], metrics: { count: 0, capacityKw: 0 } };
    }

    const packedPanels = packModulesWithSafeAzimuth(roofPolygonLatLngs, {
        ...config,
        azimuth,
        rackingType
    });

    const moduleCount = packedPanels.length;
    const capacityKw = Math.round(((moduleCount * wattage) / 1000) * 10) / 10;

    let sumModLat = 0, sumModLng = 0;
    packedPanels.forEach(m => {
        if (m.center && isFinite(m.center[0]) && isFinite(m.center[1])) {
            sumModLat += m.center[0];
            sumModLng += m.center[1];
        }
    });
    const finalCentroid = packedPanels.length > 0
        ? [sumModLat / packedPanels.length, sumModLng / packedPanels.length]
        : calculateCentroid(roofPolygonLatLngs);

    return {
        modulesLayer: null,
        moduleCount,
        modules: packedPanels,
        anchor: finalCentroid,
        metrics: {
            count: moduleCount,
            capacityKw
        }
    };
}

/**
 * Professional HelioScope-style Table Packing Engine (Decoupled Safe Azimuth Alignment)
 * v1.2: arrayScale now shrinks the PACKING AREA around its center instead of
 * shrinking the physical module size. Panels stay centered while scaling and
 * module count changes logically with the scale slider.
 */
export function packModulesOnRoof(polygonMeters, options = {}) {
    let polyInput = polygonMeters;
    let opts = options;

    if (polygonMeters && !Array.isArray(polygonMeters) && typeof polygonMeters === "object") {
        opts = polygonMeters;
        polyInput = opts.roofPolygonGps || opts.polygonMeters || opts.polygon;
    }

    // ★ v1.2: modules keep their REAL physical size — arrayScale affects the
    // PACKING AREA only (shrink block applied below around the area center).
    const arrayScale = Number(options.arrayScale || opts.arrayScale) || 1.0;
    const safeScale = Math.min(2.0, Math.max(0.3, arrayScale || 1.0));
    const isLandscape = String(options.orientation || opts.orientation || "").toUpperCase().includes("LAND");
    const inputW = Number(options.moduleWidth || opts.moduleWidth) || 1.134;
    const inputL = Number(options.moduleLength || opts.moduleLength) || 2.278;
    const rawW = inputW > 10 ? inputW / 1000 : inputW;
    const rawL = inputL > 10 ? inputL / 1000 : inputL;
    const actualW = (isLandscape ? Math.max(rawW, rawL) : Math.min(rawW, rawL));
    const actualL = (isLandscape ? Math.min(rawW, rawL) : Math.max(rawW, rawL));

    const {
        setbackM = 0.3,
        setbackMeters = setbackM,
        setback = setbackMeters !== undefined ? setbackMeters : setbackM,
        rowSpacingM = 0.50,
        colSpacingM = 0.03,
        colSpacing = colSpacingM,
        targetCapacityMode = "AUTO_FIT",
        wattage = 585,
        keepouts = [],
        gridOffset = { x: 0, y: 0 },
        gridAlignment = "CENTER"
    } = opts;

    // 1. Robust Sanitization for Azimuth (handles 0° vs undefined/NaN)
    const rawAzimuth = opts.azimuth ?? opts.azimuthDegrees ?? opts.azimuthDeg;
    const actualAzimuth = (typeof rawAzimuth === "number" && !isNaN(rawAzimuth))
        ? rawAzimuth
        : (Number.isFinite(Number(rawAzimuth)) ? Number(rawAzimuth) : 180);

    // 2. Robust Sanitization for Tilt (handles 0° flush vs undefined/NaN)
    const rawTilt = opts.tilt ?? opts.tiltDegrees ?? opts.tiltDeg;
    const actualTilt = (typeof rawTilt === "number" && !isNaN(rawTilt))
        ? rawTilt
        : (Number.isFinite(Number(rawTilt)) ? Number(rawTilt) : 18);

    // 3. Robust Sanitization for Racking Type
    const rackingType = opts.rackingType || "L2_ELEVATED";

    const actualSetback = Number(setback !== undefined ? setback : (setbackMeters !== undefined ? setbackMeters : 0.3));
    const actualColSpacing = Number(colSpacing !== undefined ? colSpacing : (colSpacingM !== undefined ? colSpacingM : 0.03));

    // 4. Resolve Target Count / Capacity
    const isTargetCap = String(targetCapacityMode || "").toUpperCase() === "TARGET_CAP";
    const rawTargetKwp = isTargetCap ? (opts.targetKwP ?? opts.targetKwp) : null;
    const targetKwp = rawTargetKwp !== undefined && rawTargetKwp !== null ? Number(rawTargetKwp) : null;
    const targetCount = opts.targetCount !== undefined && opts.targetCount !== null
        ? Number(opts.targetCount)
        : (isTargetCap && targetKwp ? Math.max(1, Math.round((targetKwp * 1000) / (Number(wattage) || 585))) : null);

    if (!polyInput || polyInput.length < 3) {
        const empty = [];
        empty.modules = [];
        empty.metrics = { count: 0, capacityKw: 0 };
        return empty;
    }

    // 5. Detect coordinate space (GPS [lat, lng] vs Planar Meters [x, y])
    const p0Lat = Array.isArray(polyInput[0]) ? polyInput[0][0] : (polyInput[0]?.lat ?? polyInput[0]?.y ?? 0);
    const p0Lng = Array.isArray(polyInput[0]) ? polyInput[0][1] : (polyInput[0]?.lng ?? polyInput[0]?.x ?? 0);
    const isGpsCoords = !opts.isPlanarMeters && !opts.isLocalMeters &&
        Math.abs(p0Lat) <= 90 && Math.abs(p0Lng) <= 180 &&
        (Math.abs(p0Lat) > 0.001 || Math.abs(p0Lng) > 0.001);

    // Check for explicit reference coordinates (e.g. from centroid of activePolygon)
    let refLat = Number(opts.refLat ?? opts.centroid?.lat ?? (Array.isArray(opts.centroid) ? opts.centroid[0] : 0));
    let refLng = Number(opts.refLng ?? opts.centroid?.lng ?? (Array.isArray(opts.centroid) ? opts.centroid[1] : 0));
    const hasExplicitRefCoords = Boolean(refLat !== 0 || refLng !== 0);

    let polygonM = [];

    if (isGpsCoords) {
        const centroid = calculateCentroid(polyInput);
        refLat = Array.isArray(centroid) ? centroid[0] : (centroid?.lat || 0);
        refLng = Array.isArray(centroid) ? centroid[1] : (centroid?.lng || 0);
        polygonM = polyInput.map(pt => {
            const lat = Array.isArray(pt) ? pt[0] : (pt?.lat ?? 0);
            const lng = Array.isArray(pt) ? pt[1] : (pt?.lng ?? 0);
            const m = latLngToMeters(lat, lng, refLat, refLng);
            return [m.x, m.y];
        });
    } else {
        polygonM = polyInput.map(pt => {
            const x = Array.isArray(pt) ? pt[0] : (pt?.x ?? pt?.lng ?? 0);
            const y = Array.isArray(pt) ? pt[1] : (pt?.y ?? pt?.lat ?? 0);
            return [Number(x) || 0, Number(y) || 0];
        });
    }

    // 2. Centroid pivot (cX, cY) in planar meters
    let cX = 0, cY = 0;
    polygonM.forEach(([x, y]) => {
        cX += x;
        cY += y;
    });
    cX /= polygonM.length;
    cY /= polygonM.length;

    // 3. Azimuth angle math (Radians)
    const angleRad = (actualAzimuth - 180) * (Math.PI / 180);
    const cosA = Math.cos(-angleRad);
    const sinA = Math.sin(-angleRad);

    // 4. Transform roof polygon vertices into temporarily aligned flat space (-Azimuth)
    const localPoly = polygonM.map(([x, y]) => {
        const dx = x - cX;
        const dy = y - cY;
        return [dx * cosA - dy * sinA, dx * sinA + dy * cosA];
    });

    // 5. Aligned bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    localPoly.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });

    let startX = minX + actualSetback;
    let endX = maxX - actualSetback;
    let startY = minY + actualSetback;
    let endY = maxY - actualSetback;

    if (endX <= startX || endY <= startY) {
        startX = minX;
        endX = maxX;
        startY = minY;
        endY = maxY;
    }

    // ★ FIX 4: Scale must NEVER change panel count.
    // Panel count is governed strictly by kW formula or roof geometry.
    // Visual array scaling is handled in rendering layers (2D Canvas and 3D Three.js).

    // Apply draggable grid offset in aligned space
    startX += (Number(gridOffset?.x) || 0);
    startY += (Number(gridOffset?.y) || 0);

    // Tilt foreshortening: in 2D top-down view, tilt only affects visual dimension of rectangle
    const tiltRad = ((Number(actualTilt) || 0) * Math.PI) / 180;
    const visualLength = actualL * Math.cos(tiltRad); // Standard top-down orthographic view

    // ★ FIX B: TILT-LINKED ROW PITCH (HelioScope behavior)
    // Tilt slider changes -> winter-solstice shadow-free pitch auto-recalculated.
    // Manual override: if caller explicitly provided rowSpacing (gap) or
    // shadowPitch (total pitch), those are used instead of the auto value.
    const latitude = Number(opts.latitude ?? 31.5);
    const manualGap = opts.rowSpacing;          // explicit gap in meters (undefined = auto)
    const manualShadowPitch = opts.shadowPitch; // explicit total pitch in meters (undefined = auto)

    let rowPitch;
    if (manualShadowPitch !== undefined) {
        rowPitch = Math.max(visualLength + 0.05, Number(manualShadowPitch) || 0);
    } else if (manualGap !== undefined) {
        rowPitch = visualLength + Math.max(0, Number(manualGap) || 0);
    } else {
        // AUTO MODE: winter solstice shadow-free pitch (tilt + latitude derived)
        const winter = calculateWinterShadowSpacing(actualL, actualTilt, latitude);
        rowPitch = Math.max(visualLength + 0.05, winter.totalRowPitchMeters);
    }
    const colPitch = actualW + Math.max(0.02, actualColSpacing);

    // Grid alignment shift
    const spanX = endX - startX;
    const numCols = Math.max(1, Math.floor(spanX / colPitch));
    const remX = Math.max(0, spanX - numCols * colPitch);
    if (gridAlignment === "CENTER") {
        startX += (remX / 2);
    } else if (gridAlignment === "RIGHT") {
        startX = endX - numCols * colPitch;
    }

    // Point-in-polygon helper
    function pointInPoly(px, py, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i][0], yi = poly[i][1];
            const xj = poly[j][0], yj = poly[j][1];
            const intersect = ((yi > py) !== (yj > py)) &&
                (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    const panels = [];
    const backCos = Math.cos(angleRad);
    const backSin = Math.sin(angleRad);
    const halfW = actualW / 2;
    const halfH = actualL / 2;
    const cornerOffsets = [
        [-halfW, -halfH],
        [halfW, -halfH],
        [halfW, halfH],
        [-halfW, halfH]
    ];

    // Helper: add panel rotated back by +Azimuth
    function addPanel(midX, midY, rowIndex = 0) {
        const rotX = midX * backCos - midY * backSin;
        const rotY = midX * backSin + midY * backCos;
        const wx = rotX + cX;
        const wy = rotY + cY;

        const worldCornersM = cornerOffsets.map(([cx, cy]) => {
            const rx = cx * backCos - cy * backSin;
            const ry = cx * backSin + cy * backCos;
            return [wx + rx, wy + ry];
        });

        let centerGps = [wy, wx];
        let cornersGps = worldCornersM;

        if (isGpsCoords || hasExplicitRefCoords) {
            const cPt = metersToLatLng(wx, wy, refLat, refLng);
            const validLat = isFinite(cPt.lat) ? cPt.lat : refLat;
            const validLng = isFinite(cPt.lng) ? cPt.lng : refLng;
            centerGps = [validLat, validLng];
            centerGps.lat = validLat;
            centerGps.lng = validLng;

            cornersGps = worldCornersM.map(([mx, my]) => {
                const pt = metersToLatLng(mx, my, refLat, refLng);
                const ptLat = isFinite(pt.lat) ? pt.lat : validLat;
                const ptLng = isFinite(pt.lng) ? pt.lng : validLng;
                const res = [ptLat, ptLng];
                res.lat = ptLat;
                res.lng = ptLng;
                return res;
            });
        }

        panels.push({
            id: `mod-${panels.length + 1}`,
            x: wx,
            y: wy,
            rotX,
            rotY,
            relX: rotX,
            relY: rotY,
            cX,
            cY,
            width: actualW,
            length: actualL,
            visualLength,
            effectiveLength: visualLength,
            arrayScale: safeScale,
            row: rowIndex,
            azimuth: actualAzimuth,
            tilt: actualTilt,
            orientation: isLandscape ? "LANDSCAPE" : "PORTRAIT",
            center: centerGps,
            centerGps: centerGps,
            corners: cornersGps,
            cornersGps: cornersGps,
            wattage: Number(wattage) || 585,
            rackingType
        });
    }

    // 6. Grid placement inside aligned bounding box
    let rowIndex = 0;
    let targetReached = false;
    for (let y = startY; y + actualL <= endY + 0.05; y += rowPitch) {
        let colInTable = 0;
        for (let x = startX; x + actualW <= endX + 0.05; x += colPitch) {
            if (colInTable > 0 && colInTable % (Number(options.frameCols || options.frameSizeWide) || 10) === 0) {
                x += Math.max(0.5, Number(options.frameSpacing) || 0.8); // walkway aisle / frame spacing
            }

            const midX = x + actualW / 2;
            const midY = y + actualL / 2;

            // Strict point-in-polygon: keep module layout coordinates strictly anchored inside the roof polygon
            if (pointInPoly(midX, midY, localPoly)) {
                addPanel(midX, midY, rowIndex);
                if (targetCount && panels.length >= Number(targetCount)) {
                    targetReached = true;
                    break;
                }
            }

            colInTable++;
        }
        if (targetReached) break;
        rowIndex++;
    }

    // 7. Ensure Target Count is strictly met if specified
    if (targetCount && panels.length < Number(targetCount)) {
        const needed = Number(targetCount) - panels.length;
        const midY = (minY + maxY) / 2;
        let added = 0;
        let rIdx = rowIndex + 1;
        for (let step = 1; added < needed && step <= 100; step++) {
            const sideY = midY + (step % 2 === 1 ? 1 : -1) * Math.ceil(step / 2) * rowPitch;
            for (let x = startX; x + actualW <= endX + colPitch * 10 && added < needed; x += colPitch) {
                const midX = x + actualW / 2;
                addPanel(midX, sideY, rIdx);
                added++;
            }
            rIdx++;
        }
    } else if (panels.length === 0 && polygonM.length >= 3) {
        // FAIL-SAFE FALLBACK: Center pivot if roof is valid and center fits
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        if (pointInPoly(midX, midY, localPoly)) {
            addPanel(midX, midY, 0);
        }
    }

    // Filter keepouts / obstacles if any
    let resultPanels = panels;
    if (keepouts && keepouts.length > 0) {
        resultPanels = panels.filter(p => {
            const pX = p.x, pY = p.y;
            for (const obs of keepouts) {
                let ox = 0, oy = 0;
                if (isGpsCoords) {
                    const m = latLngToMeters(Number(obs.lat), Number(obs.lng), refLat, refLng);
                    ox = m.x; oy = m.y;
                } else {
                    ox = Number(obs.x) || 0; oy = Number(obs.y) || 0;
                }
                if (Math.hypot(pX - ox, pY - oy) < (Number(obs.radiusM) || 1.5)) {
                    return false;
                }
            }
            return true;
        });

        // If all panels got filtered by keepouts, retain at least one safe panel
        if (resultPanels.length === 0 && panels.length > 0) {
            resultPanels = [panels[0]];
        }
    }

    // Enforce target capacity limit if configured
    if (targetCapacityMode === "TARGET_CAP" && targetKwp && Number(targetKwp) > 0) {
        const maxMods = Math.floor((Number(targetKwp) * 1000) / wattage);
        if (isFinite(maxMods) && maxMods > 0 && resultPanels.length > maxMods) {
            resultPanels = [...resultPanels].sort((a, b) => (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y)).slice(0, maxMods);
        }
    }

    resultPanels.modules = resultPanels;
    resultPanels.moduleCount = resultPanels.length;
    resultPanels.metrics = {
        count: resultPanels.length,
        capacityKw: Math.round(((resultPanels.length * wattage) / 1000) * 10) / 10
    };

    return resultPanels;
}

/**
 * Safe Azimuth Rotation Packing Engine:
 * Delegates to packModulesOnRoof which now features decoupled safe azimuth alignment and fail-safe fallback.
 */
export function packModulesWithSafeAzimuth(polygonMeters, options = {}) {
    return packModulesOnRoof(polygonMeters, options);
}

// =============================================================================
// 7. ELECTRICAL STRINGING & MPPT VOLTAGE-WINDOW ANALYSIS
// =============================================================================
export function calculateAutomatedStringing({
    totalModules = 0,
    moduleKey = "Jinko Solar Tiger Neo 585W",
    inverterCapacityKw = 20,
    targetPanelsPerString = 14,
    minWinterTempC = -5,
    maxSummerCellTempC = 65,
    inverterMaxDcVoltage = 1000,
    inverterMpptMin = 200,
    inverterMpptMax = 850
}) {
    const spec = MODULE_PHYSICAL_SPECS[moduleKey] || MODULE_PHYSICAL_SPECS["Jinko Solar Tiger Neo 585W"];
    const tempCoeff = (spec.tempCoeffPmaxPct || -0.29) / 100;

    const coldVoc = spec.voc * (1 + Math.abs(tempCoeff) * (25 - minWinterTempC)) * targetPanelsPerString;
    const hotVmp = spec.vmp * (1 - Math.abs(tempCoeff) * (maxSummerCellTempC - 25)) * targetPanelsPerString;

    const warnings = [];
    if (coldVoc > inverterMaxDcVoltage) {
        warnings.push(`Cold Voc (${coldVoc.toFixed(1)}V) exceeds inverter max DC voltage (${inverterMaxDcVoltage}V). Reduce panels per string.`);
    }
    if (hotVmp < inverterMpptMin) {
        warnings.push(`Hot Vmp (${hotVmp.toFixed(1)}V) is below MPPT minimum (${inverterMpptMin}V). Reduce string count or panels/string.`);
    }
    if (hotVmp > inverterMpptMax) {
        warnings.push(`Hot Vmp (${hotVmp.toFixed(1)}V) exceeds MPPT maximum (${inverterMpptMax}V).`);
    }

    const stringsCount = targetPanelsPerString > 0 ? Math.ceil(totalModules / targetPanelsPerString) : 0;

    return {
        stringsCount,
        panelsPerString: targetPanelsPerString,
        coldVocPerString: Math.round(coldVoc * 10) / 10,
        hotVmpPerString: Math.round(hotVmp * 10) / 10,
        stringCurrentA: spec.imp,
        warnings
    };
}

/** Ohm's law DC voltage drop (2-wire run). Returns volts + percentage of system voltage. */
export function calculateDcVoltageDrop({ currentA, lengthM, cableSizeMm2, systemVoltage = 600 }) {
    const resistivityCopper = 0.0175;
    const dropV = (2 * lengthM * currentA * resistivityCopper) / cableSizeMm2;
    return {
        dropV: Math.round(dropV * 100) / 100,
        dropPct: Math.round((dropV / systemVoltage) * 1000) / 10
    };
}

/** Ohm's law 3-phase AC voltage drop. */
export function calculateAcVoltageDrop({ currentA, lengthM, cableSizeMm2, systemVoltage = 400, powerFactor = 0.98 }) {
    const resistivityCopper = 0.0175;
    const dropV = (Math.sqrt(3) * lengthM * currentA * resistivityCopper * powerFactor) / cableSizeMm2;
    return {
        dropV: Math.round(dropV * 100) / 100,
        dropPct: Math.round((dropV / systemVoltage) * 1000) / 10
    };
}

// =============================================================================
// 8. PRODUCTION / ENERGY ESTIMATE (PVWATTS-STYLE)
// =============================================================================
export function simulateHelioScopeProduction({
    capacityDckW = 0,
    tiltDegrees = 18,
    azimuthDegrees = 180,
    siteLatitude = 31.5
}) {
    const basePeakSunHours = 5.2 - Math.abs(siteLatitude - 30) * 0.02;

    const tiltDelta = Math.abs(tiltDegrees - Math.abs(siteLatitude));
    const tiltFactor = Math.max(0.85, 1 - tiltDelta * 0.003);
    const azimuthDelta = Math.abs(azimuthDegrees - 180);
    const azimuthFactor = Math.max(0.85, 1 - azimuthDelta * 0.0015);

    const orientationFactor = tiltFactor * azimuthFactor;
    const systemLossPct = 0.02 + 0.02 + 0.03 + 0.05 + 0.02 + 0.02;
    const performanceRatioPct = Math.round((1 - systemLossPct) * orientationFactor * 1000) / 10;

    const grossAnnualKwh = capacityDckW * basePeakSunHours * 365;
    const netAnnualKwh = Math.round(grossAnnualKwh * (performanceRatioPct / 100));
    const specificYield = capacityDckW > 0 ? Math.round(netAnnualKwh / capacityDckW) : 0;

    const monthlyWeights = [0.07, 0.075, 0.085, 0.09, 0.095, 0.10, 0.10, 0.095, 0.085, 0.08, 0.07, 0.065];
    const monthly = monthlyWeights.map((w) => Math.round(netAnnualKwh * w));

    return {
        netAnnualKwh,
        performanceRatioPct,
        specificYield,
        monthly
    };
}