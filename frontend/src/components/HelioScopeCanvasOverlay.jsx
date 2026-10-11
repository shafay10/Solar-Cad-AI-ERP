import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
if (typeof window !== "undefined") { window.L = L; globalThis.L = L; }
import {
  renderHelioScopeModules,
  packModulesOnRoof,
  calculateWinterShadowSpacing,
  calculateSolarPosition,
  latLngToMeters,
  metersToLatLng,
  calculateCentroid,
  MODULE_PHYSICAL_SPECS
} from "../services/helioscopeEngine.js";

/**
 * HelioScopeCanvasOverlay
 * Production-Grade 60 FPS HTML5 Vector CAD Engine for Solar Arrays.
 * Implements:
 *   1. HelioScope Field Segment Workflow: Click points to outline roof, yellow boundary with anchor handles,
 *      snaps to close, and immediately auto-fills the polygon with packed modules (Ray-Casting layout).
 *   2. Right-Click Edge Alignment: Right-click any polygon edge to open "Align modules to this edge" context menu.
 *   3. Dynamic Inter-row Winter Solstice shadow pitch calculation.
 *   4. High-efficiency photorealistic Tier-1 Monocrystalline Half-Cut Cell rendering with silver frame, busbars & glass reflection.
 *   5. Hard Map Lock during drawing modes.
 *   6. Draggable Array Anchor Gizmo with (ΔX, ΔY) offset positioning.
 *   7. Target Capacity (kWp) Cap limiting module packing.
 *   ★ 8. NEW: Azimuth Quick Presets (0-270°), Array Lock (drag protect), Move Mode toggle,
 *      Tilt-linked AUTO Shadow Pitch (winter solstice), Electrical overlay wattage-accurate inverter qty.
 */
/**
 * Renders physical mounting structure underneath each module row / module based on rackingType:
 * - FLUSH_MOUNT: Short flat base rails underneath panels with thin shadow lines.
 * - L2_ELEVATED (1.5m): Vertical galvanized iron legs (silver pillars #94a3b8) dropping 1.5m downward with visible diagonal bracing struts, foundation base plate footings (#1e293b), and footing shadows.
 * - L3_ELEVATED (2.5m): Taller heavy-duty gazebo/shed columns (2.5m clearance) with double cross-beams and X bracing underneath panels.
 */
function renderRackingUnderneath(ctx, cornersPx, rackingType, showShadows) {
  if (!ctx || !cornersPx || cornersPx.length < 4) return;
  try {
    const norm = String(rackingType || "").toUpperCase();
    const isL3 = norm.includes("L3");
    const isL2 = norm.includes("L2") && !isL3;
    const isFlush = !isL2 && !isL3;

    // Calculate pixel scale (pixels per meter based on standard ~1.13m portrait width or ~2.28m length)
    const edge01 = Math.hypot(cornersPx[1].x - cornersPx[0].x, cornersPx[1].y - cornersPx[0].y);
    const edge03 = Math.hypot(cornersPx[3].x - cornersPx[0].x, cornersPx[3].y - cornersPx[0].y);
    const minDim = Math.min(edge01, edge03);
    const scalePx = Math.max(6, minDim / 1.13);

    if (isFlush) {
      // -------------------------------------------------------------
      // FLUSH MOUNT: Flat base mounting rails with thin shadow lines
      // -------------------------------------------------------------
      ctx.save();
      ctx.lineCap = "round";

      // Two parallel aluminium rails running underneath
      const r1Start = {
        x: cornersPx[0].x * 0.8 + cornersPx[1].x * 0.2,
        y: cornersPx[0].y * 0.8 + cornersPx[1].y * 0.2
      };
      const r1End = {
        x: cornersPx[3].x * 0.8 + cornersPx[2].x * 0.2,
        y: cornersPx[3].y * 0.8 + cornersPx[2].y * 0.2
      };
      const r2Start = {
        x: cornersPx[0].x * 0.2 + cornersPx[1].x * 0.8,
        y: cornersPx[0].y * 0.2 + cornersPx[1].y * 0.8
      };
      const r2End = {
        x: cornersPx[3].x * 0.2 + cornersPx[2].x * 0.8,
        y: cornersPx[3].y * 0.2 + cornersPx[2].y * 0.8
      };

      // Thin shadow under rails
      ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(r1Start.x + 1, r1Start.y + 1);
      ctx.lineTo(r1End.x + 1, r1End.y + 1);
      ctx.moveTo(r2Start.x + 1, r2Start.y + 1);
      ctx.lineTo(r2End.x + 1, r2End.y + 1);
      ctx.stroke();

      // Aluminum mounting rail (silver/slate)
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(r1Start.x, r1Start.y);
      ctx.lineTo(r1End.x, r1End.y);
      ctx.moveTo(r2Start.x, r2Start.y);
      ctx.lineTo(r2End.x, r2End.y);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // -------------------------------------------------------------
    // ELEVATED RACKING (L2: 1.5m / L3: 2.5m)
    // -------------------------------------------------------------
    const heightM = isL3 ? 2.5 : 1.5;
    // For L2_ELEVATED / L3_ELEVATED, render the leg drop straight down along Y-axis without skewing module body
    const legDropPx = Math.min(isL3 ? 22 : 14, Math.max(isL3 ? 8 : 5, heightM * scalePx * 0.18));

    ctx.save();

    // Vertical pillars drop straight down along the Y-axis without skewing the module body
    const pillars = cornersPx.map(p => ({
      topX: p.x,
      topY: p.y,
      baseX: p.x,
      baseY: p.y + legDropPx
    }));

    // 1. Footing ground shadows & Under-table Row Shadow Line
    if (showShadows) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
      pillars.forEach(pil => {
        ctx.beginPath();
        ctx.ellipse(pil.baseX + 1, pil.baseY + 1, isL3 ? 6 : 4.5, isL3 ? 3.5 : 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Shadow line underneath each table row for elevated racking
      ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
      ctx.lineWidth = isL3 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(pillars[0].baseX, pillars[0].baseY);
      ctx.lineTo(pillars[1].baseX, pillars[1].baseY);
      ctx.moveTo(pillars[3].baseX, pillars[3].baseY);
      ctx.lineTo(pillars[2].baseX, pillars[2].baseY);
      ctx.stroke();
    }

    // 2. Foundation Base Plates (Anchored Footings)
    pillars.forEach(pil => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(pil.baseX - (isL3 ? 3.5 : 2.5), pil.baseY - (isL3 ? 3 : 2), isL3 ? 7 : 5, isL3 ? 5 : 4);
      // Silver anchor bolt
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(pil.baseX - 1, pil.baseY - 1, 2, 2);
    });

    // 3. Diagonal Bracing Struts & Cross-Beams
    if (isL3) {
      // L3 HEAVY-DUTY GAZEBO / SHED COLUMNS (2.5m Clearance)
      // Double horizontal cross-beams
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      // Beam 1: Front bottom cross-beam
      ctx.moveTo(pillars[0].baseX, pillars[0].baseY);
      ctx.lineTo(pillars[1].baseX, pillars[1].baseY);
      // Beam 2: Rear bottom cross-beam
      ctx.moveTo(pillars[3].baseX, pillars[3].baseY);
      ctx.lineTo(pillars[2].baseX, pillars[2].baseY);
      // Intermediate girder beam halfway up
      ctx.moveTo(pillars[0].topX, pillars[0].topY + legDropPx * 0.5);
      ctx.lineTo(pillars[1].topX, pillars[1].topY + legDropPx * 0.5);
      ctx.moveTo(pillars[3].topX, pillars[3].topY + legDropPx * 0.5);
      ctx.lineTo(pillars[2].topX, pillars[2].topY + legDropPx * 0.5);
      ctx.stroke();

      // Heavy "X" diagonal bracing between pillars
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pillars[0].topX, pillars[0].topY + legDropPx * 0.2);
      ctx.lineTo(pillars[3].baseX, pillars[3].baseY);
      ctx.moveTo(pillars[3].topX, pillars[3].topY + legDropPx * 0.2);
      ctx.lineTo(pillars[0].baseX, pillars[0].baseY);

      ctx.moveTo(pillars[1].topX, pillars[1].topY + legDropPx * 0.2);
      ctx.lineTo(pillars[2].baseX, pillars[2].baseY);
      ctx.moveTo(pillars[2].topX, pillars[2].topY + legDropPx * 0.2);
      ctx.lineTo(pillars[1].baseX, pillars[1].baseY);
      ctx.stroke();
    } else {
      // L2 ELEVATED (1.5m Clearance): Galvanized Iron Legs with Diagonal Struts
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      // Diagonal brace struts from pillar base to table rafter
      ctx.moveTo(pillars[0].topX, pillars[0].topY + legDropPx * 0.3);
      ctx.lineTo(pillars[3].baseX, pillars[3].baseY);
      ctx.moveTo(pillars[1].topX, pillars[1].topY + legDropPx * 0.3);
      ctx.lineTo(pillars[2].baseX, pillars[2].baseY);

      // Bottom tie rail between pillar bases
      ctx.moveTo(pillars[0].baseX, pillars[0].baseY);
      ctx.lineTo(pillars[3].baseX, pillars[3].baseY);
      ctx.moveTo(pillars[1].baseX, pillars[1].baseY);
      ctx.lineTo(pillars[2].baseX, pillars[2].baseY);
      ctx.stroke();
    }

    // 4. Vertical Galvanized Iron Legs (Pillars dropping downward)
    pillars.forEach(pil => {
      // Outer shadow/edge for 3D metallic feel
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = isL3 ? 3.5 : 2.8;
      ctx.beginPath();
      ctx.moveTo(pil.topX, pil.topY);
      ctx.lineTo(pil.baseX, pil.baseY);
      ctx.stroke();

      // Inner bright galvanized zinc highlight
      ctx.strokeStyle = isL3 ? "#cbd5e1" : "#94a3b8";
      ctx.lineWidth = isL3 ? 2.2 : 1.6;
      ctx.beginPath();
      ctx.moveTo(pil.topX, pil.topY);
      ctx.lineTo(pil.baseX, pil.baseY);
      ctx.stroke();
    });

    ctx.restore();
  } catch (err) {
    console.warn("[HelioScopeCAD] renderRackingUnderneath error:", err);
  }
}

const HelioScopeCanvasOverlay = forwardRef(function HelioScopeCanvasOverlay({
  map,
  activeCadTool = "FIELD_SEGMENT",
  setActiveCadTool,
  selectedModuleKey = "Jinko Solar Tiger Neo 585W",
  orientation = "PORTRAIT",
  tiltDegrees = 18,
  azimuthDegrees = 180,
  setAzimuthDegrees,
  setbackMeters = 0.5,
  solarElevation = 42,
  sunAltitudeDeg = solarElevation,
  solarAzimuth = 180,
  sunAzimuthDeg = solarAzimuth,
  showShadows = true,
  roofPolygon = [],
  setRoofPolygon,
  activePolygon = null,
  clearTrigger = 0,
  keepouts = [],
  onAddObstacle,
  newObstacleRadius = 1.5,
  newObstacleHeight = 2.0,
  onArrayCalculated,
  removedModuleIds = new Set(),
  onToggleModule,
  isLocked = false,
  siteLatitude = 31.5,
  targetCapacityMode = "AUTO_FIT",
  targetKwp = 35,
  targetKwP = targetKwp,
  gridOffset = { x: 0, y: 0 },
  setGridOffset,
  isAdjustingPosition = false,
  setIsAdjustingPosition,
  rowSpacing = 0.65,
  shadowPitch = null,
  arrayScale = 1.0,
  colSpacing = 0.025,
  frameSizeUp = 1,
  frameSizeWide = 1,
  frameSpacing = 0,
  gridAlignment = "CENTER",
  showElectricalLayer = false,
  inverterModel = "Huawei SUN2000-100KTL-M2",
  inverterCapacityKw = 100,
  targetStringSize = 20,
  activeDrawingPoints = [],
  setActiveDrawingPoints = null,
  onUndoLastPoint = null,
  onClearDrawing = null,
  rackingType = "L2_ELEVATED"
}, ref) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const isDrawScheduledRef = useRef(false);
  const drawSceneRef = useRef(null);
  const [placedPanels, setPlacedPanels] = useState([]);

  // ★ NEW: Local Lock / Move / Pitch-mode toggles (parent props ke sath combine hote hain)
  const [localLock, setLocalLock] = useState(false);
  const [localMove, setLocalMove] = useState(false);
  const [pitchAuto, setPitchAuto] = useState(true); // true = winter-shadow AUTO pitch (tilt-linked)

  // Top-Level Hoisted Redraw Dispatcher (Safe from Temporal Dead Zone / TDZ errors)
  const requestRedraw = useCallback(() => {
    if (isDrawScheduledRef.current) return;
    isDrawScheduledRef.current = true;
    animFrameRef.current = requestAnimationFrame(() => {
      isDrawScheduledRef.current = false;
      if (drawSceneRef.current) {
        drawSceneRef.current();
      }
    });
  }, []);

  useImperativeHandle(ref, () => ({
    clearAll: () => {
      activePolyPointsRef.current = [];
      p1Ref.current = null;
      panelsRef.current = [];
      setPlacedPanels([]);
      if (cachedPanelsRef && cachedPanelsRef.current) {
        cachedPanelsRef.current = [];
      }
      if (modulesLayerRef.current && map) {
        try {
          map.removeLayer(modulesLayerRef.current);
          modulesLayerRef.current = null;
        } catch (e) { }
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      requestRedraw();
    },
    requestRedraw: () => {
      requestRedraw();
    },
    undoPoint: () => {
      if (activePolyPointsRef.current && activePolyPointsRef.current.length > 0) {
        activePolyPointsRef.current = activePolyPointsRef.current.slice(0, -1);
        requestRedraw();
      }
    }
  }), [map, requestRedraw]);

  const renderCanvas = useCallback(() => {
    if (drawSceneRef.current) {
      drawSceneRef.current();
    }
    requestRedraw();
  }, [requestRedraw]);

  // Drawing & Mouse State stored strictly in Refs (ZERO setState inside mousemove)
  const p1Ref = useRef(null); // { lat, lng } for ROOF_BOX
  const mousePosPxRef = useRef(null); // { x, y }
  const mouseGpsRef = useRef(null); // { lat, lng }
  const panelsRef = useRef([]); // Cached calculated panels
  const cachedPanelsRef = useRef([]); // Persistent fallback cache preventing mid-drag/slider flicker
  window.__helioScopePanelsRef = panelsRef;

  // Keep persistent cache ref updated with latest valid panels
  useEffect(() => {
    const current = (panelsRef.current && panelsRef.current.length > 0) ? panelsRef.current : placedPanels;
    if (Array.isArray(current) && current.length > 0) {
      cachedPanelsRef.current = current;
    }
  }, [placedPanels]);

  const modulesLayerRef = useRef(null); // Dedicated Leaflet SVG layer on solarModulesPane (zIndex 650)
  const boundsRef = useRef(null);
  const hoveredModuleIdRef = useRef(null);
  const isDraggingMapRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Draggable Array Anchor Gizmo & Direct Mouse Drag Refs
  const anchorPxRef = useRef(null);
  const nativeAnchorMarkerRef = useRef(null);
  const runModulePackingRef = useRef(null);
  const isDraggingAnchorRef = useRef(false);
  const isHoveringAnchorRef = useRef(false);
  const gridOffsetRef = useRef(gridOffset);
  useEffect(() => {
    gridOffsetRef.current = gridOffset;
  }, [gridOffset]);

  // Direct Mouse Drag & Drop for Solar Arrays (Real-Time Translation)
  const arrayBboxPxRef = useRef(null);
  const isDraggingArrayRef = useRef(false);
  const isHoveringArrayRef = useRef(false);
  const dragStartMouseGpsRef = useRef(null); // { lat, lng }
  const dragStartScreenPxRef = useRef({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });
  const dragDeltaGpsRef = useRef({ lat: 0, lng: 0 });
  const dragDeltaMetersRef = useRef({ x: 0, y: 0 });

  // Interactive CAD Boundary Lines (Grid / Graph Edges) & Edge / Vertex Dragging
  const activePolyDragRef = useRef(null);
  const hoveredEdgeIndexRef = useRef(-1);
  const isDraggingEdgeRef = useRef(false);
  const draggedEdgeIndexRef = useRef(-1);
  const hoveredVertexIndexRef = useRef(-1);
  const isDraggingVertexRef = useRef(false);
  const draggedVertexIndexRef = useRef(-1);
  const dragStartRoofPolyRef = useRef(null);

  // Active Field Segment Drawing Points (in-progress polygon vertices)
  const activePolyPointsRef = useRef([]);
  const [isNearFirstPoint, setIsNearFirstPoint] = useState(false);

  // Sync in-progress drawing points with parent controller
  useEffect(() => {
    if (Array.isArray(activeDrawingPoints)) {
      activePolyPointsRef.current = activeDrawingPoints;
      requestRedraw();
    }
  }, [activeDrawingPoints, requestRedraw]);

  // Clean up drawing points and panels when roof polygon is reset, cleared, or clearTrigger changes
  const prevClearTriggerRef = useRef(clearTrigger);
  useEffect(() => {
    const isClearAction = clearTrigger > prevClearTriggerRef.current;
    prevClearTriggerRef.current = clearTrigger;

    if (!roofPolygon || roofPolygon.length < 3 || isClearAction) {
      activePolyPointsRef.current = [];
      p1Ref.current = null;
      panelsRef.current = [];
      setPlacedPanels([]);
      if (cachedPanelsRef && cachedPanelsRef.current) {
        cachedPanelsRef.current = [];
      }
      if (modulesLayerRef.current && map) {
        try {
          map.removeLayer(modulesLayerRef.current);
          modulesLayerRef.current = null;
        } catch (e) { }
      }
      if (setActiveDrawingPoints) setActiveDrawingPoints([]);
      if (typeof requestRedraw === "function") requestRedraw();
    }
  }, [roofPolygon, clearTrigger, map, setActiveDrawingPoints, requestRedraw]);

  // Explicit Clear All: when user clicks "Clear All", explicitly reset cache ref so plates actually vanish from screen
  const handleClearAll = useCallback(() => {
    activePolyPointsRef.current = [];
    p1Ref.current = null;
    if (cachedPanelsRef && cachedPanelsRef.current) {
      cachedPanelsRef.current = [];
    }
    panelsRef.current = [];
    setPlacedPanels([]);
    if (modulesLayerRef.current && map) {
      try {
        map.removeLayer(modulesLayerRef.current);
        modulesLayerRef.current = null;
      } catch (e) { }
    }
    if (setRoofPolygon) setRoofPolygon([]);
    if (setActiveDrawingPoints) setActiveDrawingPoints([]);
    if (onClearDrawing) onClearDrawing();
    if (typeof requestRedraw === "function") requestRedraw();
  }, [map, setRoofPolygon, setActiveDrawingPoints, onClearDrawing, requestRedraw]);

  // Floating Right-Click Edge Alignment Context Menu
  const [edgeMenu, setEdgeMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    azimuthDeg: 0,
    edgeIndex: -1
  });

  // ★ NEW: Effective flags — parent props + local toggles combined
  const effLock = isLocked || localLock;
  const moveActive = isAdjustingPosition || localMove;
  // ★ NEW: AUTO pitch = engine winter-shadow formula (tilt-linked).
  // Manual = jab parent ne explicit shadowPitch diya ho, ya user MANUAL chip pe ho.
  const isAutoPitch = pitchAuto && (shadowPitch === null || shadowPitch === undefined);

  const isDrawing = activeCadTool === "FIELD_SEGMENT" || activeCadTool === "ROOF_PERIMETER" || activeCadTool === "ROOF_BOX" || activeCadTool === "OBSTACLE_CIRCLE";

  // 1. HARD MAP LOCK DURING ACTIVE DRAWING
  useEffect(() => {
    if (!map) return;
    if (isDrawing) {
      map.dragging?.disable();
      map.touchZoom?.disable();
      map.doubleClickZoom?.disable();
      map.scrollWheelZoom?.disable();
      if (map.boxZoom) map.boxZoom.disable();
      if (map.keyboard) map.keyboard.disable();
      const container = map.getContainer();
      if (container) container.style.cursor = "crosshair";
    } else {
      map.dragging?.enable();
      map.touchZoom?.enable();
      map.doubleClickZoom?.enable();
      map.scrollWheelZoom?.enable();
      if (map.boxZoom) map.boxZoom.enable();
      if (map.keyboard) map.keyboard.enable();
      const container = map.getContainer();
      if (container) container.style.cursor = "grab";
    }

    // ★ FIX: Lock ON = Leaflet native drag bhi band (canvas panBy single path)
    // — pehle double-pan ho raha tha isliye lock "jhoota" lag raha tha
    if (effLock && !isDrawing) {
      map.dragging?.disable();
    }
  }, [map, isDrawing, effLock]);

  // Handle ESC key to cancel active drawing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        p1Ref.current = null;
        activePolyPointsRef.current = [];
        setEdgeMenu(prev => ({ ...prev, show: false }));
        if (setActiveCadTool) setActiveCadTool("PAN_VIEW");
        requestRedraw();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveCadTool]);

  // Coordinate Conversion Helper: GPS -> Canvas Container Pixels
  const toPx = useCallback((lat, lng) => {
    if (!map) return { x: 0, y: 0 };
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isFinite(numLat) || !isFinite(numLng)) return { x: 0, y: 0 };
    try {
      const pt = map.latLngToContainerPoint(L.latLng(numLat, numLng));
      return { x: isFinite(pt.x) ? pt.x : 0, y: isFinite(pt.y) ? pt.y : 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  }, [map]);

  // Coordinate Conversion Helper: Canvas Pixels -> GPS
  const toGps = useCallback((x, y) => {
    if (!map) return null;
    try {
      const latLng = map.containerPointToLatLng(L.point(x, y));
      if (!latLng || !isFinite(latLng.lat) || !isFinite(latLng.lng)) return null;
      return { lat: latLng.lat, lng: latLng.lng };
    } catch {
      return null;
    }
  }, [map]);

  // Distance in meters between two GPS coordinates
  const distanceBetweenGps = useCallback((p1, p2) => {
    if (!map || !p1 || !p2) return 0;
    try {
      return Math.round(map.distance(L.latLng(p1[0], p1[1]), L.latLng(p2[0], p2[1])) * 10) / 10;
    } catch {
      return 0;
    }
  }, [map]);

  // =========================================================================
  // 2. CANVAS VECTOR SCENE RENDERER & REDRAW SYSTEM
  // =========================================================================
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;

    const ctx = canvas.getContext("2d");
    const container = map.getContainer();
    if (!container) return;

    // Check if 3D WebGL Simulation modal or view is currently open
    const is3DActive = !!document.querySelector('.three-canvas, [data-3d-active="true"], [class*="3d-modal"], [class*="Three"]');
    if (is3DActive) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // -------------------------------------------------------------
    // A. DRAW COMPLETED ROOFTOP CAD BOUNDARY (#38bdf8 dashed grid)
    // -------------------------------------------------------------
    const activePoly = activePolyDragRef.current || roofPolygon;
    if (activePoly && activePoly.length >= 3) {
      ctx.save();
      ctx.beginPath();
      const p0 = toPx(activePoly[0][0], activePoly[0][1]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < activePoly.length; i++) {
        const pt = toPx(activePoly[i][0], activePoly[i][1]);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      // HelioScope CAD Light Blue Translucent Area Fill
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.fill();

      // HelioScope CAD Sky Blue Dashed Boundary Line
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      // Setback Clearance dashed guide (if setbackMeters > 0)
      if (setbackMeters > 0) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
      }

      // Highlight Hovered or Dragged Edge Line with Weight 3.5 & Solid Glow
      const activeEdgeIdx = isDraggingEdgeRef.current ? draggedEdgeIndexRef.current : hoveredEdgeIndexRef.current;
      if (activeEdgeIdx >= 0 && activeEdgeIdx < activePoly.length) {
        const nextIdx = (activeEdgeIdx + 1) % activePoly.length;
        const pt1 = toPx(activePoly[activeEdgeIdx][0], activePoly[activeEdgeIdx][1]);
        const pt2 = toPx(activePoly[nextIdx][0], activePoly[nextIdx][1]);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3.5;
        ctx.setLineDash([]);
        ctx.shadowColor = "rgba(56, 189, 248, 0.9)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }

      // Render Draggable Vertex Corner Handles for Completed Roof Polygon (HelioScope CAD standard)
      for (let i = 0; i < activePoly.length; i++) {
        const vPt = toPx(activePoly[i][0], activePoly[i][1]);
        const isHovered = (i === hoveredVertexIndexRef.current);
        const isDragged = (isDraggingVertexRef.current && i === draggedVertexIndexRef.current);

        ctx.save();
        ctx.beginPath();
        const r = isDragged ? 7.5 : (isHovered ? 6.5 : 5);
        ctx.arc(vPt.x, vPt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = (isHovered || isDragged) ? "#38bdf8" : "#ffffff";
        ctx.fill();
        ctx.lineWidth = isDragged ? 2.5 : 2;
        ctx.strokeStyle = "#0284c7";
        ctx.shadowColor = (isHovered || isDragged) ? "rgba(56, 189, 248, 0.9)" : "rgba(15, 23, 42, 0.4)";
        ctx.shadowBlur = (isHovered || isDragged) ? 10 : 4;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // B. IN-PROGRESS FIELD SEGMENT DRAWING (Yellow Outline + Handles)
    // -------------------------------------------------------------
    const activePoints = activePolyPointsRef.current;
    if ((activeCadTool === "FIELD_SEGMENT" || activeCadTool === "ROOF_PERIMETER") && activePoints.length > 0) {
      ctx.save();

      // Draw lines between existing vertices
      ctx.beginPath();
      const firstPx = toPx(activePoints[0][0], activePoints[0][1]);
      ctx.moveTo(firstPx.x, firstPx.y);
      for (let i = 1; i < activePoints.length; i++) {
        const pt = toPx(activePoints[i][0], activePoints[i][1]);
        ctx.lineTo(pt.x, pt.y);
      }

      // Rubber-band line from last point to current mouse position
      if (mousePosPxRef.current) {
        ctx.lineTo(mousePosPxRef.current.x, mousePosPxRef.current.y);
      }

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.stroke();

      // Vertex anchor handles with step numbers
      activePoints.forEach(([lat, lng], idx) => {
        const vPx = toPx(lat, lng);
        ctx.beginPath();
        ctx.arc(vPx.x, vPx.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 && isNearFirstPoint ? "#10b981" : "#f59e0b";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${idx + 1}`, vPx.x, vPx.y);
        ctx.textAlign = "start";
      });

      // Snapping to first point visual indicator
      if (isNearFirstPoint && activePoints.length >= 3) {
        ctx.beginPath();
        ctx.arc(firstPx.x, firstPx.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("Click to close field segment", firstPx.x + 18, firstPx.y + 4);
      }

      // Edge length measurement label next to mouse cursor
      if (mouseGpsRef.current && activePoints.length > 0) {
        const lastPt = activePoints[activePoints.length - 1];
        const segDistM = distanceBetweenGps(lastPt, [mouseGpsRef.current.lat, mouseGpsRef.current.lng]);
        if (mousePosPxRef.current && segDistM > 0.5) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 1;
          const badgeText = `${segDistM} m`;
          const textW = ctx.measureText(badgeText).width + 12;
          ctx.fillRect(mousePosPxRef.current.x + 12, mousePosPxRef.current.y - 20, textW, 18);
          ctx.strokeRect(mousePosPxRef.current.x + 12, mousePosPxRef.current.y - 20, textW, 18);
          ctx.fillStyle = "#facc15";
          ctx.font = "bold 10px monospace";
          ctx.fillText(badgeText, mousePosPxRef.current.x + 18, mousePosPxRef.current.y - 7);
        }
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // C. TWO-CLICK SNAP BOX ARRAY PREVIEW
    // -------------------------------------------------------------
    if (activeCadTool === "ROOF_BOX" && p1Ref.current && mouseGpsRef.current) {
      const p1 = p1Ref.current;
      const p2 = mouseGpsRef.current;

      const minLat = Math.min(p1.lat, p2.lat);
      const maxLat = Math.max(p1.lat, p2.lat);
      const minLng = Math.min(p1.lng, p2.lng);
      const maxLng = Math.max(p1.lng, p2.lng);

      const tl = toPx(maxLat, minLng);
      const tr = toPx(maxLat, maxLng);
      const br = toPx(minLat, maxLng);
      const bl = toPx(minLat, minLng);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tl.x, tl.y);
      ctx.lineTo(tr.x, tr.y);
      ctx.lineTo(br.x, br.y);
      ctx.lineTo(bl.x, bl.y);
      ctx.closePath();
      ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // -------------------------------------------------------------
    // D. PHOTOVOLTAIC SOLAR MODULES MATRIX RENDERING (Photorealistic Half-Cut)
    // -------------------------------------------------------------
    const currentRoofPoly = (activePolygon && activePolygon.length >= 3)
      ? activePolygon
      : (activePoly && activePoly.length >= 3 ? activePoly : null);
    const hasValidRoof = Boolean(currentRoofPoly && currentRoofPoly.length >= 3);

    if (!hasValidRoof) {
      if (cachedPanelsRef && cachedPanelsRef.current) {
        cachedPanelsRef.current = [];
      }
    }

    const currentPanels = (panelsRef.current && panelsRef.current.length > 0) ? panelsRef.current : (placedPanels || []);
    const safePanels = hasValidRoof
      ? ((Array.isArray(currentPanels) && currentPanels.length > 0)
        ? currentPanels
        : (Array.isArray(cachedPanelsRef.current) && cachedPanelsRef.current.length > 0 ? cachedPanelsRef.current : []))
      : [];

    if (hasValidRoof && Array.isArray(currentPanels) && currentPanels.length > 0) {
      cachedPanelsRef.current = currentPanels;
    }

    const panels = safePanels;
    const deltaLat = isDraggingArrayRef.current ? (dragDeltaGpsRef.current?.lat || 0) : 0;
    const deltaLng = isDraggingArrayRef.current ? (dragDeltaGpsRef.current?.lng || 0) : 0;

    // Roof Centroid GPS Anchor
    const roofCentroidGps = hasValidRoof ? calculateCentroid(currentRoofPoly) : null;

    // 1. Always calculate the roof polygon centroid safely:
    const getPolygonCentroid = (pts) => {
      if (!pts || pts.length === 0) return { x: 0, y: 0 };
      let sx = 0, sy = 0;
      pts.forEach(p => {
        sx += Number(p.x ?? p.lng ?? p[0] ?? 0);
        sy += Number(p.y ?? p.lat ?? p[1] ?? 0);
      });
      return { x: sx / pts.length, y: sy / pts.length };
    };

    const activePolygonScreenPoints = (currentRoofPoly && currentRoofPoly.length >= 3)
      ? currentRoofPoly.map(pt => toPx(Array.isArray(pt) ? pt[0] : (pt.lat ?? pt.y), Array.isArray(pt) ? pt[1] : (pt.lng ?? pt.x)))
      : null;

    let centerPoint = getPolygonCentroid(activePolygonScreenPoints || activePolygon || currentRoofPoly);
    if (!centerPoint || (!centerPoint.x && !centerPoint.y) || !isFinite(centerPoint.x) || !isFinite(centerPoint.y)) {
      centerPoint = { x: width / 2, y: height / 2 };
    }

    // Map scale: pixels per meter around roof centroid
    let scale = 18;
    if (map && roofCentroidGps) {
      try {
        const cGpsLat = roofCentroidGps.lat ?? roofCentroidGps[0];
        const cGpsLng = roofCentroidGps.lng ?? roofCentroidGps[1];
        const cGps = L.latLng(cGpsLat, cGpsLng);
        const p1 = map.latLngToContainerPoint(cGps);
        const p2 = map.latLngToContainerPoint(L.latLng(cGps.lat + 1 / 111139, cGps.lng));
        const dist = Math.abs(p2.y - p1.y);
        if (isFinite(dist) && dist > 0.5) scale = dist;
      } catch (e) { }
    }

    // Track array bounding box in pixel space for free-drag hit detection
    let bboxMinX = Infinity, bboxMaxX = -Infinity, bboxMinY = Infinity, bboxMaxY = -Infinity;

    const preparedPanels = [];
    panels.forEach((mod) => {
      const isRemoved = removedModuleIds.has(mod.id);
      const isHovered = hoveredModuleIdRef.current === mod.id;

      const p = mod;
      const activeTilt = Number(mod.tilt !== undefined ? mod.tilt : tiltDegrees) || 0;
      const tiltRad = (activeTilt * Math.PI) / 180;
      const baseScale = Number(scale) || 1;
      const s = (typeof arrayScale === 'number' && isFinite(arrayScale) && arrayScale > 0.2) ? arrayScale : 1.0;

      // Keep Individual Module Dimensions Fixed & Prevent NaN or collapsing dimensions
      const isLandscape = p.orientation === "LANDSCAPE" || orientation === "LANDSCAPE";
      const baseW = isLandscape ? 2.278 : 1.134;
      const baseL = isLandscape ? 1.134 : 2.278;
      const rawW = p.width ? (Number(p.width) > 10 ? Number(p.width) / 1000 : Number(p.width)) : baseW;
      const rawL = p.length ? (Number(p.length) > 10 ? Number(p.length) / 1000 : Number(p.length)) : baseL;

      const visualWidth = Math.max(0.2, (Number(rawW) || 1.134) * baseScale);
      const visualLength = Math.max(0.2, (Number(rawL) || 2.278) * Math.cos(tiltRad) * baseScale);
      const pWidth = visualWidth;
      const pLength = visualLength;

      // Local relative offset from roof centroid (rotX, rotY in screen pixels)
      let rotX = 0;
      let rotY = 0;

      const modCenter = mod.center || mod.centerGps;
      let hasCenterPx = false;
      if (modCenter) {
        const mLat = Array.isArray(modCenter) ? modCenter[0] : (modCenter.lat ?? modCenter.y);
        const mLng = Array.isArray(modCenter) ? modCenter[1] : (modCenter.lng ?? modCenter.x);
        if (isFinite(mLat) && isFinite(mLng)) {
          const rawCenterPx = toPx(mLat, mLng);
          if (isFinite(rawCenterPx.x) && isFinite(rawCenterPx.y) && (rawCenterPx.x !== 0 || rawCenterPx.y !== 0)) {
            rotX = rawCenterPx.x - centerPoint.x;
            rotY = rawCenterPx.y - centerPoint.y;
            hasCenterPx = true;
          }
        }
      }

      if (!hasCenterPx) {
        if (mod.rotX !== undefined && mod.rotY !== undefined && isFinite(mod.rotX) && isFinite(mod.rotY)) {
          rotX = (Number(mod.rotX) || 0) * scale;
          rotY = -(Number(mod.rotY) || 0) * scale; // World Northing (Y+) corresponds to Canvas Y-
        } else if (mod.relX !== undefined && mod.relY !== undefined && isFinite(mod.relX) && isFinite(mod.relY)) {
          rotX = (Number(mod.relX) || 0) * scale;
          rotY = -(Number(mod.relY) || 0) * scale;
        }
      }

      if (rotX === undefined || !isFinite(rotX) || isNaN(rotX)) rotX = 0;
      if (rotY === undefined || !isFinite(rotY) || isNaN(rotY)) rotY = 0;

      // Adjust relative offsets between plates, keeping module glass size 100% natural
      let px = centerPoint.x + (rotX * s);
      let py = centerPoint.y + (rotY * s);

      // Apply drag delta if array is being translated
      if (deltaLat !== 0 || deltaLng !== 0) {
        const dPx = toPx(
          (roofCentroidGps?.lat ?? 0) + deltaLat,
          (roofCentroidGps?.lng ?? 0) + deltaLng
        );
        if (isFinite(dPx.x) && isFinite(dPx.y)) {
          px += (dPx.x - centerPoint.x);
          py += (dPx.y - centerPoint.y);
        }
      }

      if (!isFinite(px) || !isFinite(py)) return;
      const finalPx = px;
      const finalPy = py;

      // Azimuth rotation vector in screen pixels
      const azDeg = Number(mod.azimuth !== undefined ? mod.azimuth : azimuthDegrees) || 180;
      const azRad = ((azDeg - 180) * Math.PI) / 180;
      const cosAz = Math.cos(azRad);
      const sinAz = Math.sin(azRad);

      const hw = { x: (pWidth / 2) * cosAz, y: (pWidth / 2) * sinAz };
      const hl = { x: -(pLength / 2) * sinAz, y: (pLength / 2) * cosAz };

      const visualCornersPx = [
        { x: finalPx - hw.x - hl.x, y: finalPy - hw.y - hl.y },
        { x: finalPx + hw.x - hl.x, y: finalPy + hw.y - hl.y },
        { x: finalPx + hw.x + hl.x, y: finalPy + hw.y + hl.y },
        { x: finalPx - hw.x + hl.x, y: finalPy - hw.y + hl.y }
      ];

      // Update bbox from all panel visual corners
      visualCornersPx.forEach(p => {
        if (p.x < bboxMinX) bboxMinX = p.x;
        if (p.x > bboxMaxX) bboxMaxX = p.x;
        if (p.y < bboxMinY) bboxMinY = p.y;
        if (p.y > bboxMaxY) bboxMaxY = p.y;
      });

      preparedPanels.push({
        mod,
        drawX: finalPx,
        drawY: finalPy,
        pW: visualWidth,
        pL: visualLength,
        pLengthM: Number(rawL) || 2.278,
        tiltRad,
        azRad,
        cornersPx: visualCornersPx,
        isRemoved,
        isHovered,
        modRackingType: mod.rackingType || rackingType
      });
    });

    try {
      // PASS 1: RACKING STRUCTURES, FOUNDATION LEGS & DROP SHADOWS UNDERNEATH (All modules)
      preparedPanels.forEach(({ cornersPx, isRemoved, modRackingType }) => {
        if (isRemoved) return;

        // Ambient Occlusion Drop Shadow proportional to tilt angle
        if (showShadows) {
          const elevRad = (Math.max(10, solarElevation) * Math.PI) / 180;
          const azRad = (solarAzimuth * Math.PI) / 180;
          // Tilt-scaled shadow — deeper tilt casts a more pronounced row shadow
          const tiltFactor = Math.sin((tiltDegrees * Math.PI) / 180);
          const shadowDistPx = Math.min(12, Math.max(2, (3 + tiltFactor * 6) / Math.tan(elevRad)));
          const shadowVec = {
            x: -Math.sin(azRad) * shadowDistPx,
            y: Math.cos(azRad) * shadowDistPx
          };

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cornersPx[0].x + shadowVec.x, cornersPx[0].y + shadowVec.y);
          ctx.lineTo(cornersPx[1].x + shadowVec.x, cornersPx[1].y + shadowVec.y);
          ctx.lineTo(cornersPx[2].x + shadowVec.x, cornersPx[2].y + shadowVec.y);
          ctx.lineTo(cornersPx[3].x + shadowVec.x, cornersPx[3].y + shadowVec.y);
          ctx.closePath();
          ctx.fillStyle = "rgba(10, 15, 30, 0.42)";
          ctx.fill();
          ctx.restore();
        }

        // Render physical galvanized mounting legs and cross-beams underneath panels based on rackingType
        renderRackingUnderneath(ctx, cornersPx, modRackingType, showShadows);
      });

      // PASS 2: PHOTOVOLTAIC SOLAR MODULE FACES & DYNAMIC SUN SHADOWS (Rendered on top)
      preparedPanels.forEach(({ mod, drawX, drawY, pW, pL, pLengthM, tiltRad: panelTiltRad, azRad, isRemoved, isHovered, modRackingType }) => {
        if (isRemoved) {
          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(azRad);
          ctx.fillStyle = "rgba(239, 68, 68, 0.45)";
          ctx.fillRect(-pW / 2, -pL / 2, pW, pL);
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 1;
          ctx.strokeRect(-pW / 2, -pL / 2, pW, pL);
          ctx.restore();
          return;
        }

        // 1. Dynamic Sun Position Shadow Projection (rendered under the panel)
        if (showShadows) {
          // Get active sun altitude & azimuth (default: Jun 21 solar noon if not selected)
          const sunAlt = Math.max(5, Number(sunAltitudeDeg ?? solarElevation ?? 45));
          const sunAz = Number(sunAzimuthDeg ?? solarAzimuth ?? 180);

          // Shadow length depends on panel elevation/tilt and sun angle:
          const effLength = Number(pLengthM) || 2.278;
          const effTiltRad = Number(panelTiltRad) || 0;
          const shadowLengthMeters = (effLength * Math.sin(effTiltRad) + (modRackingType === 'L3_ELEVATED' ? 1.5 : 0.8)) / Math.tan((sunAlt * Math.PI) / 180);
          const shadowPx = shadowLengthMeters * scale;

          // Shadow direction is opposite to sun azimuth:
          const shadowAngleRad = ((sunAz + 180) * Math.PI) / 180;
          const shadowDx = Math.sin(shadowAngleRad) * shadowPx;
          const shadowDy = -Math.cos(shadowAngleRad) * shadowPx;

          // Draw semi-transparent shadow under the panel
          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.fillStyle = "rgba(15, 23, 42, 0.42)";
          ctx.beginPath();
          ctx.moveTo(-pW / 2, -pL / 2);
          ctx.lineTo(pW / 2, -pL / 2);
          ctx.lineTo(pW / 2 + shadowDx, pL / 2 + shadowDy);
          ctx.lineTo(-pW / 2 + shadowDx, pL / 2 + shadowDy);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // 2. ★ REALISTIC solar module: silver frame + cell grid + busbars + glass shine
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(azRad);

        // A) Anodized aluminium frame (silver border)
        const frameW = Math.max(0.8, Math.min(2.2, pW * 0.05));
        ctx.fillStyle = "#9ca3af";
        ctx.fillRect(-pW / 2, -pL / 2, pW, pL);

        // B) Dark blue tempered glass (gradient depth)
        const glassGrad = ctx.createLinearGradient(-pW / 2, -pL / 2, pW / 2, pL / 2);
        if (isHovered) {
          glassGrad.addColorStop(0, "#1e40af");
          glassGrad.addColorStop(1, "#2563eb");
        } else {
          glassGrad.addColorStop(0, "#0d1f38");
          glassGrad.addColorStop(0.45, "#17304f");
          glassGrad.addColorStop(1, "#0a1a30");
        }
        ctx.fillStyle = glassGrad;
        ctx.fillRect(-pW / 2 + frameW, -pL / 2 + frameW, pW - frameW * 2, pL - frameW * 2);

        // C) Half-cut cell grid + busbars (sirf jab panel kaafi bara ho)
        const innerW = pW - frameW * 2, innerL = pL - frameW * 2;
        if (innerW > 10 && innerL > 10) {
          const isWide = innerW > innerL;
          const cols = isWide ? 12 : 6;
          const rows = isWide ? 6 : 12;
          const cw = innerW / cols, ch = innerL / rows;

          ctx.strokeStyle = "rgba(148,163,184,0.30)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let c = 1; c < cols; c++) { const x = -innerW / 2 + c * cw; ctx.moveTo(x, -innerL / 2); ctx.lineTo(x, innerL / 2); }
          for (let r = 1; r < rows; r++) { const y = -innerL / 2 + r * ch; ctx.moveTo(-innerW / 2, y); ctx.lineTo(innerW / 2, y); }
          ctx.stroke();

          // 2 busbars per cell (thin light lines)
          ctx.strokeStyle = "rgba(191,219,254,0.20)";
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          for (let c = 0; c < cols; c++) {
            const x0 = -innerW / 2 + c * cw;
            ctx.moveTo(x0 + cw * 0.33, -innerL / 2); ctx.lineTo(x0 + cw * 0.33, innerL / 2);
            ctx.moveTo(x0 + cw * 0.66, -innerL / 2); ctx.lineTo(x0 + cw * 0.66, innerL / 2);
          }
          ctx.stroke();

          // D) Glass specular shine (diagonal reflection)
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath();
          ctx.moveTo(-innerW / 2, -innerL / 2);
          ctx.lineTo(-innerW / 2 + innerW * 0.3, -innerL / 2);
          ctx.lineTo(-innerW / 2, -innerL / 2 + innerL * 0.6);
          ctx.closePath();
          ctx.fill();
        }

        // E) Outline
        ctx.strokeStyle = isHovered ? "#93c5fd" : "rgba(56,189,248,0.55)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-pW / 2, -pL / 2, pW, pL);

        // If elevated racking (L2 / L3) is enabled, render leg drops straight down
        if (modRackingType === 'L2_ELEVATED' || modRackingType === 'L3_ELEVATED') {
          ctx.fillStyle = "#94a3b8";
          const legH = modRackingType === 'L3_ELEVATED' ? 14 : 8;
          ctx.fillRect(-pW / 2, pL / 2, 3, legH);
          ctx.fillRect(pW / 2 - 3, pL / 2, 3, legH);
        }

        ctx.restore();
      });
    } catch (renderErr) {
      console.warn("[HelioScopeCAD] drawScene pass rendering error:", renderErr);
    }

    // Store array bounding box for free-drag hit detection
    if (panels.length > 0 && isFinite(bboxMinX)) {
      arrayBboxPxRef.current = { minX: bboxMinX, maxX: bboxMaxX, minY: bboxMinY, maxY: bboxMaxY };
    } else {
      arrayBboxPxRef.current = null;
    }

    // All intrusive badges, bounding boxes, and gizmo overlays permanently removed.
    // Module statistics are displayed cleanly in the left CAD sidebar.

    // -------------------------------------------------------------
    // E. DRAGGABLE ARRAY ANCHOR GIZMO (Center Control Handle)
    // -------------------------------------------------------------
    if (panels.length > 0 && roofPolygon && roofPolygon.length >= 3) {
      let sumModLat = 0, sumModLng = 0, validModCount = 0;
      panels.forEach(p => {
        if (!removedModuleIds.has(p.id)) {
          if (p.center && isFinite(p.center[0]) && isFinite(p.center[1])) {
            sumModLat += p.center[0];
            sumModLng += p.center[1];
            validModCount++;
          }
        }
      });
      if (validModCount === 0 && panels.length > 0) {
        panels.forEach(p => {
          if (p.center && isFinite(p.center[0]) && isFinite(p.center[1])) {
            sumModLat += p.center[0];
            sumModLng += p.center[1];
            validModCount++;
          }
        });
      }

      const roofCentroid = calculateCentroid(roofPolygon);
      const rLat = roofCentroid.lat ?? (Array.isArray(roofCentroid) ? roofCentroid[0] : 0);
      const rLng = roofCentroid.lng ?? (Array.isArray(roofCentroid) ? roofCentroid[1] : 0);

      const centroidLat = validModCount > 0 ? (sumModLat / validModCount) : rLat;
      const centroidLng = validModCount > 0 ? (sumModLng / validModCount) : rLng;

      const aLat = centroidLat + (deltaLat || 0);
      const aLng = centroidLng + (deltaLng || 0);
      const aPx = toPx(aLat, aLng);
      anchorPxRef.current = aPx;

      // Removed on-canvas circle gizmo to prevent blocking the solar panels view
      // Array repositioning is handled cleanly by dragging the array directly
      if (isFinite(aPx.x) && isFinite(aPx.y)) {
        // Keep coordinates updated for dragging logic without rendering visual obstruction
      }
    } else {
      anchorPxRef.current = null;
    }

    // -------------------------------------------------------------
    // F. KEEPOUT OBSTACLES (HVAC / Water Tanks)
    // -------------------------------------------------------------
    keepouts.forEach((obs) => {
      const centerPx = toPx(obs.lat, obs.lng);
      const edgeGps = [obs.lat, obs.lng + (obs.radiusM / (111320 * Math.cos((obs.lat * Math.PI) / 180)))];
      const edgePx = toPx(edgeGps[0], edgeGps[1]);
      const radiusPx = Math.max(4, Math.hypot(edgePx.x - centerPx.x, edgePx.y - centerPx.y));

      ctx.save();
      ctx.fillStyle = "rgba(244, 63, 94, 0.35)";
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerPx.x, centerPx.y, radiusPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // -------------------------------------------------------------
    // G. ELECTRICAL OVERLAY — Inverters, Strings & Lightning Badges
    // -------------------------------------------------------------
    if (showElectricalLayer && panels.length > 0 && roofPolygon && roofPolygon.length >= 3) {
      ctx.save();

      // Inverter Stations along roof perimeter
      const invRatingKw = inverterCapacityKw || 100;
      const activePanelCount = panels.length - (removedModuleIds ? removedModuleIds.size : 0);
      // ★ FIX: Ab selected module ki ACTUAL wattage use hoti hai (585 hardcode hat gaya)
      const avgW = panels.reduce((a, p) => a + (Number(p.wattage) || 585), 0) / Math.max(1, panels.length);
      const sysSizeKwp = (activePanelCount * avgW) / 1000;
      const invQty = Math.max(1, Math.ceil(sysSizeKwp / (invRatingKw * 1.25)));

      const roofPxPts = roofPolygon.map(([lat, lng]) => toPx(lat, lng));
      const perimeterSegs = [];
      let totalPerimPx = 0;
      for (let i = 0; i < roofPxPts.length; i++) {
        const next = (i + 1) % roofPxPts.length;
        const len = Math.hypot(roofPxPts[next].x - roofPxPts[i].x, roofPxPts[next].y - roofPxPts[i].y);
        perimeterSegs.push({ from: roofPxPts[i], to: roofPxPts[next], len });
        totalPerimPx += len;
      }

      const inverterPositions = [];
      for (let k = 0; k < invQty; k++) {
        const targetDist = ((k + 0.5) / invQty) * totalPerimPx;
        let dist = 0;
        for (const seg of perimeterSegs) {
          if (dist + seg.len >= targetDist) {
            const t = (targetDist - dist) / seg.len;
            inverterPositions.push({
              x: seg.from.x + (seg.to.x - seg.from.x) * t,
              y: seg.from.y + (seg.to.y - seg.from.y) * t
            });
            break;
          }
          dist += seg.len;
        }
      }

      inverterPositions.forEach((pos, ki) => {
        const iw = 28, ih = 20;
        const ix = pos.x - iw / 2;
        const iy = pos.y - ih / 2;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;

        const invGrad = ctx.createLinearGradient(ix, iy, ix, iy + ih);
        invGrad.addColorStop(0, "#fb923c");
        invGrad.addColorStop(0.5, "#ea580c");
        invGrad.addColorStop(1, "#9a3412");
        ctx.fillStyle = invGrad;
        if (ctx.roundRect) ctx.roundRect(ix, iy, iw, ih, 3);
        else ctx.rect(ix, iy, iw, ih);
        ctx.fill();

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "rgba(154, 52, 18, 0.60)";
        ctx.lineWidth = 1;
        for (let r = 1; r <= 3; r++) {
          const ry = iy + (ih * r) / 4;
          ctx.beginPath();
          ctx.moveTo(ix + 2, ry);
          ctx.lineTo(ix + iw - 2, ry);
          ctx.stroke();
        }

        ctx.strokeStyle = "#c2410c";
        ctx.lineWidth = 1.5;
        if (ctx.roundRect) ctx.roundRect(ix, iy, iw, ih, 3);
        else ctx.rect(ix, iy, iw, ih);
        ctx.stroke();

        ctx.fillStyle = "#fff7ed";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`INV ${ki + 1}`, pos.x, pos.y - 1);
        ctx.fillStyle = "#fed7aa";
        ctx.font = "6px monospace";
        ctx.fillText(`${invRatingKw}kW`, pos.x, pos.y + 6);

        ctx.restore();
      });

      // String groups with lightning bolt badges
      const strSize = Math.max(1, targetStringSize || 20);
      const activePanels = panels.filter(p => !removedModuleIds || !removedModuleIds.has(p.id));
      const strings = [];
      for (let s = 0; s < activePanels.length; s += strSize) {
        strings.push(activePanels.slice(s, s + strSize));
      }

      strings.forEach((strPanels, si) => {
        if (strPanels.length === 0) return;

        let sumX = 0, sumY = 0, cnt = 0;
        strPanels.forEach(mod => {
          const corners = mod.corners || mod.cornersGps;
          if (corners && corners[0]) {
            const pt = toPx(corners[0][0], corners[0][1]);
            if (isFinite(pt.x) && isFinite(pt.y)) {
              sumX += pt.x; sumY += pt.y; cnt++;
            }
          }
        });
        if (cnt === 0) return;
        const cx = sumX / cnt;
        const cy = sumY / cnt;

        let nearestInv = inverterPositions[0] || { x: cx, y: cy };
        let nearestDist = Infinity;
        inverterPositions.forEach(ip => {
          const d = Math.hypot(ip.x - cx, ip.y - cy);
          if (d < nearestDist) { nearestDist = d; nearestInv = ip; }
        });

        ctx.save();
        ctx.strokeStyle = "rgba(6, 182, 212, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nearestInv.x, nearestInv.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.save();
        ctx.shadowColor = "rgba(6, 182, 212, 0.6)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "rgba(8, 15, 30, 0.88)";
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";

        ctx.fillStyle = "#22d3ee";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚡", cx, cy);

        ctx.fillStyle = "#a5f3fc";
        ctx.font = "bold 7px monospace";
        ctx.fillText(`S${si + 1}`, cx, cy + 13);
        ctx.restore();
      });

      ctx.restore();
    }

    ctx.restore();
  }, [
    map,
    activeCadTool,
    roofPolygon,
    orientation,
    tiltDegrees,
    azimuthDegrees,
    solarElevation,
    solarAzimuth,
    showShadows,
    keepouts,
    removedModuleIds,
    isNearFirstPoint,
    gridOffset,
    showElectricalLayer,
    inverterCapacityKw,
    targetStringSize,
    distanceBetweenGps,
    toPx,
    rackingType,
    placedPanels
  ]);
  drawSceneRef.current = drawScene;

  // Map pan/zoom/resize listeners
  useEffect(() => {
    if (!map) return;
    requestRedraw();
    const onMapChange = () => requestRedraw();
    map.on("move zoom resize moveend zoomend viewreset", onMapChange);

    return () => {
      map.off("move zoom resize moveend zoomend viewreset", onMapChange);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [map, requestRedraw]);

  // Redraw when parameters change
  useEffect(() => {
    requestRedraw();
  }, [
    requestRedraw,
    activeCadTool,
    tiltDegrees,
    azimuthDegrees,
    solarElevation,
    sunAltitudeDeg,
    solarAzimuth,
    sunAzimuthDeg,
    showShadows,
    roofPolygon,
    rackingType,
    arrayScale,
    gridOffset
  ]);

  // =========================================================================
  // 3. AUTOMATED RAY-CASTING MODULE MATRIX PACKING
  // =========================================================================
  const fitMapToPanels = useCallback((polygonCoords) => {
    if (!map) return;
    try {
      const coords = polygonCoords || (panelsRef.current.length > 0 ? panelsRef.current.map(p => p.corners).flat() : null);
      if (!coords || coords.length < 2) return;
      const bounds = L.latLngBounds(coords);
      if (!bounds.isValid()) return;
      map.fitBounds(bounds, { padding: [40, 40], animate: false, maxZoom: 21 });
      if (map.getZoom() < 19) {
        map.setZoom(19, { animate: false });
      }
      requestRedraw();
    } catch (err) {
      console.warn('[HelioScopeCAD] fitMapToPanels error:', err);
    }
  }, [map, requestRedraw]);

  const runModulePacking = useCallback((polygonCoords) => {
    if (modulesLayerRef.current && map) {
      try {
        map.removeLayer(modulesLayerRef.current);
        modulesLayerRef.current = null;
      } catch (err) {
        console.warn("Could not remove modules layer:", err);
      }
    }

    if (!polygonCoords || polygonCoords.length < 3) {
      panelsRef.current = [];
      requestRedraw();
      return;
    }

    const spec = MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Jinko Solar Tiger Neo 585W"];
    const lengthM = spec.lengthMm / 1000;
    const widthM = spec.widthMm / 1000;
    const moduleWidth = orientation === "PORTRAIT" ? widthM : lengthM;
    const moduleLength = orientation === "PORTRAIT" ? lengthM : widthM;

    const result = renderHelioScopeModules(map, polygonCoords, {
      moduleWidth,
      moduleLength,
      tilt: tiltDegrees,
      azimuth: azimuthDegrees,
      setback: setbackMeters,
      color: "#3b49df",
      // ★ FIX: AUTO pitch mode mein rowSpacing pass NAHI karo -> engine winter-shadow
      //   formula se tilt-linked pitch nikalega. Manual mode mein explicit gap jata hai.
      rowSpacing: isAutoPitch ? undefined : rowSpacing,
      rowSpacingM: isAutoPitch ? undefined : rowSpacing,
      colSpacing,
      colSpacingM: colSpacing,
      shadowPitch: shadowPitch ?? undefined,
      arrayScale,
      frameSizeUp,
      frameRows: frameSizeUp,
      frameSizeWide,
      frameCols: frameSizeWide,
      frameSpacing,
      gridAlignment,
      removedModuleIds,
      onToggleModule,
      wattage: spec.wattage,
      targetCapacityMode,
      targetKwp,
      gridOffset,
      keepouts,
      rackingType,
      latitude: siteLatitude // ★ NEW: site ki latitude se winter sun angle calculate hoga
    });

    if (result && Array.isArray(result.modules) && result.modules.length > 0) {
      modulesLayerRef.current = result.modulesLayer || null;
      const formatted = result.modules.map((m, idx) => ({
        id: m.id || `mod-${idx}`,
        corners: m.cornersGps || m.corners,
        center: m.centerGps || m.center,
        rotX: m.rotX ?? m.relX,
        rotY: m.rotY ?? m.relY,
        relX: m.rotX ?? m.relX,
        relY: m.rotY ?? m.relY,
        width: m.width,
        length: m.length,
        wattage: m.wattage || spec.wattage,
        rackingType: m.rackingType || rackingType
      }));
      panelsRef.current = formatted;
      cachedPanelsRef.current = formatted;
      setPlacedPanels(formatted);

      if (onArrayCalculated) {
        onArrayCalculated({
          modulesCount: result.moduleCount ?? result.metrics?.count ?? formatted.length,
          kwp: result.metrics?.capacityKw ?? ((formatted.length * spec.wattage) / 1000),
          panels: formatted,
          roofPolygon: polygonCoords,
          metrics: result.metrics,
          anchor: result.anchor
        });
      }

      // Force immediate synchronous Canvas draw
      drawScene();
      requestRedraw();
    }
  }, [
    map,
    selectedModuleKey,
    orientation,
    tiltDegrees,
    azimuthDegrees,
    setbackMeters,
    rowSpacing,
    colSpacing,
    shadowPitch,
    isAutoPitch, // ★ NEW
    arrayScale,
    frameSizeUp,
    frameSizeWide,
    frameSpacing,
    gridAlignment,
    removedModuleIds,
    onToggleModule,
    onArrayCalculated,
    targetCapacityMode,
    targetKwp,
    gridOffset,
    keepouts,
    rackingType,
    siteLatitude, // ★ NEW
    drawScene,
    requestRedraw
  ]);

  useEffect(() => {
    return () => {
      if (modulesLayerRef.current && map) {
        try {
          map.removeLayer(modulesLayerRef.current);
          modulesLayerRef.current = null;
        } catch (e) { }
      }
    };
  }, [map]);

  // Native anchor marker disabled to keep panels 100% unobstructed.
  // Direct mouse drag on panels handles array translation cleanly.
  useEffect(() => {
    if (nativeAnchorMarkerRef.current && map) {
      try {
        map.removeLayer(nativeAnchorMarkerRef.current);
      } catch (e) { }
      nativeAnchorMarkerRef.current = null;
    }
  }, [map]);

  useEffect(() => {
    return () => {
      if (nativeAnchorMarkerRef.current && map) {
        try {
          map.removeLayer(nativeAnchorMarkerRef.current);
        } catch (e) { }
        nativeAnchorMarkerRef.current = null;
      }
    };
  }, [map]);

  const shiftEdgeAlongNormal = useCallback((poly, edgeIndex, deltaMx, deltaMy) => {
    if (!poly || poly.length < 3 || edgeIndex < 0 || edgeIndex >= poly.length) return null;
    const N = poly.length;
    const nextIndex = (edgeIndex + 1) % N;

    const lat1 = poly[edgeIndex][0], lng1 = poly[edgeIndex][1];
    const lat2 = poly[nextIndex][0], lng2 = poly[nextIndex][1];

    const avgLatRad = ((lat1 + lat2) / 2) * (Math.PI / 180);
    const metersPerLng = 6378137 * (Math.PI / 180) * Math.cos(avgLatRad);
    const metersPerLat = 6378137 * (Math.PI / 180);

    const tx = (lng2 - lng1) * metersPerLng;
    const ty = (lat2 - lat1) * metersPerLat;
    const L = Math.hypot(tx, ty);
    if (L < 0.01) return poly;

    const ux = tx / L;
    const uy = ty / L;

    let nx = -uy;
    let ny = ux;

    const centroid = calculateCentroid(poly);
    const cLat = centroid.lat ?? (Array.isArray(centroid) ? centroid[0] : lat1);
    const cLng = centroid.lng ?? (Array.isArray(centroid) ? centroid[1] : lng1);
    const cx = (cLng - lng1) * metersPerLng;
    const cy = (cLat - lat1) * metersPerLat;

    const toMidX = (tx / 2) - cx;
    const toMidY = (ty / 2) - cy;

    if (nx * toMidX + ny * toMidY < 0) {
      nx = -nx;
      ny = -ny;
    }

    const dist = deltaMx * nx + deltaMy * ny;
    const shiftX = dist * nx;
    const shiftY = dist * ny;

    const dLat = (shiftY / metersPerLat) * (180 / Math.PI);
    const dLng = (shiftX / metersPerLng) * (180 / Math.PI);

    const updated = poly.map(pt => [...pt]);
    updated[edgeIndex] = [lat1 + dLat, lng1 + dLng];
    updated[nextIndex] = [lat2 + dLat, lng2 + dLng];

    return updated;
  }, []);

  runModulePackingRef.current = runModulePacking;
  useEffect(() => {
    runModulePackingRef.current = runModulePacking;
  }, [runModulePacking]);

  // Ensure Racking, Azimuth, and Tilt immediately re-pack and re-render panels
  useEffect(() => {
    const activePoly = (activePolygon && activePolygon.length >= 3)
      ? activePolygon
      : (roofPolygon && roofPolygon.length >= 3 ? roofPolygon : null);

    if (!activePoly || activePoly.length < 3) {
      if (modulesLayerRef.current && map) {
        try {
          map.removeLayer(modulesLayerRef.current);
          modulesLayerRef.current = null;
        } catch (e) { }
      }
      if (cachedPanelsRef && cachedPanelsRef.current) {
        cachedPanelsRef.current = [];
      }
      panelsRef.current = [];
      setPlacedPanels([]);
      requestRedraw();
      return;
    }

    // 1. Sanitize input parameters with safe defaults
    const currentAzimuth = typeof azimuthDegrees === "number" && !isNaN(azimuthDegrees)
      ? azimuthDegrees
      : (Number.isFinite(Number(azimuthDegrees)) ? Number(azimuthDegrees) : 180);
    const currentTilt = typeof tiltDegrees === "number" && !isNaN(tiltDegrees)
      ? tiltDegrees
      : (Number.isFinite(Number(tiltDegrees)) ? Number(tiltDegrees) : 18);
    const currentRacking = rackingType || "L2_ELEVATED";

    // 2. Centroid reference for metric/GPS projection
    const centroid = calculateCentroid(activePoly);
    const cLat = Array.isArray(centroid) ? centroid[0] : (centroid?.lat || 0);
    const cLng = Array.isArray(centroid) ? centroid[1] : (centroid?.lng || 0);

    const spec = MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Jinko Solar Tiger Neo 585W"];
    const lengthM = spec.lengthMm / 1000;
    const widthM = spec.widthMm / 1000;
    const moduleWidth = orientation === "PORTRAIT" ? widthM : lengthM;
    const moduleLength = orientation === "PORTRAIT" ? lengthM : widthM;

    // 3. Re-calculate modules with fresh settings using packModulesOnRoof
    const updatedPanels = packModulesOnRoof(activePoly, {
      orientation,
      arrayScale,
      // ★ FIX (ASLI TILT BUG YAHAN THA): pehle yahan hardcoded
      //   `shadowPitch: Number(shadowPitch || rowSpacing) || 1.55` ja raha tha,
      //   jiski wajah se tilt-linked winter-shadow pitch KABHI trigger nahi hoti thi.
      //   Ab AUTO mode mein rowSpacing/shadowPitch undefined jata hai -> engine
      //   calculateWinterShadowSpacing() se tilt+latitude linked pitch nikalta hai.
      shadowPitch: shadowPitch ?? undefined,
      rowSpacing: isAutoPitch ? undefined : rowSpacing,
      rowSpacingM: isAutoPitch ? undefined : rowSpacing,
      moduleWidth,
      moduleLength,
      azimuthDeg: currentAzimuth,
      azimuthDegrees: currentAzimuth,
      azimuth: currentAzimuth,
      tiltDeg: currentTilt,
      tiltDegrees: currentTilt,
      tilt: currentTilt,
      rackingType: currentRacking,
      setback: setbackMeters,
      setbackMeters,
      colSpacing,
      colSpacingM: colSpacing,
      frameSizeUp,
      frameRows: frameSizeUp,
      frameSizeWide,
      frameCols: frameSizeWide,
      frameSpacing,
      gridAlignment,
      targetCapacityMode,
      targetCount: (targetKwP || targetKwp) ? Math.round(((Number(targetKwP || targetKwp)) * 1000) / (spec.wattage || 585)) : null,
      targetKwp: targetKwP || targetKwp,
      targetKwP: targetKwP || targetKwp,
      gridOffset,
      keepouts,
      wattage: spec.wattage,
      latitude: siteLatitude, // ★ NEW: winter sun angle ke liye site latitude
      refLat: cLat,
      refLng: cLng,
      centroid: { lat: cLat, lng: cLng }
    });

    // 4. Update panel state and ref
    if (updatedPanels && updatedPanels.length > 0) {
      const formatted = updatedPanels.map((m, idx) => ({
        id: m.id || `mod-${idx}`,
        corners: m.cornersGps || m.corners,
        cornersGps: m.cornersGps || m.corners,
        center: m.centerGps || m.center,
        centerGps: m.centerGps || m.center,
        wattage: m.wattage || spec.wattage,
        rackingType: m.rackingType || currentRacking,
        width: m.width,
        length: m.length,
        effectiveLength: m.effectiveLength,
        projectedLength: m.projectedLength,
        arrayScale: m.arrayScale,
        azimuth: m.azimuth,
        tilt: m.tilt,
        orientation: m.orientation,
        rotX: m.rotX ?? m.relX,
        rotY: m.rotY ?? m.relY,
        relX: m.relX ?? m.rotX,
        relY: m.relY ?? m.rotY,
        cX: m.cX,
        cY: m.cY,
        x: m.x,
        y: m.y
      }));

      panelsRef.current = formatted;
      cachedPanelsRef.current = formatted;
      setPlacedPanels(formatted);

      if (onArrayCalculated) {
        onArrayCalculated({
          modulesCount: updatedPanels.length,
          kwp: Math.round(((updatedPanels.length * (spec.wattage || 585)) / 1000) * 10) / 10,
          panels: formatted,
          roofPolygon: activePoly,
          metrics: {
            count: updatedPanels.length,
            capacityKw: Math.round(((updatedPanels.length * (spec.wattage || 585)) / 1000) * 10) / 10
          },
          anchor: [cLat, cLng]
        });
      }
    } else if (cachedPanelsRef.current && cachedPanelsRef.current.length > 0) {
      // If adjusting the scale ever causes the active panels count to become 0, keep displaying the previous array at the new scale so panels NEVER turn invisible
      panelsRef.current = cachedPanelsRef.current;
    }

    // 5. Force canvas repaint immediately
    if (typeof renderCanvas === "function") {
      renderCanvas();
    } else if (typeof requestRedraw === "function") {
      requestRedraw();
    }

    const t1 = setTimeout(() => {
      if (typeof requestRedraw === "function") requestRedraw();
    }, 50);
    const t2 = setTimeout(() => {
      if (typeof requestRedraw === "function") requestRedraw();
    }, 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    azimuthDegrees,
    tiltDegrees,
    rackingType,
    activePolygon,
    roofPolygon,
    selectedModuleKey,
    orientation,
    setbackMeters,
    rowSpacing,
    shadowPitch,
    isAutoPitch, // ★ NEW: pitch mode toggle bhi repack trigger kare
    arrayScale,
    colSpacing,
    frameSizeUp,
    frameSizeWide,
    frameSpacing,
    gridAlignment,
    targetCapacityMode,
    targetKwp,
    targetKwP,
    gridOffset,
    keepouts,
    siteLatitude, // ★ NEW
    renderCanvas,
    requestRedraw,
    onArrayCalculated,
    map
  ]);

  const pointToSegmentDistPx = (px, py, x1, y1, x2, y2) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  const findClosestRoofEdge = (clickPx) => {
    const activePoly = activePolyDragRef.current || roofPolygon;
    if (!activePoly || activePoly.length < 3) return null;
    let closestEdge = null;
    let minDist = Infinity;

    for (let i = 0; i < activePoly.length; i++) {
      const nextIdx = (i + 1) % activePoly.length;
      const pt1 = toPx(activePoly[i][0], activePoly[i][1]);
      const pt2 = toPx(activePoly[nextIdx][0], activePoly[nextIdx][1]);

      const dist = pointToSegmentDistPx(clickPx.x, clickPx.y, pt1.x, pt1.y, pt2.x, pt2.y);
      if (dist < minDist && dist < 28) {
        minDist = dist;

        const lat1 = activePoly[i][0], lng1 = activePoly[i][1];
        const lat2 = activePoly[nextIdx][0], lng2 = activePoly[nextIdx][1];
        const avgLatRad = ((lat1 + lat2) / 2) * (Math.PI / 180);
        const dLngM = (lng2 - lng1) * (Math.PI / 180) * 6378137 * Math.cos(avgLatRad);
        const dLatM = (lat2 - lat1) * (Math.PI / 180) * 6378137;

        let azRad = Math.atan2(dLngM, dLatM);
        let azDeg = (azRad * 180) / Math.PI;
        if (azDeg < 0) azDeg += 360;

        closestEdge = {
          edgeIndex: i,
          azimuthDeg: Math.round(azDeg * 10) / 10,
          dist
        };
      }
    }
    return closestEdge;
  };

  // =========================================================================
  // 4. MOUSE EVENT HANDLERS & INTERACTIVE VERTEX / EDGE DRAGGING ENGINE
  // =========================================================================
  const handleWheel = (e) => {
    if (!map) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mousePt = L.point(e.clientX - rect.left, e.clientY - rect.top);
    const targetLatLng = map.containerPointToLatLng(mousePt);
    if (!targetLatLng || !isFinite(targetLatLng.lat) || !isFinite(targetLatLng.lng)) return;

    if (e.deltaY < 0) {
      map.setZoomAround(targetLatLng, map.getZoom() + 1, { animate: false });
    } else if (e.deltaY > 0) {
      map.setZoomAround(targetLatLng, map.getZoom() - 1, { animate: false });
    }
  };

  const handleMouseDown = (e) => {
    if (!map) return;

    if (e.button === 0) { // Left-click
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const activePoly = activePolyDragRef.current || roofPolygon;

      // ★ NEW: LOCK GUARD — Lock ON hone par vertex/edge/array drag band,
      // lekin map panning (Case 4) free chalti hai.
      if (effLock) {
        isDraggingMapRef.current = true;
        hasDraggedRef.current = false;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        return;
      }

      // 1. DIRECT VERTEX CORNER DRAGGING (Priority #1: within 18px of any corner handle)
      if (activePoly && activePoly.length >= 3) {
        let hitVertexIdx = -1;
        for (let i = 0; i < activePoly.length; i++) {
          const vPt = toPx(activePoly[i][0], activePoly[i][1]);
          const dist = Math.hypot(vPt.x - mouseX, vPt.y - mouseY);
          if (dist <= 18) {
            hitVertexIdx = i;
            break;
          }
        }

        if (hitVertexIdx !== -1) {
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
          if (map.dragging) map.dragging.disable(); // Stop Leaflet map pan while moving corner
          isDraggingVertexRef.current = true;
          draggedVertexIndexRef.current = hitVertexIdx;
          dragStartRoofPolyRef.current = activePoly.map(pt => [...pt]);
          activePolyDragRef.current = activePoly.map(pt => [...pt]);
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          requestRedraw();
          return;
        }
      }

      if (isDrawing) return; // Active drawing modes use handleClick / handleDoubleClick

      // 2. EDGE SHIFTING (Priority #2: within 18px of an edge)
      const edge = findClosestRoofEdge({ x: mouseX, y: mouseY });
      if (edge && edge.dist <= 18 && activePoly && activePoly.length >= 3) {
        e.stopPropagation();
        e.preventDefault();
        if (map.dragging) map.dragging.disable();
        isDraggingEdgeRef.current = true;
        draggedEdgeIndexRef.current = edge.edgeIndex;
        const clickGps = toGps(mouseX, mouseY);
        dragStartMouseGpsRef.current = clickGps;
        dragStartRoofPolyRef.current = activePoly.map(pt => [...pt]);
        activePolyDragRef.current = activePoly.map(pt => [...pt]);
        if (canvasRef.current) canvasRef.current.style.cursor = "pointer";
        requestRedraw();
        return;
      }

      // 3. ARRAY DRAGGING (★ NEW: Move Mode (✥) ya isAdjustingPosition ON ho tabhi)
      const isAnchorHit = moveActive && anchorPxRef.current && panelsRef.current.length > 0 &&
        Math.hypot(mouseX - anchorPxRef.current.x, mouseY - anchorPxRef.current.y) < 26;

      const bb = arrayBboxPxRef.current;
      const pad = 10;
      const isArrayHit = moveActive && bb && panelsRef.current.length > 0 &&
        (mouseX >= bb.minX - pad && mouseX <= bb.maxX + pad && mouseY >= bb.minY - pad && mouseY <= bb.maxY + pad);

      if ((isAnchorHit || isArrayHit) && panelsRef.current.length > 0 && activeCadTool !== "PAN_VIEW") {
        if (map.dragging) map.dragging.disable();
        isDraggingArrayRef.current = true;
        isDraggingAnchorRef.current = isAnchorHit;
        hasDraggedRef.current = false;
        const startGps = toGps(mouseX, mouseY);
        dragStartMouseGpsRef.current = startGps;
        dragStartScreenPxRef.current = { x: e.clientX, y: e.clientY };
        dragStartOffsetRef.current = { ...(gridOffsetRef.current || { x: 0, y: 0 }) };
        dragDeltaGpsRef.current = { lat: 0, lng: 0 };
        dragDeltaMetersRef.current = { ...(gridOffsetRef.current || { x: 0, y: 0 }) };
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        e.stopPropagation();
        e.preventDefault();
        requestRedraw();
        return;
      }

      // 4. MAP PANNING ON EMPTY CANVAS (Smooth, non-blocking drag)
      isDraggingMapRef.current = true;
      hasDraggedRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e) => {
    if (!map) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    mousePosPxRef.current = { x: mouseX, y: mouseY };
    const gps = toGps(mouseX, mouseY);
    if (gps) mouseGpsRef.current = gps;

    // -------------------------------------------------------------
    // CASE A: DRAGGING CORNER VERTEX HANDLE (Highest Priority)
    // -------------------------------------------------------------
    if (isDraggingVertexRef.current && draggedVertexIndexRef.current !== -1) {
      const vIdx = draggedVertexIndexRef.current;
      const curGps = toGps(mouseX, mouseY);
      if (curGps && isFinite(curGps.lat) && isFinite(curGps.lng)) {
        const base = activePolyDragRef.current || roofPolygon;
        if (base && vIdx >= 0 && vIdx < base.length) {
          const newPoly = base.map((pt, idx) => {
            if (idx === vIdx) {
              return [parseFloat(curGps.lat.toFixed(7)), parseFloat(curGps.lng.toFixed(7))];
            }
            return [...pt];
          });
          activePolyDragRef.current = newPoly;
          requestRedraw();
        }
      }
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      return;
    }

    // -------------------------------------------------------------
    // CASE B: DRAGGING EDGE LINE (Parallel Normal Shift)
    // -------------------------------------------------------------
    if (isDraggingEdgeRef.current && dragStartMouseGpsRef.current && dragStartRoofPolyRef.current) {
      const curGps = toGps(mouseX, mouseY);
      const startGps = dragStartMouseGpsRef.current;
      if (curGps && startGps) {
        const avgLatRad = ((startGps.lat + curGps.lat) / 2) * (Math.PI / 180);
        const metersPerLng = 6378137 * (Math.PI / 180) * Math.cos(avgLatRad);
        const metersPerLat = 6378137 * (Math.PI / 180);
        const deltaMx = (curGps.lng - startGps.lng) * metersPerLng;
        const deltaMy = (curGps.lat - startGps.lat) * metersPerLat;

        const newPoly = shiftEdgeAlongNormal(dragStartRoofPolyRef.current, draggedEdgeIndexRef.current, deltaMx, deltaMy);
        if (newPoly) {
          activePolyDragRef.current = newPoly;
          requestRedraw();
        }
      }
      if (canvasRef.current) canvasRef.current.style.cursor = "pointer";
      return;
    }

    // -------------------------------------------------------------
    // CASE C: DRAGGING ARRAY OFFSET (Translation)
    // -------------------------------------------------------------
    if (isDraggingArrayRef.current) {
      const dxPx = e.clientX - dragStartScreenPxRef.current.x;
      const dyPx = e.clientY - dragStartScreenPxRef.current.y;
      if (Math.hypot(dxPx, dyPx) > 2) hasDraggedRef.current = true;

      const currentGps = toGps(mouseX, mouseY);
      const startGps = dragStartMouseGpsRef.current;
      if (currentGps && startGps) {
        const dLat = currentGps.lat - startGps.lat;
        const dLng = currentGps.lng - startGps.lng;
        dragDeltaGpsRef.current = { lat: dLat, lng: dLng };

        const midLatRad = (startGps.lat * Math.PI) / 180;
        const dLngM = dLng * (Math.PI / 180) * 6378137 * Math.cos(midLatRad);
        const dLatM = dLat * (Math.PI / 180) * 6378137;
        dragDeltaMetersRef.current = {
          x: Math.round(dLngM * 10) / 10,
          y: Math.round(dLatM * 10) / 10
        };
      }
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      requestRedraw();
      return;
    }

    // -------------------------------------------------------------
    // CASE D: DRAGGING EMPTY CANVAS TO PAN MAP
    // -------------------------------------------------------------
    if (isDraggingMapRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 3) hasDraggedRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      map.panBy([-dx, -dy], { animate: false });
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      return;
    }

    // -------------------------------------------------------------
    // CASE E: ACTIVE DRAWING (Rubber-band line & snap indicator)
    // -------------------------------------------------------------
    if (isDrawing) {
      const activePoints = activePolyPointsRef.current;
      if ((activeCadTool === "FIELD_SEGMENT" || activeCadTool === "ROOF_PERIMETER") && activePoints.length >= 3) {
        const firstPx = toPx(activePoints[0][0], activePoints[0][1]);
        const dist = Math.hypot(mouseX - firstPx.x, mouseY - firstPx.y);
        setIsNearFirstPoint(dist < 18);
      } else {
        if (isNearFirstPoint) setIsNearFirstPoint(false);
      }
      if (canvasRef.current) canvasRef.current.style.cursor = "crosshair";
      requestRedraw();
      return;
    }

    // -------------------------------------------------------------
    // CASE F: HOVER DETECTION & CURSOR FEEDBACK (When not dragging)
    // -------------------------------------------------------------
    const activePoly = activePolyDragRef.current || roofPolygon;
    let hitVertexIdx = -1;
    let hitEdgeIdx = -1;

    if (activePoly && activePoly.length >= 3 && !effLock) {
      // 1. Check Vertex Corner Hover (radius <= 18px)
      for (let i = 0; i < activePoly.length; i++) {
        const vPt = toPx(activePoly[i][0], activePoly[i][1]);
        if (Math.hypot(mouseX - vPt.x, mouseY - vPt.y) <= 18) {
          hitVertexIdx = i;
          break;
        }
      }

      // 2. Check Edge Hover (if not on vertex)
      if (hitVertexIdx === -1) {
        const edge = findClosestRoofEdge({ x: mouseX, y: mouseY });
        if (edge && edge.dist <= 18) {
          hitEdgeIdx = edge.edgeIndex;
        }
      }
    }

    // Ensure Leaflet map drag is disabled when cursor touches corner vertices so map pan never interferes with vertex grab
    if (hitVertexIdx !== -1) {
      if (map && map.dragging && map.dragging.enabled()) {
        map.dragging.disable();
      }
    } else if (!isDraggingVertexRef.current && !isDraggingEdgeRef.current && !isDraggingArrayRef.current && !isDrawing) {
      if (map && map.dragging && !map.dragging.enabled()) {
        map.dragging.enable();
      }
    }

    if (hoveredVertexIndexRef.current !== hitVertexIdx) {
      hoveredVertexIndexRef.current = hitVertexIdx;
      requestRedraw();
    }
    if (hoveredEdgeIndexRef.current !== hitEdgeIdx) {
      hoveredEdgeIndexRef.current = hitEdgeIdx;
      requestRedraw();
    }

    // Check Module Hover (for toggle click)
    let foundHoverModId = null;
    if (hitVertexIdx === -1 && hitEdgeIdx === -1 && panelsRef.current && panelsRef.current.length > 0) {
      for (const mod of panelsRef.current) {
        const rawCorners = mod.corners || mod.cornersGps;
        if (!rawCorners || rawCorners.length < 4) continue;
        const poly = rawCorners.map(([lat, lng]) => toPx(lat, lng));
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i].x, yi = poly[i].y;
          const xj = poly[j].x, yj = poly[j].y;
          const intersect = ((yi > mouseY) !== (yj > mouseY)) && (mouseX < ((xj - xi) * (mouseY - yi)) / (yj - yi) + xi);
          if (inside) inside = !inside;
        }
        if (inside) {
          foundHoverModId = mod.id;
          break;
        }
      }
    }
    if (hoveredModuleIdRef.current !== foundHoverModId) {
      hoveredModuleIdRef.current = foundHoverModId;
      requestRedraw();
    }

    // Apply cursor styling
    if (canvasRef.current) {
      if (hitVertexIdx !== -1) {
        canvasRef.current.style.cursor = "grab"; // Prompt requirement: "cursor: grab on hover"
      } else if (hitEdgeIdx !== -1) {
        canvasRef.current.style.cursor = "pointer";
      } else if (foundHoverModId) {
        canvasRef.current.style.cursor = "pointer";
      } else if (activeCadTool === "PAN_VIEW") {
        canvasRef.current.style.cursor = "grab";
      } else {
        canvasRef.current.style.cursor = "default";
      }
    }
  };

  const handleMouseUp = (e) => {
    // 1. FINISH VERTEX DRAGGING & IMMEDIATELY RE-PACK MODULES
    if (isDraggingVertexRef.current) {
      const finalPoly = activePolyDragRef.current;
      isDraggingVertexRef.current = false;
      draggedVertexIndexRef.current = -1;
      activePolyDragRef.current = null;
      dragStartRoofPolyRef.current = null;

      if (map && map.dragging) {
        map.dragging.enable(); // Restore Leaflet pan
      }

      if (canvasRef.current) {
        canvasRef.current.style.cursor = hoveredVertexIndexRef.current !== -1 ? "grab" : "default";
      }

      if (finalPoly && finalPoly.length >= 3) {
        if (setRoofPolygon) setRoofPolygon(finalPoly);
        if (runModulePackingRef.current) {
          runModulePackingRef.current(finalPoly); // Re-pack modules for newly adjusted roof polygon!
        }
      }
      requestRedraw();
      return;
    }

    // 2. FINISH EDGE DRAGGING & RE-PACK MODULES
    if (isDraggingEdgeRef.current) {
      const finalPoly = activePolyDragRef.current || dragStartRoofPolyRef.current;
      isDraggingEdgeRef.current = false;
      draggedEdgeIndexRef.current = -1;
      activePolyDragRef.current = null;
      dragStartMouseGpsRef.current = null;
      dragStartRoofPolyRef.current = null;

      if (map && map.dragging) map.dragging.enable();
      if (finalPoly && setRoofPolygon) setRoofPolygon(finalPoly);
      if (finalPoly && runModulePackingRef.current) runModulePackingRef.current(finalPoly);
      requestRedraw();
      return;
    }

    // 3. FINISH ARRAY DRAGGING
    if (isDraggingArrayRef.current || isDraggingAnchorRef.current) {
      isDraggingArrayRef.current = false;
      isDraggingAnchorRef.current = false;
      if (map && map.dragging) map.dragging.enable();

      if (hasDraggedRef.current && dragDeltaGpsRef.current) {
        const dLat = dragDeltaGpsRef.current.lat || 0;
        const dLng = dragDeltaGpsRef.current.lng || 0;
        if (dLat !== 0 || dLng !== 0) {
          if (panelsRef.current) {
            panelsRef.current = panelsRef.current.map(p => {
              const rawCorners = p.corners || p.cornersGps || [];
              const shiftedCorners = rawCorners.map(([cLat, cLng]) => [cLat + dLat, cLng + dLng]);
              const rawCenter = p.center || p.centerGps || [0, 0];
              const shiftedCenter = [rawCenter[0] + dLat, rawCenter[1] + dLng];
              return {
                ...p,
                corners: shiftedCorners,
                cornersGps: shiftedCorners,
                center: shiftedCenter,
                centerGps: shiftedCenter
              };
            });
          }

          if (setRoofPolygon && roofPolygon && roofPolygon.length >= 3) {
            const updatedRoof = roofPolygon.map(([pLat, pLng]) => [pLat + dLat, pLng + dLng]);
            setRoofPolygon(updatedRoof);
          }
        }
      }

      dragDeltaGpsRef.current = { lat: 0, lng: 0 };
      if (canvasRef.current) {
        canvasRef.current.style.cursor = isHoveringArrayRef.current ? "grab" : "default";
      }
      requestRedraw();
      return;
    }

    // 4. FINISH MAP DRAG
    if (isDraggingMapRef.current) {
      isDraggingMapRef.current = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "default";
      }
      return;
    }
  };

  const handleMouseLeave = () => {
    if (!isDraggingVertexRef.current && !isDraggingEdgeRef.current && !isDraggingArrayRef.current) {
      hoveredVertexIndexRef.current = -1;
      hoveredEdgeIndexRef.current = -1;
      if (map && map.dragging && !map.dragging.enabled() && !isDrawing) {
        map.dragging.enable();
      }
      requestRedraw();
    }
  };

  useEffect(() => {
    const onWindowMouseUp = (e) => {
      if (isDraggingVertexRef.current || isDraggingEdgeRef.current || isDraggingArrayRef.current || isDraggingMapRef.current) {
        handleMouseUp(e);
      }
      if (!isDrawing && map?.dragging && !map.dragging.enabled()) {
        map.dragging.enable();
      }
    };
    const onWindowMouseMove = (e) => {
      if (isDraggingVertexRef.current || isDraggingEdgeRef.current || isDraggingArrayRef.current || isDraggingMapRef.current) {
        handleMouseMove(e);
      }
    };
    window.addEventListener("mouseup", onWindowMouseUp);
    window.addEventListener("mousemove", onWindowMouseMove);
    return () => {
      window.removeEventListener("mouseup", onWindowMouseUp);
      window.removeEventListener("mousemove", onWindowMouseMove);
    };
  }, [map, isDrawing, handleMouseUp, handleMouseMove]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const activePoints = activePolyPointsRef.current;
    if ((activeCadTool === "FIELD_SEGMENT" || activeCadTool === "ROOF_PERIMETER") && activePoints.length >= 3) {
      finalizeFieldSegment([...activePoints]);
    }
  };

  const handleContextMenu = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = findClosestRoofEdge({ x, y });
    if (edge) {
      const snapDeg = Math.round(edge.azimuthDeg);
      // ★ FIX: Right-click pe foran snap band — azimuth ab SIRF menu option
      // click par set hoga (handleApplyEdgeAzimuth se). HelioScope behavior.
      setEdgeMenu({
        show: true,
        x: Math.min(x, rect.width - 240),
        y: Math.min(y, rect.height - 180),
        azimuthDeg: snapDeg,
        edgeIndex: edge.edgeIndex,
        justSnapped: true
      });
    } else {
      setEdgeMenu(prev => ({ ...prev, show: false }));
    }
  };

  const finalizeFieldSegment = (points) => {
    if (!points || points.length < 3) return;
    if (setRoofPolygon) {
      setRoofPolygon(points);
    }
    activePolyPointsRef.current = [];
    if (setActiveDrawingPoints) {
      setActiveDrawingPoints([]);
    }
    setIsNearFirstPoint(false);
    runModulePacking(points);
    fitMapToPanels(points);
    if (setActiveCadTool) {
      setActiveCadTool("MANUAL_INSPECT");
    }
    requestRedraw();
  };

  const handleApplyEdgeAzimuth = (angleDeg) => {
    if (setAzimuthDegrees) {
      setAzimuthDegrees(angleDeg);
    }
    setEdgeMenu(prev => ({ ...prev, show: false }));
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if ((isLocked || localLock) || !map) return; // ★ NEW: localLock bhi clicks guard kare

    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    if (edgeMenu.show) {
      setEdgeMenu(prev => ({ ...prev, show: false }));
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gps = toGps(x, y);
    if (!gps) return;

    if (activeCadTool === "PAN_VIEW") return;

    if (activeCadTool === "FIELD_SEGMENT" || activeCadTool === "ROOF_PERIMETER") {
      const activePoints = activePolyPointsRef.current;
      const newPt = [parseFloat(gps.lat.toFixed(7)), parseFloat(gps.lng.toFixed(7))];

      if (activePoints.length >= 3) {
        const firstPx = toPx(activePoints[0][0], activePoints[0][1]);
        const distToFirst = Math.hypot(x - firstPx.x, y - firstPx.y);
        if (distToFirst < 22 || isNearFirstPoint) {
          finalizeFieldSegment([...activePoints]);
          return;
        }
      }

      const updated = [...activePoints, newPt];
      activePolyPointsRef.current = updated;
      if (setActiveDrawingPoints) {
        setActiveDrawingPoints(updated);
      }
      requestRedraw();
      return;
    }

    if (activeCadTool === "ROOF_BOX") {
      if (!p1Ref.current) {
        p1Ref.current = gps;
        requestRedraw();
      } else {
        const p1 = p1Ref.current;
        const p2 = gps;
        const minLat = Math.min(p1.lat, p2.lat);
        const maxLat = Math.max(p1.lat, p2.lat);
        const minLng = Math.min(p1.lng, p2.lng);
        const maxLng = Math.max(p1.lng, p2.lng);

        const rectPolygon = [
          [maxLat, minLng],
          [maxLat, maxLng],
          [minLat, maxLng],
          [minLat, minLng]
        ];

        finalizeFieldSegment(rectPolygon);
        p1Ref.current = null;
      }
      return;
    }

    if (activeCadTool === "OBSTACLE_CIRCLE") {
      if (onAddObstacle) {
        onAddObstacle({
          lat: parseFloat(gps.lat.toFixed(7)),
          lng: parseFloat(gps.lng.toFixed(7)),
          radiusM: parseFloat(newObstacleRadius) || 1.5,
          heightM: parseFloat(newObstacleHeight) || 2.0,
          name: "Water Tank / HVAC Keepout"
        });
      }
      if (setActiveCadTool) setActiveCadTool("MANUAL_INSPECT");
      return;
    }

    if (activeCadTool === "MANUAL_INSPECT") {
      const edge = findClosestRoofEdge({ x, y });
      if (edge) {
        setEdgeMenu({
          show: true,
          x: Math.min(x, rect.width - 240),
          y: Math.min(y, rect.height - 180),
          azimuthDeg: edge.azimuthDeg,
          edgeIndex: edge.edgeIndex
        });
        return;
      }

      if (onToggleModule) {
        for (const mod of panelsRef.current) {
          const corners = mod.corners || mod.cornersGps;
          if (!corners) continue;
          const poly = corners.map(([lat, lng]) => toPx(lat, lng));
          let inside = false;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
            if (intersect) inside = !inside;
          }
          if (inside) {
            onToggleModule(mod.id);
            requestRedraw();
            break;
          }
        }
      }
    }
  };

  // ★ NEW: Floating widget styles (dark glass theme — CAD style)
  const chipStyle = (active) => ({
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "monospace",
    cursor: "pointer",
    border: "1px solid",
    borderColor: active ? "#38bdf8" : "rgba(56,189,248,0.25)",
    background: active ? "rgba(56,189,248,0.25)" : "rgba(8,15,30,0.82)",
    color: active ? "#7dd3fc" : "#94a3b8",
    backdropFilter: "blur(6px)"
  });

  const ctrlBtnStyle = (active) => ({
    padding: "5px 10px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    border: "1px solid",
    borderColor: active ? "#38bdf8" : "rgba(56,189,248,0.25)",
    background: active ? "rgba(56,189,248,0.22)" : "rgba(8,15,30,0.85)",
    color: active ? "#7dd3fc" : "#cbd5e1",
    boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
    backdropFilter: "blur(6px)"
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-[600]">
      <canvas
        id="cad-overlay"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        className="w-full h-full pointer-events-auto"
      />

      {/* ★ NEW: Azimuth Quick Presets (0°-270°) — map ke top-left floating chips */}
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          zIndex: 950,
          display: "flex",
          gap: 5,
          flexWrap: "wrap",
          maxWidth: 320,
          pointerEvents: "auto"
        }}
      >
        {[0, 45, 90, 135, 180, 225, 270].map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              if (setAzimuthDegrees) setAzimuthDegrees(a);
            }}
            style={chipStyle(Math.round(azimuthDegrees) === a)}
            title={`Set Azimuth ${a}°`}
          >
            {a}°
          </button>
        ))}
        <span
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
            background: "rgba(8,15,30,0.82)",
            border: "1px solid rgba(250,204,21,0.35)",
            color: "#facc15",
            backdropFilter: "blur(6px)"
          }}
        >
          AZ {Math.round(azimuthDegrees)}°
        </span>
      </div>

      {/* ★ NEW: Array Lock + Move Mode + Shadow Pitch Mode — map ke top-right */}
      <div
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          zIndex: 950,
          display: "flex",
          gap: 6,
          pointerEvents: "auto"
        }}
      >
        <button
          type="button"
          onClick={() => setPitchAuto(v => !v)}
          style={ctrlBtnStyle(isAutoPitch)}
          title={isAutoPitch ? "Row pitch: AUTO (winter shadow-safe, tilt-linked)" : "Row pitch: MANUAL (rowSpacing slider)"}
        >
          {isAutoPitch ? "☀ Pitch AUTO" : "↔ Pitch MANUAL"}
        </button>
        <button
          type="button"
          onClick={() => setLocalMove(v => !v)}
          style={ctrlBtnStyle(moveActive)}
          title="Move mode: ON kar ke array body ko drag kar ke reposition karo"
        >
          ✥ Move {moveActive ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={() => setLocalLock(v => !v)}
          style={ctrlBtnStyle(effLock)}
          title="Lock: array/vertex/edge drag band — sirf map pan free"
        >
          {effLock ? "🔒 Locked" : "🔓 Unlocked"}
        </button>
      </div>

      {/* Floating Right-Click Roof Edge Alignment Context Menu */}
      {edgeMenu.show && (
        <div
          style={{ left: edgeMenu.x, top: edgeMenu.y }}
          className="absolute z-[1000] pointer-events-auto bg-white backdrop-blur-md border border-slate-200 rounded-xl p-2 shadow-2xl space-y-1 text-xs min-w-[230px] animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 py-1 border-b border-slate-100 flex items-center justify-between">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Snapped to Roof Edge
            </span>
            <span className="text-emerald-700 font-mono font-bold">{edgeMenu.azimuthDeg}°</span>
          </div>
          <button
            type="button"
            onClick={() => handleApplyEdgeAzimuth(edgeMenu.azimuthDeg)}
            className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 text-emerald-800 font-bold rounded-lg transition flex items-center justify-between cursor-pointer"
          >
            <span>Keep parallel to this edge</span>
            <span className="font-mono text-[11px]">{edgeMenu.azimuthDeg}°</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyEdgeAzimuth((edgeMenu.azimuthDeg + 90) % 360)}
            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition flex items-center justify-between cursor-pointer"
          >
            <span>Align perpendicular (90°)</span>
            <span className="font-mono text-[11px]">{(edgeMenu.azimuthDeg + 90) % 360}°</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyEdgeAzimuth((edgeMenu.azimuthDeg + 180) % 360)}
            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition flex items-center justify-between cursor-pointer"
          >
            <span>Reverse edge orientation (180°)</span>
            <span className="font-mono text-[11px]">{(edgeMenu.azimuthDeg + 180) % 360}°</span>
          </button>
          <button
            type="button"
            onClick={() => setEdgeMenu({ show: false, x: 0, y: 0, azimuthDeg: 0, edgeIndex: -1 })}
            className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 pt-1 cursor-pointer"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
});

export default HelioScopeCanvasOverlay;