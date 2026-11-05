import * as THREE from "three";
import { calculateSolarPosition, packModulesOnRoof } from "./helioscopeEngine.js";
import { fetchSurroundingBuildingsOSM } from "./osmBuildingService.js";

// =============================================================================
// 1. SKY DOME & ATMOSPHERE SETUP (Clean Dynamic Hemispherical Sky Gradient + Sun)
// =============================================================================
export function createDynamicSkyAndSun(scene) {
  // Hemispherical Sky Gradient Shader (Z-up coordinate space)
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;
  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      // In this scene Z is UP: normalize height from ground z=0 to sky zenith
      float h = normalize(vWorldPosition + vec3(0.0, 0.0, offset)).z;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `;

  const skyUniforms = {
    topColor: { value: new THREE.Color(0x38bdf8) },    // Clear Day Sky Blue
    bottomColor: { value: new THREE.Color(0xf1f5f9) }, // Horizon haze
    offset: { value: 33.0 },
    exponent: { value: 0.6 }
  };

  const skyGeo = new THREE.SphereGeometry(800, 32, 15);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);

  // 2. VISIBLE GLOWING SUN SPHERE
  const sunGeo = new THREE.SphereGeometry(18, 16, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff7ed });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  scene.add(sunMesh);

  // Sun Glow Halo
  const haloGeo = new THREE.SphereGeometry(28, 16, 16);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.45,
    side: THREE.BackSide
  });
  sunMesh.add(new THREE.Mesh(haloGeo, haloMat));

  // Outer Corona Glow
  const coronaGeo = new THREE.SphereGeometry(45, 16, 16);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide
  });
  sunMesh.add(new THREE.Mesh(coronaGeo, coronaMat));

  // (Removed oversized white spherical cloud blobs to keep ground and site 100% clean)

  return { skyUniforms, sunMesh, skyMesh };
}

// =============================================================================
// 2. TIME SLIDER TO SUN POSITION & SKY DOME LIGHTING SYNC
// =============================================================================
export function updateSunPositionFromHour(solarHour, sunMesh, dirLight, skyUniforms, siteLatitude = 31.5) {
  // Astronomical position on Winter Solstice (Day 355)
  const pos = calculateSolarPosition(siteLatitude, 355, solarHour);
  const elevRad = (Math.max(3, pos.elevationDeg) * Math.PI) / 180;
  const azRad = (pos.azimuthDeg * Math.PI) / 180;

  // Sun sphere in the sky dome (distance 550m inside 800m dome)
  const sunDistance = 550;
  const sunX = sunDistance * Math.cos(elevRad) * Math.sin(azRad);
  const sunY = -sunDistance * Math.cos(elevRad) * Math.cos(azRad);
  const sunZ = sunDistance * Math.sin(elevRad);

  if (sunMesh) {
    sunMesh.position.set(sunX, sunY, Math.max(15, sunZ));
  }

  // Directional light for shadows (distance 140m)
  if (dirLight) {
    const lightDist = 140;
    const lx = lightDist * Math.cos(elevRad) * Math.sin(azRad);
    const ly = -lightDist * Math.cos(elevRad) * Math.cos(azRad);
    const lz = lightDist * Math.sin(elevRad);
    dirLight.position.set(lx, ly, Math.max(10, lz));

    const elevationNorm = Math.sin(elevRad);
    dirLight.intensity = Math.max(0.35, elevationNorm * 2.2);
  }

  // Morning/Evening Golden Hour vs Noon Sky Colors
  if (skyUniforms) {
    if (solarHour < 10.0 || solarHour > 15.5) {
      // Golden Hour / Dusk (9:00 AM or 3:30+ PM)
      skyUniforms.topColor.value.setHex(0x1e293b);    // Dusky twilight blue
      skyUniforms.bottomColor.value.setHex(0xfdba74); // Warm golden-orange horizon
    } else {
      // Crisp daylight blue at Solar Noon (11:00 AM - 2:00 PM)
      skyUniforms.topColor.value.setHex(0x38bdf8);    // Crisp daylight blue
      skyUniforms.bottomColor.value.setHex(0xe2e8f0); // Daylight horizon haze
    }
  }
}

// =============================================================================
// 3. ASLI SATELLITE MAP GROUND TEXTURE (Map snapshot + ESRI Orthophoto overlay)
// =============================================================================
// 1. EXACT 1:1 SATELLITE GROUND ALIGNMENT
export function setupAlignedSatelliteGround(scene, mapInstance, centerLat, centerLng) {
  const existing = scene.getObjectByName("satellite_ground");
  if (existing) scene.remove(existing);

  if (!scene) return null;

  let north, south, east, west;
  let mapCenterLat = centerLat;
  let mapCenterLng = centerLng;

  if (mapInstance && typeof mapInstance.getBounds === "function") {
    try {
      const bounds = mapInstance.getBounds();
      north = bounds.getNorth();
      south = bounds.getSouth();
      east = bounds.getEast();
      west = bounds.getWest();
      const center = mapInstance.getCenter();
      if (center) {
        mapCenterLat = center.lat;
        mapCenterLng = center.lng;
      }
    } catch (e) {
      console.warn("mapInstance bounds error:", e);
    }
  }

  const degPerMeterLat = 1 / 111320;
  const degPerMeterLng = 1 / (111320 * Math.cos(((centerLat || 31.5) * Math.PI) / 180));

  if (!north || !south || !east || !west) {
    const defaultRadius = 150;
    const latDelta = defaultRadius * degPerMeterLat;
    const lngDelta = defaultRadius * degPerMeterLng;
    north = centerLat + latDelta;
    south = centerLat - latDelta;
    east = centerLng + lngDelta;
    west = centerLng - lngDelta;
  }

  // Actual physical width & height of the current map viewport in meters
  const widthMeters = Math.max(60, (east - west) / degPerMeterLng);
  const heightMeters = Math.max(60, (north - south) / degPerMeterLat);

  // Viewport center offset relative to the target roof origin (centerLat, centerLng)
  const offsetX = (mapCenterLng - centerLng) / degPerMeterLng;
  const offsetY = (mapCenterLat - centerLat) / degPerMeterLat;

  // Capture Leaflet tile canvas snapshot if available
  let texture = null;
  const mapCanvas = mapInstance?.getContainer?.()?.querySelector("canvas");
  if (mapCanvas) {
    try {
      texture = new THREE.CanvasTexture(mapCanvas);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
    } catch (e) {
      console.warn("Canvas texture error:", e);
    }
  }

  const groundGeo = new THREE.PlaneGeometry(widthMeters, heightMeters);
  const groundMat = new THREE.MeshStandardMaterial({
    map: texture || null,
    color: texture ? 0xffffff : 0x1e293b,
    roughness: 0.85,
    metalness: 0.1
  });

  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.name = "satellite_ground";
  groundMesh.receiveShadow = true;

  // Position exactly shifted so target roof sits on its satellite counterpart
  groundMesh.position.set(offsetX, offsetY, 0);
  scene.add(groundMesh);

  // High-Res live ESRI Satellite Orthophoto export matching exact viewport bounds
  const esriUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${west},${south},${east},${north}&bboxSR=4326&imageSR=4326&size=1024,1024&format=jpg&f=image`;
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  loader.load(esriUrl, (tex) => {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    groundMat.map = tex;
    groundMat.color.setHex(0xffffff);
    groundMat.needsUpdate = true;
  }, undefined, (err) => {
    console.warn("ESRI satellite ground fallback:", err);
  });

  return groundMesh;
}

export function setupSatelliteGround(scene, mapInstance, boundsRadius = 150, centerLat = 33.6844, centerLng = 73.0479) {
  return setupAlignedSatelliteGround(scene, mapInstance, centerLat, centerLng);
}

// 1. RELIABLE SATELLITE IMAGE CAPTURE ON GROUND
export function renderRealSatelliteFloor(scene, mapInstance, centerLat, centerLng, boundsRadius = 160) {
  const existing = scene.getObjectByName("satellite_ground_plane") || scene.getObjectByName("satellite_ground");
  if (existing) scene.remove(existing);

  if (!scene) return null;

  // Retrieve satellite container or canvas
  let texture = null;
  const container = mapInstance?.getContainer?.();
  const leafletCanvas = container?.querySelector("canvas");

  if (leafletCanvas && leafletCanvas.width > 0 && leafletCanvas.height > 0) {
    try {
      texture = new THREE.CanvasTexture(leafletCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
    } catch (e) {
      console.warn("Canvas capture warning:", e);
    }
  }

  const planeGeo = new THREE.PlaneGeometry(boundsRadius * 2, boundsRadius * 2);
  const planeMat = new THREE.MeshStandardMaterial({
    map: texture || null,
    color: texture ? 0xffffff : 0x0f172a,
    roughness: 0.9,
    metalness: 0.05
  });

  const planeMesh = new THREE.Mesh(planeGeo, planeMat);
  planeMesh.name = "satellite_ground_plane";
  planeMesh.receiveShadow = true;
  planeMesh.position.set(0, 0, 0);
  scene.add(planeMesh);

  // Load high-resolution ESRI satellite imagery covering exact project bounds
  if (centerLat && centerLng) {
    const degPerMeterLat = 1 / 111320;
    const degPerMeterLng = 1 / (111320 * Math.cos(((centerLat || 31.5) * Math.PI) / 180));
    const west = centerLng - boundsRadius * degPerMeterLng;
    const south = centerLat - boundsRadius * degPerMeterLat;
    const east = centerLng + boundsRadius * degPerMeterLng;
    const north = centerLat + boundsRadius * degPerMeterLat;

    const esriUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${west},${south},${east},${north}&bboxSR=4326&imageSR=4326&size=1024,1024&format=jpg&f=image`;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    loader.load(esriUrl, (tex) => {
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      planeMat.map = tex;
      planeMat.color.setHex(0xffffff);
      planeMat.needsUpdate = true;
    }, undefined, (err) => {
      console.warn("ESRI satellite ground fallback:", err);
    });
  }

  return planeMesh;
}

// 2. USER-DEFINED OBSTACLES & NEIGHBORING BUILDINGS TO 3D
export function renderUserObstacles3D(scene, keepouts = [], centerLat, centerLng) {
  const existing = scene.getObjectByName("user_3d_keepouts");
  if (existing) scene.remove(existing);

  if (!scene) return null;

  const group = new THREE.Group();
  group.name = "user_3d_keepouts";

  const degPerMeterLat = 1 / 111320;
  const degPerMeterLng = 1 / (111320 * Math.cos(((centerLat || 31.5) * Math.PI) / 180));

  const obstacleMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Architectural matte concrete
    roughness: 0.7,
    metalness: 0.2
  });

  const edgeMat = new THREE.LineBasicMaterial({ color: 0x334155 });

  (keepouts || []).forEach((obs) => {
    // Polygon keepout (neighbor roof or parapet wall)
    if (Array.isArray(obs.points) && obs.points.length >= 3) {
      const shape = new THREE.Shape();
      obs.points.forEach(([lat, lng], idx) => {
        const x = (lng - centerLng) / degPerMeterLng;
        const y = (lat - centerLat) / degPerMeterLat;
        if (idx === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
      shape.closePath();
      const height = Number(obs.heightM) || 3.0;
      const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      const mesh = new THREE.Mesh(geo, obstacleMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const edges = new THREE.EdgesGeometry(geo);
      mesh.add(new THREE.LineSegments(edges, edgeMat));
      group.add(mesh);
    } else {
      // Circular / point keepout (water tank, AC unit, skylight)
      const lat = obs.lat ?? obs.centerLat ?? (Array.isArray(obs.center) ? obs.center[0] : null);
      const lng = obs.lng ?? obs.centerLng ?? (Array.isArray(obs.center) ? obs.center[1] : null);
      if (lat != null && lng != null) {
        const ox = (lng - centerLng) / degPerMeterLng;
        const oy = (lat - centerLat) / degPerMeterLat;
        const radius = Number(obs.radiusM) || Number(obs.radius) || 1.5;
        const height = Number(obs.heightM) || Number(obs.height) || 3.0;

        const geo = new THREE.CylinderGeometry(radius, radius, height, 16);
        geo.rotateX(Math.PI / 2); // align with Z-up axis

        const mesh = new THREE.Mesh(geo, obstacleMat);
        mesh.position.set(ox, oy, height / 2);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const edges = new THREE.EdgesGeometry(geo);
        mesh.add(new THREE.LineSegments(edges, edgeMat));
        group.add(mesh);
      }
    }
  });

  scene.add(group);
  return group;
}

// =============================================================================
// 4. USER KE DRAW KIYE HUAY ROOF KA ASLI 3D GHAR (EXTRUDED BUILDING)
// =============================================================================
export function renderTargetHouseBuilding(
  scene,
  roofPolygon,
  centerLat,
  centerLng,
  roofHeight = 6.0,
  isHeatmapMode = false,
  heatmapTexture = null
) {
  const existing = scene.getObjectByName("target_house_building");
  if (existing) scene.remove(existing);

  // STRICT CAD LOGIC: If no real user-drawn roofPolygon exists, do not render any building box!
  if (!roofPolygon || !Array.isArray(roofPolygon) || roofPolygon.length < 3) {
    return null;
  }

  const poly = roofPolygon;

  const degPerMeterLat = 1 / 111320;
  const degPerMeterLng = 1 / (111320 * Math.cos((centerLat * Math.PI) / 180));

  const shape = new THREE.Shape();
  poly.forEach(([lat, lng], idx) => {
    const x = (lng - centerLng) / degPerMeterLng;
    const y = (lat - centerLat) / degPerMeterLat;
    if (idx === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  // Asli ghar ki deewaren aur chhat
  const houseGeo = new THREE.ExtrudeGeometry(shape, {
    depth: roofHeight,
    bevelEnabled: false
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Clean architectural building wall
    roughness: 0.7,
    metalness: 0.1
  });

  let roofMat;
  if (isHeatmapMode && heatmapTexture) {
    roofMat = new THREE.MeshStandardMaterial({
      map: heatmapTexture,
      roughness: 0.4,
      metalness: 0.1
    });
  } else {
    roofMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Clean architectural concrete roof
      roughness: 0.85,
      metalness: 0.1
    });
  }

  const houseMesh = new THREE.Mesh(houseGeo, [roofMat, wallMat]);
  houseMesh.name = "target_house_building";
  houseMesh.castShadow = true;
  houseMesh.receiveShadow = true;

  // Rim line on roof
  const edges = new THREE.EdgesGeometry(houseGeo);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x334155 }));
  houseMesh.add(line);

  scene.add(houseMesh);
  return { houseMesh, poly };
}

// =============================================================================
// 5. SOLAR PANELS + L2 / L3 GALVANIZED STRUCTURE LEGS
// =============================================================================
export function renderSolarArrayWithRacking(
  scene,
  panels,
  centerLat,
  centerLng,
  roofHeight = 6.0,
  rackingType = "L2_ELEVATED",
  tiltDeg = 18,
  azimuthDeg = 180,
  roofPolygon = null,
  siteLatitude = 31.5,
  arrayScale = 1.0
) {
  const existing = scene.getObjectByName("solar_array_3d");
  if (existing) scene.remove(existing);

  const arrayGroup = new THREE.Group();
  arrayGroup.name = "solar_array_3d";

  // ONE single source of truth: only render actual panels from the 2D segment state
  if (!panels || !Array.isArray(panels) || panels.length === 0) {
    scene.add(arrayGroup);
    return { arrayGroup, count: 0 };
  }

  const degPerMeterLat = 1 / 111320;
  const degPerMeterLng = 1 / (111320 * Math.cos((centerLat * Math.PI) / 180));

  // Racking Heights: Flush = 0.15m, L2 = 1.5m, L3 = 2.5m
  let legElevation = 0.15;
  const rTypeStr = String(rackingType || "").toUpperCase();
  if (rTypeStr.includes("L2")) legElevation = 1.5;
  else if (rTypeStr.includes("L3")) legElevation = 2.5;

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Midnight dark monocrystalline wafer
    roughness: 0.2,
    metalness: 0.8
  });

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Galvanized GI steel
    roughness: 0.3,
    metalness: 0.9
  });

  const tiltRad = ((Number(tiltDeg) || 0) * Math.PI) / 180;
  const azRad = (((Number(azimuthDeg) || 180) - 180) * Math.PI) / 180;

  panels.forEach((p) => {
    const cGps = p.centerGps || p.center;
    let cx = 0;
    let cy = 0;

    if (cGps && isFinite(cGps[0]) && isFinite(cGps[1])) {
      cx = (Number(cGps[1]) - centerLng) / degPerMeterLng;
      cy = (Number(cGps[0]) - centerLat) / degPerMeterLat;
    } else if (p.corners && p.corners.length >= 4) {
      let sx = 0, sy = 0;
      p.corners.forEach(([lat, lng]) => {
        sx += (Number(lng) - centerLng) / degPerMeterLng;
        sy += (Number(lat) - centerLat) / degPerMeterLat;
      });
      cx = sx / 4;
      cy = sy / 4;
    }

    const modW = p.width ? (p.width > 10 ? p.width / 1000 : p.width) : 1.096;
    const modL = p.length ? (p.length > 10 ? p.length / 1000 : p.length) : 2.384;

    const pGeo = new THREE.BoxGeometry(modW, modL, 0.04);
    const pMesh = new THREE.Mesh(pGeo, panelMat);
    pMesh.position.set(cx, cy, roofHeight + legElevation);
    const modAz = p.azimuth !== undefined ? (((Number(p.azimuth) - 180) * Math.PI) / 180) : azRad;
    const modTilt = p.tilt !== undefined ? ((Number(p.tilt) * Math.PI) / 180) : tiltRad;
    pMesh.rotation.z = -modAz;
    pMesh.rotation.x = modTilt;
    pMesh.castShadow = true;
    pMesh.receiveShadow = true;
    arrayGroup.add(pMesh);

    // 4 Corner Mounting Pillars
    if (legElevation > 0.3) {
      const cosA = Math.cos(-modAz);
      const sinA = Math.sin(-modAz);
      const halfW = modW * 0.45;
      const halfL = modL * 0.45;
      const legOffsets = [
        [-halfW, -halfL],
        [halfW, -halfL],
        [halfW, halfL],
        [-halfW, halfL]
      ];
      legOffsets.forEach(([ox, oy]) => {
        const lx = cx + ox * cosA - oy * sinA;
        const ly = cy + ox * sinA + oy * cosA;
        const legGeo = new THREE.CylinderGeometry(0.025, 0.025, legElevation, 8);
        legGeo.rotateX(Math.PI / 2);
        const legMesh = new THREE.Mesh(legGeo, legMat);
        legMesh.position.set(lx, ly, roofHeight + legElevation / 2);
        legMesh.castShadow = true;
        legMesh.receiveShadow = true;
        arrayGroup.add(legMesh);
      });
    }
  });

  // Scale array group uniformly around its center
  const effScale = Number(arrayScale) || 1.0;
  if (effScale > 0) {
    arrayGroup.scale.setScalar(effScale);
  }

  scene.add(arrayGroup);
  return { arrayGroup, count: panels.length };
}

// =============================================================================
// 6. ACCURATE OSM BUILDINGS EXTRUSION (Z-UP COORDINATES)
// =============================================================================
export function addAlignedOSMBuildings(scene, buildingsData, targetBuildingId = null) {
  const existing = scene.getObjectByName("real_surrounding_buildings");
  if (existing) scene.remove(existing);

  const buildingGroup = new THREE.Group();
  buildingGroup.name = "real_surrounding_buildings";

  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Architectural matte grey
    roughness: 0.75,
    metalness: 0.15,
    transparent: true,
    opacity: 0.9
  });

  const edgeMat = new THREE.LineBasicMaterial({ color: 0x334155 });

  (buildingsData || []).forEach((b) => {
    // Target building alag se render hoti hai, use surrounding list se skip karein
    if (targetBuildingId && b.id === targetBuildingId) return;

    try {
      const shape = new THREE.Shape();
      b.points.forEach(([x, y], idx) => {
        // Direct local meter mapping
        if (idx === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
      shape.closePath();

      const extrudeSettings = {
        depth: b.heightM,
        bevelEnabled: false
      };

      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mesh = new THREE.Mesh(geo, buildingMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Crisp top outline for architectural clarity
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, edgeMat);
      mesh.add(line);

      buildingGroup.add(mesh);
    } catch (e) {
      // Skip invalid polygon
    }
  });

  scene.add(buildingGroup);
  return buildingGroup;
}

export async function createRealSurroundingBuildings(scene, targetCenterLat, targetCenterLng, targetCenterMeters = { x: 0, y: 0 }) {
  if (!scene) return null;

  let buildingsData = [];
  try {
    buildingsData = await fetchSurroundingBuildingsOSM(targetCenterLat, targetCenterLng, 200);
  } catch (err) {
    console.warn("[OSM Building Service] Overpass API query fallback:", err);
  }

  return addAlignedOSMBuildings(scene, buildingsData);
}
