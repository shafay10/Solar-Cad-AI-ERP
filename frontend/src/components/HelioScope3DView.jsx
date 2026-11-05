import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Clock, X, Sparkles, Building2 } from "lucide-react";
import { renderSolarArrayWithRacking, renderUserObstacles3D } from "../services/helioscope3DEnvironment.js";
import { calculateSolarPosition } from "../services/helioscopeEngine.js";

/**
 * Generates Photorealistic Tier-1 TOPCon Half-Cut Solar Panel Texture
 */
export function generateHighFidelitySolarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Aluminum Frame
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(0, 0, 512, 1024);

  // Silicon Wafer Interior
  const pad = 12;
  ctx.fillStyle = "#0c1424";
  ctx.fillRect(pad, pad, 512 - pad * 2, 1024 - pad * 2);

  // Half-cut Cells & Busbars
  const cols = 6;
  const rows = 24;
  const innerW = 512 - pad * 2;
  const innerH = 1024 - pad * 2;
  const cellW = innerW / cols;
  const cellH = innerH / rows;

  ctx.strokeStyle = "rgba(226, 232, 240, 0.35)";
  ctx.lineWidth = 1.2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * cellW;
      const y = pad + r * cellH;
      ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // Busbar lines
      ctx.strokeStyle = "rgba(241, 245, 249, 0.2)";
      ctx.lineWidth = 0.8;
      for (let b = 1; b <= 3; b++) {
        const bx = x + (cellW / 4) * b;
        ctx.beginPath();
        ctx.moveTo(bx, y + 2);
        ctx.lineTo(bx, y + cellH - 2);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(226, 232, 240, 0.35)";
      ctx.lineWidth = 1.2;
    }
  }

  // Center Half-Cut Splitter
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(pad, pad + innerH / 2 - 3, innerW, 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
// 100% Transparent CAD Grid Overlay Helper
export function setupCADGridGround(scene) {
  if (!scene) return;
  const existingGround = scene.getObjectByName("cad_ground_plane");
  if (existingGround) scene.remove(existingGround);
  const existingGrid = scene.getObjectByName("cad_grid_helper");
  if (existingGrid) scene.remove(existingGrid);

  const gridHelper = new THREE.GridHelper(600, 60, 0x38bdf8, 0x64748b);
  gridHelper.rotation.x = Math.PI / 2;
  gridHelper.position.set(0, 0, 0.02);
  gridHelper.name = "cad_grid_helper";
  if (gridHelper.material) {
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
  }
  scene.add(gridHelper);
  return gridHelper;
}

export const setupSharpSatelliteGround = (scene) => setupCADGridGround(scene);
export const setupFullExpandedSatelliteGround = (scene) => setupCADGridGround(scene);
export const setupReliableSatelliteGround = (scene) => setupCADGridGround(scene);

/**
 * 3D Interactive Raycaster Drag & Snap to Roof
 */
export function enableArray3DSnapDrag(renderer, scene, camera, controls) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const planeIntersect = new THREE.Vector3();

  let isDragging = false;
  let targetArray = null;
  let dragOffset = new THREE.Vector3();

  const dom = renderer.domElement;

  function onPointerDown(e) {
    if (e.button !== 0) return;
    const rect = dom.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const arrayGroup = scene.getObjectByName("solar_array_3d");
    if (!arrayGroup) return;

    const hits = raycaster.intersectObjects(arrayGroup.children, true);
    if (hits.length > 0) {
      isDragging = true;
      targetArray = arrayGroup;
      controls.enabled = false;
      dragPlane.constant = -targetArray.position.z;
      raycaster.ray.intersectPlane(dragPlane, planeIntersect);
      dragOffset.copy(targetArray.position).sub(planeIntersect);
      dom.style.cursor = "grabbing";
    }
  }

  function onPointerMove(e) {
    const rect = dom.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (!isDragging || !targetArray) {
      const arrayGroup = scene.getObjectByName("solar_array_3d");
      if (arrayGroup && arrayGroup.children.length > 0) {
        const hits = raycaster.intersectObjects(arrayGroup.children, true);
        dom.style.cursor = hits.length > 0 ? "grab" : "default";
      }
      return;
    }

    if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
      targetArray.position.x = planeIntersect.x + dragOffset.x;
      targetArray.position.y = planeIntersect.y + dragOffset.y;
    }
  }

  function onPointerUp() {
    if (isDragging) {
      isDragging = false;
      targetArray = null;
      controls.enabled = true;
      dom.style.cursor = "default";
    }
  }

  dom.addEventListener("pointerdown", onPointerDown);
  dom.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  return () => {
    dom.removeEventListener("pointerdown", onPointerDown);
    dom.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };
}

export default function HelioScope3DView({
  mapInstance,
  roofPolygon = [],
  keepouts = [],
  panels = [],
  tiltDegrees = 18,
  azimuthDegrees = 180,
  arrayScale = 1.0,
  onScaleChange,
  initialSolarHour = 12.0,
  siteLatitude = 33.6844,
  siteLongitude = 73.0479,
  onClose,
  systemStats = { modulesCount: 0, kwp: 0 },
  rackingType: propRackingType,
  isEmbedded = false,
  onAzimuthChange
}) {
  const mountRef = useRef(null);
  const [solarHour, setSolarHour] = useState(initialSolarHour);
  const [buildingHeightM, setBuildingHeightM] = useState(6.0);
  const [isHeatmapMode, setIsHeatmapMode] = useState(true);

  const normalizeRacking = (type) => {
    if (!type) return "L2_ELEVATED";
    const t = String(type).toUpperCase();
    if (t.includes("FLUSH")) return "FLUSH_MOUNT";
    if (t.includes("L3")) return "L3_ELEVATED";
    return "L2_ELEVATED";
  };

  const [rackingType, setRackingType] = useState(() => normalizeRacking(propRackingType));

  useEffect(() => {
    if (propRackingType) setRackingType(normalizeRacking(propRackingType));
  }, [propRackingType]);

  const [livePanelCount, setLivePanelCount] = useState(panels?.length || systemStats.modulesCount || 0);
  const [arrayRotation, setArrayRotation] = useState(azimuthDegrees || 180);

  useEffect(() => {
    if (azimuthDegrees !== undefined && !isNaN(azimuthDegrees)) {
      setArrayRotation(azimuthDegrees);
    }
  }, [azimuthDegrees]);

  useEffect(() => {
    setLivePanelCount(panels ? panels.length : 0);
  }, [panels]);

  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const sunLightRef = useRef(null);

  const handleRotationChange = (newDeg) => {
    setArrayRotation(newDeg);
    if (typeof onAzimuthChange === "function") onAzimuthChange(newDeg);
  };

  // Keyboard Shortcuts: R to rotate, +/- to scale
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "r" || e.key === "R") {
        setArrayRotation((prev) => {
          const next = (prev + 15) % 360;
          handleRotationChange(next);
          return next;
        });
      } else if (e.key === "+" || e.key === "=") {
        if (typeof onScaleChange === "function") {
          onScaleChange((prev) => Math.min(3.0, Number((prev + 0.1).toFixed(2))));
        }
      } else if (e.key === "-" || e.key === "_") {
        if (typeof onScaleChange === "function") {
          onScaleChange((prev) => Math.max(0.1, Number((prev - 0.1).toFixed(2))));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScaleChange]);

  const centroid = React.useMemo(() => {
    if (Array.isArray(panels) && panels.length > 0) {
      let sumLat = 0, sumLng = 0, validCount = 0;
      panels.forEach(p => {
        const c = p.centerGps || p.center;
        if (c && isFinite(c[0]) && isFinite(c[1])) {
          sumLat += Number(c[0]);
          sumLng += Number(c[1]);
          validCount++;
        }
      });
      if (validCount > 0) {
        return { lat: sumLat / validCount, lng: sumLng / validCount };
      }
    }
    if (Array.isArray(roofPolygon) && roofPolygon.length >= 3) {
      let sumLat = 0, sumLng = 0;
      roofPolygon.forEach(([lat, lng]) => {
        sumLat += Number(lat);
        sumLng += Number(lng);
      });
      return { lat: sumLat / roofPolygon.length, lng: sumLng / roofPolygon.length };
    }
    return { lat: Number(siteLatitude) || 33.6844, lng: Number(siteLongitude) || 73.0479 };
  }, [panels, roofPolygon, siteLatitude, siteLongitude]);

  // Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    // Scene background ko null rakhein taake 2D satellite map piche wazeh nazar aaye
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 3000);
    camera.up.set(0, 0, 1);
    camera.position.set(0, -45, 35);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // 100% Transparent
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.minDistance = 2;
    controls.maxDistance = 1200;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Direct sun positioning from solar hour
    const phi = ((solarHour - 6) / 12) * Math.PI;
    sunLight.position.set(Math.cos(phi) * 80, -Math.sin(phi) * 40, Math.sin(phi) * 80);

    // Transparent CAD Ground Grid
    setupCADGridGround(scene);

    // Enable Snap/Drag Raycasting
    const cleanupDrag = enableArray3DSnapDrag(renderer, scene, camera, controls);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cleanupDrag();
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Directional Sun Light on Hour change
  // FIX: Ensure accurate sun position based on solar hour and site latitude
  useEffect(() => {
    if (!sunLightRef.current) return;
    
    // Calculate accurate sun position using NOAA algorithm
    const sunPos = calculateSolarPosition(siteLatitude, 172, solarHour); // Summer solstice (day 172) for maximum shadows
    
    // Convert azimuth and elevation to 3D coordinates
    const elevRad = (sunPos.elevationDeg * Math.PI) / 180;
    const azimRad = ((sunPos.azimuthDeg - 180) * Math.PI) / 180; // Adjust for Three.js coordinate system
    
    const sunDistance = 100;
    const sunX = Math.cos(azimRad) * Math.cos(elevRad) * sunDistance;
    const sunY = Math.sin(azimRad) * Math.cos(elevRad) * sunDistance;
    const sunZ = Math.sin(elevRad) * sunDistance;
    
    sunLightRef.current.position.set(sunX, sunY, sunZ);
    
    // Adjust shadow camera frustum based on sun position
    if (sunLightRef.current.shadow && sunLightRef.current.shadow.camera) {
      const shadowCam = sunLightRef.current.shadow.camera;
      shadowCam.position.copy(sunLightRef.current.position);
      shadowCam.lookAt(0, 0, buildingHeightM);
    }
  }, [solarHour, siteLatitude]);

  // Render Solar Array Modules — panels strictly from the 2D segment (no dummy fallback)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const existing = scene.getObjectByName("solar_array_3d");
    if (existing) scene.remove(existing);

    if (!panels || panels.length === 0) {
      setLivePanelCount(0);
      return;
    }

    setLivePanelCount(panels.length);

    const res = renderSolarArrayWithRacking(
      scene,
      panels,
      centroid.lat,
      centroid.lng,
      buildingHeightM,
      rackingType,
      tiltDegrees,
      azimuthDegrees,
      roofPolygon,
      siteLatitude,
      arrayScale
    );

    if (res && res.count >= 0) setLivePanelCount(res.count);

    // Apply High-Fidelity TOPCon Monocrystalline Wafer Texture
    const solarTex = generateHighFidelitySolarTexture();
    const arrayGroup = scene.getObjectByName("solar_array_3d");
    if (arrayGroup) {
      arrayGroup.scale.setScalar(Number(arrayScale) || 1.0);

      arrayGroup.traverse((child) => {
        if (child.isMesh && child.geometry && child.geometry.type !== "CylinderGeometry") {
          child.material = new THREE.MeshStandardMaterial({
            map: solarTex,
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.6
          });
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [panels, centroid, buildingHeightM, rackingType, tiltDegrees, azimuthDegrees, roofPolygon, siteLatitude, arrayScale]);

  // Synchronize visual array scale live
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const arrayMesh = scene.getObjectByName("solar_array_3d");
    if (arrayMesh) {
      arrayMesh.scale.setScalar(Number(arrayScale) || 1.0);
    }
  }, [arrayScale]);

  // Transparent CAD Ground Grid
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    setupCADGridGround(scene);
  }, []);

  // Obstacles & Keepouts
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    renderUserObstacles3D(scene, keepouts, centroid.lat, centroid.lng);
  }, [keepouts, centroid]);

  const setCameraPreset = (preset) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (preset === "TOP") {
      camera.position.set(0, -0.1, buildingHeightM + 50);
      controls.target.set(0, 0, buildingHeightM);
    } else if (preset === "ISO") {
      camera.position.set(-35, -45, buildingHeightM + 30);
      controls.target.set(0, 0, buildingHeightM);
    } else if (preset === "FRONT") {
      camera.position.set(0, -50, buildingHeightM + 5);
      controls.target.set(0, 0, buildingHeightM);
    }
    controls.update();
  };

  return (
    <div className={`relative w-full h-full bg-transparent overflow-hidden flex flex-col ${isEmbedded ? "" : "rounded-xl border border-slate-300"}`}>
      {/* Top Floating Header HUD */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-3 pointer-events-auto text-white">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              Three.js 3D WebGL Solar Simulation
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                CAD READY
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Elevation: <strong className="text-emerald-400 font-mono">{buildingHeightM}m</strong></span>
              <span>•</span>
              <span>Modules: <strong className="text-emerald-400 font-mono">{livePanelCount} Panels</strong></span>
            </div>
          </div>
        </div>

        {/* Sun Hour Time Slider */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 pointer-events-auto text-xs text-white">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300 font-semibold text-[11px]">Sun Position:</span>
          <input
            type="range"
            min="8.0"
            max="16.5"
            step="0.25"
            value={solarHour}
            onChange={(e) => setSolarHour(parseFloat(e.target.value))}
            className="w-24 accent-amber-500 cursor-pointer"
          />
          <span className="font-mono text-amber-400 font-bold text-[11px] w-12">
            {Math.floor(solarHour)}:{String(Math.round((solarHour % 1) * 60)).padStart(2, "0")}
          </span>
        </div>

        {/* Close Button if Not Embedded */}
        {!isEmbedded && onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl transition shadow-xl pointer-events-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Array Transform Controls (Top-Right HUD) */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2 bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-md p-3.5 rounded-xl text-xs text-white min-w-[210px] pointer-events-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-semibold text-slate-300">
          <span>Array Controls</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
            Interactive
          </span>
        </div>

        {/* Rotation Slider */}
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex justify-between text-slate-400">
            <span>Rotation:</span>
            <span className="font-mono text-emerald-400 font-bold">{arrayRotation}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={arrayRotation}
            onChange={(e) => handleRotationChange(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
        </div>

        {/* Quick Rotation Buttons */}
        <div className="grid grid-cols-4 gap-1 mt-1">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => handleRotationChange(deg)}
              className={`py-1 rounded text-[10px] font-mono border transition cursor-pointer ${arrayRotation === deg
                ? "bg-emerald-600 text-white border-emerald-500 font-bold"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                }`}
            >
              {deg}°
            </button>
          ))}
        </div>

        {/* Scale Controller (Shared with 2D) */}
        <div className="flex flex-col gap-1 mt-1 border-t border-slate-800/80 pt-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Scale (Size only):</span>
            <span className="font-mono text-emerald-400 font-bold">{Math.round((arrayScale || 1.0) * 100)}%</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              type="button"
              onClick={() => onScaleChange && onScaleChange((prev) => Math.max(0.1, Number((prev - 0.1).toFixed(2))))}
              className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-bold cursor-pointer transition text-center"
            >
              - Shrink
            </button>
            <button
              type="button"
              onClick={() => onScaleChange && onScaleChange((prev) => Math.min(3.0, Number((prev + 0.1).toFixed(2))))}
              className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-bold cursor-pointer transition text-center"
            >
              + Enlarge
            </button>
          </div>
        </div>

        {/* Panel Count — read only; count is driven by 2D packing engine */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
          <span className="text-slate-400">Panels:</span>
          <span className="font-mono text-emerald-400 font-bold text-sm">
            {livePanelCount} <span className="text-[10px] text-slate-400 font-normal">modules</span>
          </span>
        </div>

        <div className="text-[9px] text-slate-500 text-center mt-0.5 border-t border-slate-800/60 pt-1">
          Hotkeys: <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-400">R</kbd> Rotate &bull; <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-400">+/-</kbd> Scale
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-3 pointer-events-auto text-xs text-white">
          <span className="text-slate-400 font-bold text-[10px]">Camera:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCameraPreset("ISO")}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-bold cursor-pointer"
            >
              Isometric 45°
            </button>
            <button
              onClick={() => setCameraPreset("TOP")}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-bold cursor-pointer"
            >
              Top Ortho
            </button>
            <button
              onClick={() => setCameraPreset("FRONT")}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-bold cursor-pointer"
            >
              Side Elevation
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <span className="text-slate-400 font-bold text-[10px]">Elevation:</span>
          <input
            type="range"
            min="1.0"
            max="25.0"
            step="0.5"
            value={buildingHeightM}
            onChange={(e) => setBuildingHeightM(parseFloat(e.target.value))}
            className="w-20 accent-emerald-500 cursor-pointer"
          />
          <span className="font-mono text-emerald-400 font-bold text-[10px]">
            {buildingHeightM}m
          </span>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <span className="text-slate-400 font-bold text-[10px]">Racking:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setRackingType("FLUSH_MOUNT")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${rackingType === "FLUSH_MOUNT" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
            >
              Flush
            </button>
            <button
              onClick={() => setRackingType("L2_ELEVATED")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${rackingType === "L2_ELEVATED" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
            >
              L2 (1.5m)
            </button>
            <button
              onClick={() => setRackingType("L3_ELEVATED")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${rackingType === "L3_ELEVATED" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
            >
              L3 (2.5m)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}