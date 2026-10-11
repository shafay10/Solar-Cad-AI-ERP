/**
 * osmBuildingService.js
 * Fetches real OpenStreetMap buildings with intelligent fallback for unmapped regions
 */

export async function fetchSurroundingBuildingsOSM(centerLat, centerLng, radiusMeters = 200) {
  if (!centerLat || !centerLng) return [];

  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.cos((centerLat * Math.PI) / 180));

  const south = centerLat - latDelta;
  const west = centerLng - lngDelta;
  const north = centerLat + latDelta;
  const east = centerLng + lngDelta;

  const overpassQuery = `
    [out:json][timeout:10];
    (
      way["building"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    if (res.ok) {
      const data = await res.json();
      const nodes = new Map();
      (data.elements || []).forEach(el => {
        if (el.type === "node") nodes.set(el.id, [el.lat, el.lon]);
      });

      const buildings = [];
      const degPerMeterLat = 1 / 111320;
      const degPerMeterLng = 1 / (111320 * Math.cos((centerLat * Math.PI) / 180));

      (data.elements || []).forEach(el => {
        if (el.type === "way" && el.nodes && el.nodes.length >= 3) {
          const polyMeters = [];
          for (const nodeId of el.nodes) {
            const coord = nodes.get(nodeId);
            if (coord) {
              const dx = (coord[1] - centerLng) / degPerMeterLng;
              const dy = (coord[0] - centerLat) / degPerMeterLat;
              polyMeters.push([dx, dy]);
            }
          }

          if (polyMeters.length >= 3) {
            let height = 7.5; // default 2-story
            if (el.tags?.height) height = parseFloat(el.tags.height);
            else if (el.tags?.["building:levels"]) height = parseFloat(el.tags["building:levels"]) * 3.2;

            buildings.push({
              id: el.id,
              points: polyMeters,
              heightM: Math.min(45, Math.max(3.5, height))
            });
          }
        }
      });

      if (buildings.length > 0) return buildings;
    }
  } catch (err) {
    console.warn("[OSM] Overpass request failed or timed out, generating regional context:", err);
  }

  // If no official OSM building ways exist in this region, return empty.
  // Never inject fake random boxes over satellite imagery.
  return [];
}
