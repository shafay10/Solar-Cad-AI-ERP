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
 * HelioScopeCanvasOverlay — Production-Grade 60 FPS HTML5 Vector CAD Engine
 * v2.6: simOverride (Shading sliders live-sync shadows on map), Sim widget
 * hidden on Shading tab, dramatic sim shadows (3.5x / 420px cap), Move
 * priority drag, MANUAL ROTATE gizmo (orange handle above array), keepout
 * labels, crash guard, edge-align 42px, single-scaling render (engine packs
 * at arrayScale — no double-scaling runaway).
 */
function renderRackingUnderneath(ctx, cornersPx, rackingType, showShadows) {
  if (!ctx || !cornersPx || cornersPx.length < 4) return;
  try {
    const norm = String(rackingType || "").toUpperCase();
    const isL3 = norm.includes("L3");
    const isL2 = norm.includes("L2") && !isL3;
    const isFlush = !isL2 && !isL3;

    const edge01 = Math.hypot(cornersPx[1].x - cornersPx[0].x, cornersPx[1].y - cornersPx[0].y);
    const edge03 = Math.hypot(cornersPx[3].x - cornersPx[0].x, cornersPx[3].y - cornersPx[0].y);
    const minDim = Math.min(edge01, edge03);
    const scalePx = Math.max(6, minDim / 1.13);

    if (isFlush) {
      ctx.save();
      ctx.lineCap = "round";
      const r1Start = { x: cornersPx[0].x * 0.8 + cornersPx[1].x * 0.2, y: cornersPx[0].y * 0.8 + cornersPx[1].y * 0.2 };
      const r1End = { x: cornersPx[3].x * 0.8 + cornersPx[2].x * 0.2, y: cornersPx[3].y * 0.8 + cornersPx[2].y * 0.2 };
      const r2Start = { x: cornersPx[0].x * 0.2 + cornersPx[1].x * 0.8, y: cornersPx[0].y * 0.2 + cornersPx[1].y * 0.8 };
      const r2End = { x: cornersPx[3].x * 0.2 + cornersPx[2].x * 0.8, y: cornersPx[3].y * 0.2 + cornersPx[2].y * 0.8 };
      ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(r1Start.x + 1, r1Start.y + 1);
      ctx.lineTo(r1End.x + 1, r1End.y + 1);
      ctx.moveTo(r2Start.x + 1, r2Start.y + 1);
      ctx.lineTo(r2End.x + 1, r2End.y + 1);
      ctx.stroke();
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

    const heightM = isL3 ? 2.5 : 1.5;
    const legDropPx = Math.min(isL3 ? 22 : 14, Math.max(isL3 ? 8 : 5, heightM * scalePx * 0.18));

    ctx.save();
    const pillars = cornersPx.map(p => ({
      topX: p.x, topY: p.y, baseX: p.x, baseY: p.y + legDropPx
    }));

    if (showShadows) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
      pillars.forEach(pil => {
        ctx.beginPath();
        ctx.ellipse(pil.baseX + 1, pil.baseY + 1, isL3 ? 6 : 4.5, isL3 ? 3.5 : 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
      ctx.lineWidth = isL3 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(pillars[0].baseX, pillars[0].baseY);
      ctx.lineTo(pillars[1].baseX, pillars[1].baseY);
      ctx.moveTo(pillars[3].baseX, pillars[3].baseY);
      ctx.lineTo(pillars[2].baseX, pillars[2].baseY);
      ctx.stroke();
    }

    pillars.forEach(pil => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(pil.baseX - (isL3 ? 3.5 : 2.5), pil.baseY - (isL3 ? 3 : 2), isL3 ? 7 : 5, isL3 ? 5 : 4);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(pil.baseX - 1, pil.baseY - 1, 2, 2);
    });

    if (isL3) {
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(pillars[0].baseX, pillars[0].baseY);
      ctx.lineTo(pillars[1].baseX, pillars[1].baseY);
      ctx.moveTo(pillars[3].baseX, pillars[3].baseY);
      ctx.lineTo(pillars[2].baseX, pillars[2].baseY);
      ctx.moveTo(pillars[0].topX, pillars[0].topY + legDropPx * 0.5);
      ctx.lineTo(pillars[1].topX, pillars[1].topY + legDropPx * 0.5);
      ctx.moveTo(pillars[3].topX, pillars[3].topY + legDropPx * 0.5);
      ctx.lineTo(pillars[2].topX, pillars[2].topY + legDropPx * 0.5);
      ctx.stroke();
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
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(pillars[0].topX, pillars[0].topY + legDropPx * 0.3);
      ctx.lineTo(pillars[3].baseX, pillars[3].baseY);
      ctx.moveTo(pillars[1].topX, pillars[1].topY + legDropPx * 0.3);
      ctx.lineTo(pillars[2].baseX, pillars[2].baseY);
      ctx.moveTo(pillars[0].baseX, pillars[0].baseY);
      ctx.lineTo(pillars[3].baseX, pillars[3].baseY);
      ctx.moveTo(pillars[1].baseX, pillars[1].baseY);
      ctx.lineTo(pillars[2].baseX, pillars[2].baseY);
      ctx.stroke();
    }

    pillars.forEach(pil => {
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = isL3 ? 3.5 : 2.8;
      ctx.beginPath();
      ctx.moveTo(pil.topX, pil.topY);
      ctx.lineTo(pil.baseX, pil.baseY);
      ctx.stroke();
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
  selectedModuleKey = "Trina Solar Vertex 550W",
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
  manualSegments = [],
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
  rackingType = "L2_ELEVATED",
  simOverride = false
}, ref) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const isDrawScheduledRef = useRef(false);
  const drawSceneRef = useRef(null);
  const [placedPanels, setPlacedPanels] = useState([]);

  const [localLock, setLocalLock] = useState(false);
  const [localMove, setLocalMove] = useState(false);
  const [pitchAuto, setPitchAuto] = useState(true);

  const [timeSim, setTimeSim] = useState(false);
  const [sunHour, setSunHour] = useState(12);
  const [sunDay, setSunDay] = useState(172);
  const [playing, setPlaying] = useState(false);
  const timeSimRef = useRef(false);
  const simSunRef = useRef({ elevationDeg: 45, azimuthDeg: 180 });
  const playIntervalRef = useRef(null);

  const toggleSunPlay = () => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      setPlaying(false);
      return;
    }
    setPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setSunHour(h => (h >= 18.5 ? 5.5 : Math.round((h + 0.25) * 100) / 100));
    }, 120);
  };

  const seasonPresets = [
    { label: "Jun 21", day: 172 },
    { label: "Mar/Sep 21", day: 80 },
    { label: "Dec 21", day: 355 }
  ];

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

  useEffect(() => {
    if (!timeSim || simOverride) {
      timeSimRef.current = false;
      requestRedraw();
      return;
    }
    simSunRef.current = calculateSolarPosition(siteLatitude, sunDay, sunHour);
    timeSimRef.current = true;
    requestRedraw();
  }, [timeSim, sunDay, sunHour, siteLatitude, requestRedraw, simOverride]);

  useEffect(() => () => {
    if (playIntervalRef.current) clearInterval(playIntervalRef.current);
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

  const p1Ref = useRef(null);
  const mousePosPxRef = useRef(null);
  const mouseGpsRef = useRef(null);
  const panelsRef = useRef([]);
  const cachedPanelsRef = useRef([]);
  window.__helioScopePanelsRef = panelsRef;

  useEffect(() => {
    const current = (panelsRef.current && panelsRef.current.length > 0) ? panelsRef.current : placedPanels;
    if (Array.isArray(current) && current.length > 0) {
      cachedPanelsRef.current = current;
    }
  }, [placedPanels]);

  const modulesLayerRef = useRef(null);
  const boundsRef = useRef(null);
  const hoveredModuleIdRef = useRef(null);
  const isDraggingMapRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  const anchorPxRef = useRef(null);
  const nativeAnchorMarkerRef = useRef(null);
  const runModulePackingRef = useRef(null);
  const isDraggingAnchorRef = useRef(false);
  const isHoveringAnchorRef = useRef(false);
  const gridOffsetRef = useRef(gridOffset);
  useEffect(() => {
    gridOffsetRef.current = gridOffset;
  }, [gridOffset]);

  const arrayBboxPxRef = useRef(null);
  const isDraggingArrayRef = useRef(false);
  const isHoveringArrayRef = useRef(false);
  const dragStartMouseGpsRef = useRef(null);
  const dragStartScreenPxRef = useRef({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });
  const dragDeltaGpsRef = useRef({ lat: 0, lng: 0 });
  const dragDeltaMetersRef = useRef({ x: 0, y: 0 });

  const activePolyDragRef = useRef(null);
  const hoveredEdgeIndexRef = useRef(-1);
  const isDraggingEdgeRef = useRef(false);
  const draggedEdgeIndexRef = useRef(-1);
  const hoveredVertexIndexRef = useRef(-1);
  const isDraggingVertexRef = useRef(false);
  const draggedVertexIndexRef = useRef(-1);
  const dragStartRoofPolyRef = useRef(null);

  const activePolyPointsRef = useRef([]);
  const [isNearFirstPoint, setIsNearFirstPoint] = useState(false);

  // MANUAL ROTATE gizmo refs
  const rotateHandlePxRef = useRef(null);
  const arrayCenterPxRef = useRef(null);
  const isRotatingRef = useRef(false);
  const rotateStartAngleRef = useRef(0);
  const rotateStartAzRef = useRef(180);

  useEffect(() => {
    if (Array.isArray(activeDrawingPoints)) {
      activePolyPointsRef.current = activeDrawingPoints;
      requestRedraw();
    }
  }, [activeDrawingPoints, requestRedraw]);

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

  const [edgeMenu, setEdgeMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    azimuthDeg: 0,
    edgeIndex: -1
  });

  const effLock = isLocked || localLock;
  const moveActive = isAdjustingPosition || localMove;
  const isAutoPitch = pitchAuto && (shadowPitch === null || shadowPitch === undefined);

  const isDrawing = activeCadTool === "FIELD_SEGMENT" || activeCadTool === "ROOF_PERIMETER" || activeCadTool === "ROOF_BOX" || activeCadTool === "OBSTACLE_CIRCLE";

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

    if (effLock && !isDrawing) {
      map.dragging?.disable();
    }
  }, [map, isDrawing, effLock]);

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

  const distanceBetweenGps = useCallback((p1, p2) => {
    if (!map || !p1 || !p2) return 0;
    try {
      return Math.round(map.distance(L.latLng(p1[0], p1[1]), L.latLng(p2[0], p2[1])) * 10) / 10;
    } catch {
      return 0;
    }
  }, [map]);

  // =========================================================================
  // 2. CANVAS VECTOR SCENE RENDERER
  // =========================================================================
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;

    const ctx = canvas.getContext("2d");
    const container = map.getContainer();
    if (!container) return;

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

    // A. COMPLETED ROOFTOP CAD BOUNDARY
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
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      if (setbackMeters > 0) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
      }
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

    // B. IN-PROGRESS FIELD SEGMENT DRAWING
    const activePoints = activePolyPointsRef.current;
    if ((activeCadTool === "FIELD_SEGMENT" || activeCadTool === "ROOF_PERIMETER") && activePoints.length > 0) {
      ctx.save();
      ctx.beginPath();
      const firstPx = toPx(activePoints[0][0], activePoints[0][1]);
      ctx.moveTo(firstPx.x, firstPx.y);
      for (let i = 1; i < activePoints.length; i++) {
        const pt = toPx(activePoints[i][0], activePoints[i][1]);
        ctx.lineTo(pt.x, pt.y);
      }
      if (mousePosPxRef.current) {
        ctx.lineTo(mousePosPxRef.current.x, mousePosPxRef.current.y);
      }
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
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

    // C. TWO-CLICK SNAP BOX PREVIEW
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

    // SnapBox first-click marker
    if (activeCadTool === "ROOF_BOX" && p1Ref.current) {
      const p1px = toPx(p1Ref.current.lat, p1Ref.current.lng);
      ctx.save();
      ctx.beginPath();
      ctx.arc(p1px.x, p1px.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("Start — click the second corner now", p1px.x + 12, p1px.y - 10);
      ctx.restore();
    }

    // D. PHOTOVOLTAIC MODULES MATRIX
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

    const manualPanelsList = Array.isArray(manualSegments)
      ? manualSegments.flatMap(seg => seg.panels || [])
      : [];

    const panels = [...safePanels, ...manualPanelsList];
    const deltaLat = isDraggingArrayRef.current ? (dragDeltaGpsRef.current?.lat || 0) : 0;
    const deltaLng = isDraggingArrayRef.current ? (dragDeltaGpsRef.current?.lng || 0) : 0;

    const roofCentroidGps = hasValidRoof ? calculateCentroid(currentRoofPoly) : null;

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

    let scale = 18;
    if (map) {
      try {
        const cGpsLat = roofCentroidGps ? (roofCentroidGps.lat ?? roofCentroidGps[0]) : (map.getCenter()?.lat || 31.5);
        const cGpsLng = roofCentroidGps ? (roofCentroidGps.lng ?? roofCentroidGps[1]) : (map.getCenter()?.lng || 73.0);
        const cGps = L.latLng(cGpsLat, cGpsLng);
        const p1 = map.latLngToContainerPoint(cGps);
        const p2 = map.latLngToContainerPoint(L.latLng(cGps.lat + 1 / 111139, cGps.lng));
        const dist = Math.abs(p2.y - p1.y);
        if (isFinite(dist) && dist > 0.5) scale = dist;
      } catch (e) { }
    }

    let bboxMinX = Infinity, bboxMaxX = -Infinity, bboxMinY = Infinity, bboxMaxY = -Infinity;

    const preparedPanels = [];
    panels.forEach((mod) => {
      const isRemoved = removedModuleIds.has(mod.id);
      const isHovered = hoveredModuleIdRef.current === mod.id;

      const p = mod;
      const activeTilt = Number(mod.tilt !== undefined ? mod.tilt : tiltDegrees) || 0;
      const tiltRad = (activeTilt * Math.PI) / 180;
      const baseScale = Number(scale) || 1;

      const isLandscape = p.orientation === "LANDSCAPE" || orientation === "LANDSCAPE";
      const baseW = isLandscape ? 2.278 : 1.134;
      const baseL = isLandscape ? 1.134 : 2.278;
      const rawW = p.width ? (Number(p.width) > 10 ? Number(p.width) / 1000 : Number(p.width)) : baseW;
      const rawL = p.length ? (Number(p.length) > 10 ? Number(p.length) / 1000 : Number(p.length)) : baseL;

      const effArrayScale = Number(arrayScale) || 1.0;
      const visualWidth = Math.max(0.2, (Number(rawW) || 1.134) * baseScale * effArrayScale);
      const visualLength = Math.max(0.2, (Number(rawL) || 2.278) * Math.cos(tiltRad) * baseScale * effArrayScale);
      const pWidth = visualWidth;
      const pLength = visualLength;

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
          rotY = -(Number(mod.rotY) || 0) * scale;
        } else if (mod.relX !== undefined && mod.relY !== undefined && isFinite(mod.relX) && isFinite(mod.relY)) {
          rotX = (Number(mod.relX) || 0) * scale;
          rotY = -(Number(mod.relY) || 0) * scale;
        }
      }

      if (rotX === undefined || !isFinite(rotX) || isNaN(rotX)) rotX = 0;
      if (rotY === undefined || !isFinite(rotY) || isNaN(rotY)) rotY = 0;

      // Visual array scaling: panels scale around centerPoint (count stays locked)
      let px = centerPoint.x + rotX * effArrayScale;
      let py = centerPoint.y + rotY * effArrayScale;

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
      // PASS 1: RACKING + AMBIENT SHADOWS
      preparedPanels.forEach(({ cornersPx, isRemoved, modRackingType, pL }) => {
        if (isRemoved) return;
        if (showShadows) {
          const effElev = timeSimRef.current ? simSunRef.current.elevationDeg : solarElevation;
          const effAzim = timeSimRef.current ? simSunRef.current.azimuthDeg : solarAzimuth;
          const elevRad = (Math.max(5, effElev) * Math.PI) / 180;
          const azRad = (effAzim * Math.PI) / 180;
          const tiltFactor = Math.sin((tiltDegrees * Math.PI) / 180);
          // Sim / Shading mode: longer, clearly moving ambient shadows
          // FIX: Use panel length (pL) for accurate shadow calculation
          const panelLengthPx = Math.max(6, (Number(pL) || 12));
          const simActiveP1 = timeSimRef.current || simOverride;
          const shadowDistPx = simActiveP1
            ? Math.min(60, Math.max(6, (panelLengthPx * tiltFactor) / Math.tan(elevRad) * 2.0))
            : Math.min(15, Math.max(3, (panelLengthPx * tiltFactor) / Math.tan(elevRad)));
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
        renderRackingUnderneath(ctx, cornersPx, modRackingType, showShadows);
      });

      // PASS 2: MODULE FACES + DYNAMIC SUN SHADOWS
      preparedPanels.forEach(({ mod, drawX, drawY, pW, pL, pLengthM, tiltRad: panelTiltRad, azRad, isRemoved, isHovered, modRackingType }) => {
        // Crash guard: skip panels with non-finite dimensions
        if (!isFinite(drawX) || !isFinite(drawY) || !isFinite(pW) || !isFinite(pL) || pW <= 0.1 || pL <= 0.1) return;
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

        if (showShadows) {
          // FIX: Use accurate sun position calculation from helioscopeEngine
          const sunAlt = timeSimRef.current ? Math.max(5, simSunRef.current.elevationDeg) : Math.max(5, Number(sunAltitudeDeg ?? solarElevation ?? 45));
          const sunAz = timeSimRef.current ? simSunRef.current.azimuthDeg : Number(sunAzimuthDeg ?? solarAzimuth ?? 180);
          
          // Ensure elevation is never below horizon for shadow calculation
          const effectiveElev = Math.max(5, sunAlt);
          const elevRad = (effectiveElev * Math.PI) / 180;
          const azRad = ((sunAz - 180) * Math.PI) / 180;

          const effLength = Number(pLengthM) || 2.278;
          const effTiltRad = Number(panelTiltRad) || 0;
          const shadowLengthMeters = (effLength * Math.sin(effTiltRad) + (modRackingType === 'L3_ELEVATED' ? 1.5 : 0.8)) / Math.tan((sunAlt * Math.PI) / 180);
          // Sim / Shading mode: much longer, clearly moving shadows
          const simActive = timeSimRef.current || simOverride;
          const simBoost = simActive ? 3.5 : 1;
          const capPx = simActive ? 420 : 140;
          const shadowPx = Math.min(shadowLengthMeters * scale * simBoost, capPx);

          const shadowAngleRad = ((sunAz + 180) * Math.PI) / 180;
          const shadowDx = Math.sin(shadowAngleRad) * shadowPx;
          const shadowDy = -Math.cos(shadowAngleRad) * shadowPx;

          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.fillStyle = simActive ? "rgba(15, 23, 42, 0.5)" : "rgba(15, 23, 42, 0.42)";
          ctx.beginPath();
          ctx.moveTo(-pW / 2, -pL / 2);
          ctx.lineTo(pW / 2, -pL / 2);
          ctx.lineTo(pW / 2 + shadowDx, pL / 2 + shadowDy);
          ctx.lineTo(-pW / 2 + shadowDx, pL / 2 + shadowDy);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // REALISTIC module: frame + cell grid + busbars + glass shine
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(azRad);

        const frameW = Math.max(0.8, Math.min(2.2, pW * 0.05));
        ctx.fillStyle = "#9ca3af";
        ctx.fillRect(-pW / 2, -pL / 2, pW, pL);

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

          ctx.strokeStyle = "rgba(191,219,254,0.20)";
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          for (let c = 0; c < cols; c++) {
            const x0 = -innerW / 2 + c * cw;
            ctx.moveTo(x0 + cw * 0.33, -innerL / 2); ctx.lineTo(x0 + cw * 0.33, innerL / 2);
            ctx.moveTo(x0 + cw * 0.66, -innerL / 2); ctx.lineTo(x0 + cw * 0.66, innerL / 2);
          }
          ctx.stroke();

          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath();
          ctx.moveTo(-innerW / 2, -innerL / 2);
          ctx.lineTo(-innerW / 2 + innerW * 0.3, -innerL / 2);
          ctx.lineTo(-innerW / 2, -innerL / 2 + innerL * 0.6);
          ctx.closePath();
          ctx.fill();
        }

        ctx.strokeStyle = isHovered ? "#93c5fd" : "rgba(56,189,248,0.55)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-pW / 2, -pL / 2, pW, pL);

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

    if (panels.length > 0 && isFinite(bboxMinX)) {
      arrayBboxPxRef.current = { minX: bboxMinX, maxX: bboxMaxX, minY: bboxMinY, maxY: bboxMaxY };

      // MANUAL ROTATE gizmo: orange handle above the array (drag to rotate)
      const gizmoCx = (bboxMinX + bboxMaxX) / 2;
      const gizmoHy = bboxMinY - 34;
      arrayCenterPxRef.current = { x: gizmoCx, y: (bboxMinY + bboxMaxY) / 2 };
      rotateHandlePxRef.current = { x: gizmoCx, y: gizmoHy };
      ctx.save();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gizmoCx, bboxMinY);
      ctx.lineTo(gizmoCx, gizmoHy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(gizmoCx, gizmoHy, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    } else {
      arrayBboxPxRef.current = null;
      rotateHandlePxRef.current = null;
      arrayCenterPxRef.current = null;
    }

    // E. ARRAY ANCHOR (drag coordinates)
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
    } else {
      anchorPxRef.current = null;
    }

    // F. KEEPOUT OBSTACLES (with labels)
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
      ctx.fillStyle = "#fecdd3";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Keepout ${obs.radiusM}m`, centerPx.x, centerPx.y - radiusPx - 5);
      ctx.restore();
    });

    // G. ELECTRICAL OVERLAY — Inverters, Strings & Lightning Badges
    // FIX: Remove roofPolygon length check to allow overlay on manual segments
    // Also ensure panelsRef.current is used as fallback for panels
    const activePanelsForElectrical = (panels && panels.length > 0) ? panels : (panelsRef.current || []);
    if (showElectricalLayer && activePanelsForElectrical.length > 0) {
      ctx.save();

      const invRatingKw = inverterCapacityKw || 100;
      const activePanelCount = activePanelsForElectrical.length - (removedModuleIds ? removedModuleIds.size : 0);
      const avgW = activePanelsForElectrical.reduce((a, p) => a + (Number(p.wattage) || 550), 0) / Math.max(1, activePanelsForElectrical.length);
      const sysSizeKwp = (activePanelCount * avgW) / 1000;
      const invQty = Math.max(1, Math.ceil(sysSizeKwp / (invRatingKw * 1.25)));

      // FIX: Use roofPolygon if available, otherwise use bounding box of panels
      let roofPxPts = [];
      if (roofPolygon && roofPolygon.length >= 3) {
        roofPxPts = roofPolygon.map(([lat, lng]) => toPx(lat, lng));
      } else {
        // Fallback: create bounding box from panel positions
        const panelPxPositions = activePanelsForElectrical.map(p => {
          const c = p.center || p.centerGps;
          if (c) return toPx(Array.isArray(c) ? c[0] : c.lat, Array.isArray(c) ? c[1] : c.lng);
          return { x: 0, y: 0 };
        }).filter(pt => pt.x !== 0 || pt.y !== 0);
        
        if (panelPxPositions.length > 0) {
          const minX = Math.min(...panelPxPositions.map(p => p.x));
          const maxX = Math.max(...panelPxPositions.map(p => p.x));
          const minY = Math.min(...panelPxPositions.map(p => p.y));
          const maxY = Math.max(...panelPxPositions.map(p => p.y));
          const pad = 50;
          roofPxPts = [
            { x: minX - pad, y: minY - pad },
            { x: maxX + pad, y: minY - pad },
            { x: maxX + pad, y: maxY + pad },
            { x: minX - pad, y: maxY + pad }
          ];
        }
      }
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

      const strSize = Math.max(1, targetStringSize || 20);
      const activePanels = activePanelsForElectrical.filter(p => !removedModuleIds || !removedModuleIds.has(p.id));
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

    // H. SUN SIM INDICATOR BADGE
    if (timeSimRef.current) {
      const bx = width - 150;
      const by = 14;
      ctx.save();
      ctx.fillStyle = "rgba(8,15,30,0.9)";
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, 138, 46, 8);
      else ctx.rect(bx, by, 138, 46);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`☀ ${Math.round(simSunRef.current.elevationDeg)}° elev`, bx + 10, by + 18);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px monospace";
      ctx.fillText(`az ${Math.round(simSunRef.current.azimuthDeg)}°  shadow live`, bx + 10, by + 35);
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

  // Clear SnapBox first point on tool change
  useEffect(() => {
    p1Ref.current = null;
  }, [activeCadTool]);

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

    const spec = MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Trina Solar Vertex 550W"];
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
      latitude: siteLatitude
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
    isAutoPitch,
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
    siteLatitude,
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

  // Ensure Racking, Azimuth, Tilt immediately re-pack and re-render panels
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

    const currentAzimuth = typeof azimuthDegrees === "number" && !isNaN(azimuthDegrees)
      ? azimuthDegrees
      : (Number.isFinite(Number(azimuthDegrees)) ? Number(azimuthDegrees) : 180);
    const currentTilt = typeof tiltDegrees === "number" && !isNaN(tiltDegrees)
      ? tiltDegrees
      : (Number.isFinite(Number(tiltDegrees)) ? Number(tiltDegrees) : 18);
    const currentRacking = rackingType || "L2_ELEVATED";

    const centroid = calculateCentroid(activePoly);
    const cLat = Array.isArray(centroid) ? centroid[0] : (centroid?.lat || 0);
    const cLng = Array.isArray(centroid) ? centroid[1] : (centroid?.lng || 0);

    const spec = MODULE_PHYSICAL_SPECS[selectedModuleKey] || MODULE_PHYSICAL_SPECS["Trina Solar Vertex 550W"];
    const lengthM = spec.lengthMm / 1000;
    const widthM = spec.widthMm / 1000;
    const moduleWidth = orientation === "PORTRAIT" ? widthM : lengthM;
    const moduleLength = orientation === "PORTRAIT" ? lengthM : widthM;

    const updatedPanels = packModulesOnRoof(activePoly, {
      orientation,
      arrayScale,
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
      targetCount: (targetCapacityMode === "TARGET_CAP" && (targetKwP || targetKwp))
        ? Math.max(1, Math.round(((Number(targetKwP || targetKwp)) * 1000) / (spec?.wattage || 550)))
        : null,
      targetKwp: targetCapacityMode === "TARGET_CAP" ? (targetKwP || targetKwp) : null,
      targetKwP: targetCapacityMode === "TARGET_CAP" ? (targetKwP || targetKwp) : null,
      gridOffset,
      keepouts,
      wattage: spec.wattage,
      latitude: siteLatitude,
      refLat: cLat,
      refLng: cLng,
      centroid: { lat: cLat, lng: cLng }
    });

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
          kwp: Math.round(((updatedPanels.length * (spec?.wattage || 550)) / 1000) * 10) / 10,
          panels: formatted,
          roofPolygon: activePoly,
          metrics: {
            count: updatedPanels.length,
            capacityKw: Math.round(((updatedPanels.length * (spec?.wattage || 550)) / 1000) * 10) / 10
          },
          anchor: [cLat, cLng]
        });
      }
    } else if (cachedPanelsRef.current && cachedPanelsRef.current.length > 0) {
      panelsRef.current = cachedPanelsRef.current;
    }

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
    isAutoPitch,
    arrayScale,
    colSpacing,
    frameSizeUp,
    frameSizeWide,
    frameSpacing,
    gridAlignment,
    targetCapacityMode,
    targetKwp,
    targetKwP,
    manualSegments,
    gridOffset,
    keepouts,
    siteLatitude,
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

  // Edge-align: optional wide hit radius (contextmenu 42px, drag 28px)
  const findClosestRoofEdge = (clickPx, maxDistPx = 28) => {
    const activePoly = activePolyDragRef.current || roofPolygon;
    if (!activePoly || activePoly.length < 3) return null;
    let closestEdge = null;
    let minDist = Infinity;

    for (let i = 0; i < activePoly.length; i++) {
      const nextIdx = (i + 1) % activePoly.length;
      const pt1 = toPx(activePoly[i][0], activePoly[i][1]);
      const pt2 = toPx(activePoly[nextIdx][0], activePoly[nextIdx][1]);

      const dist = pointToSegmentDistPx(clickPx.x, clickPx.y, pt1.x, pt1.y, pt2.x, pt2.y);
      if (dist < minDist && dist < maxDistPx) {
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
  // 4. MOUSE EVENT HANDLERS
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

    if (e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const activePoly = activePolyDragRef.current || roofPolygon;

      // LOCK GUARD
      if (effLock) {
        isDraggingMapRef.current = true;
        hasDraggedRef.current = false;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        return;
      }

      // PAN_VIEW: skip all hit-tests, always pan
      if (activeCadTool === "PAN_VIEW") {
        isDraggingMapRef.current = true;
        hasDraggedRef.current = false;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        return;
      }

      // ROTATE HANDLE drag (manual rotate)
      if (rotateHandlePxRef.current && !isDrawing) {
        const rh = rotateHandlePxRef.current;
        if (Math.hypot(mouseX - rh.x, mouseY - rh.y) <= 16) {
          if (map.dragging) map.dragging.disable();
          isRotatingRef.current = true;
          const c = arrayCenterPxRef.current || { x: mouseX, y: mouseY };
          rotateStartAngleRef.current = Math.atan2(mouseY - c.y, mouseX - c.x) * 180 / Math.PI;
          rotateStartAzRef.current = Number(azimuthDegrees) || 180;
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          return;
        }
      }

      // MOVE PRIORITY: when Move Mode is ON, array hit-test runs FIRST
      if (moveActive && panelsRef.current.length > 0 && arrayBboxPxRef.current) {
        const bbE = arrayBboxPxRef.current;
        const padE = 12;
        const insideE = (mouseX >= bbE.minX - padE && mouseX <= bbE.maxX + padE &&
          mouseY >= bbE.minY - padE && mouseY <= bbE.maxY + padE);
        if (insideE) {
          if (map.dragging) map.dragging.disable();
          isDraggingArrayRef.current = true;
          isDraggingAnchorRef.current = false;
          hasDraggedRef.current = false;
          dragStartMouseGpsRef.current = toGps(mouseX, mouseY);
          dragStartScreenPxRef.current = { x: e.clientX, y: e.clientY };
          dragStartOffsetRef.current = { ...(gridOffsetRef.current || { x: 0, y: 0 }) };
          dragDeltaGpsRef.current = { lat: 0, lng: 0 };
          dragDeltaMetersRef.current = { ...(gridOffsetRef.current || { x: 0, y: 0 }) };
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
          requestRedraw();
          return;
        }
      }

      // 1. VERTEX DRAGGING
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
          if (map.dragging) map.dragging.disable();
          isDraggingVertexRef.current = true;
          draggedVertexIndexRef.current = hitVertexIdx;
          dragStartRoofPolyRef.current = activePoly.map(pt => [...pt]);
          activePolyDragRef.current = activePoly.map(pt => [...pt]);
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
          requestRedraw();
          return;
        }
      }

      if (isDrawing) return;

      // 2. EDGE SHIFTING
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

      // 3. ARRAY DRAGGING (Move Mode ON only)
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

      // 4. MAP PANNING ON EMPTY CANVAS
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

    // CASE A0: ROTATE DRAG
    if (isRotatingRef.current && arrayCenterPxRef.current) {
      const c = arrayCenterPxRef.current;
      const curAng = Math.atan2(mouseY - c.y, mouseX - c.x) * 180 / Math.PI;
      let newAz = rotateStartAzRef.current + (curAng - rotateStartAngleRef.current);
      newAz = ((Math.round(newAz) % 360) + 360) % 360;
      if (setAzimuthDegrees) setAzimuthDegrees(newAz);
      return;
    }

    // CASE A: VERTEX DRAG
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

    // CASE B: EDGE DRAG
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

    // CASE C: ARRAY DRAG
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

    // CASE D: MAP PAN
    if (isDraggingMapRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 3) hasDraggedRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      map.panBy([-dx, -dy], { animate: false });
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      return;
    }

    // CASE E: ACTIVE DRAWING
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

    // CASE F: HOVER DETECTION
    const activePoly = activePolyDragRef.current || roofPolygon;
    let hitVertexIdx = -1;
    let hitEdgeIdx = -1;

    if (activePoly && activePoly.length >= 3 && !effLock && activeCadTool !== "PAN_VIEW") {
      for (let i = 0; i < activePoly.length; i++) {
        const vPt = toPx(activePoly[i][0], activePoly[i][1]);
        if (Math.hypot(mouseX - vPt.x, mouseY - vPt.y) <= 18) {
          hitVertexIdx = i;
          break;
        }
      }
      if (hitVertexIdx === -1) {
        const edge = findClosestRoofEdge({ x: mouseX, y: mouseY });
        if (edge && edge.dist <= 18) {
          hitEdgeIdx = edge.edgeIndex;
        }
      }
    }

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

    // Module hover
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

    if (canvasRef.current) {
      if (hitVertexIdx !== -1) {
        canvasRef.current.style.cursor = "grab";
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
    // 0. ROTATE FINISH
    if (isRotatingRef.current) {
      isRotatingRef.current = false;
      if (map && map.dragging) map.dragging.enable();
      requestRedraw();
      return;
    }

    // 1. VERTEX DRAG FINISH
    if (isDraggingVertexRef.current) {
      const finalPoly = activePolyDragRef.current;
      isDraggingVertexRef.current = false;
      draggedVertexIndexRef.current = -1;
      activePolyDragRef.current = null;
      dragStartRoofPolyRef.current = null;

      if (map && map.dragging) {
        map.dragging.enable();
      }

      if (canvasRef.current) {
        canvasRef.current.style.cursor = hoveredVertexIndexRef.current !== -1 ? "grab" : "default";
      }

      if (finalPoly && finalPoly.length >= 3) {
        if (setRoofPolygon) setRoofPolygon(finalPoly);
        if (runModulePackingRef.current) {
          runModulePackingRef.current(finalPoly);
        }
      }
      requestRedraw();
      return;
    }

    // 2. EDGE DRAG FINISH
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

    // 3. ARRAY DRAG FINISH
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

    // 4. MAP DRAG FINISH
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

  // Edge-align: right-click hit radius 42px
  const handleContextMenu = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = findClosestRoofEdge({ x, y }, 42);
    if (edge) {
      const snapDeg = Math.round(edge.azimuthDeg);
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
    if ((isLocked || localLock) || !map) return;

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
      requestRedraw();
      return;
    }

    if (activeCadTool === "MANUAL_INSPECT") {
      const edge = findClosestRoofEdge({ x, y }, 42);
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

  // Floating widget styles (dark glass theme)
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

      {/* Azimuth Quick Presets */}
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

      {/* Lock + Move + Pitch controls */}
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
          title="Move mode: ON then drag the array body to reposition it"
        >
          ✥ Move {moveActive ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={() => setLocalLock(v => !v)}
          style={ctrlBtnStyle(effLock)}
          title="Lock: array/vertex/edge drag disabled — only map pan free"
        >
          {effLock ? "🔒 Locked" : "🔓 Unlocked"}
        </button>
      </div>

      {/* Sun Time Simulation widget — hidden on Shading tab (simOverride) */}
      {!simOverride && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 12,
            zIndex: 950,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 12,
            background: "rgba(8,15,30,0.88)",
            border: "1px solid rgba(56,189,248,0.25)",
            backdropFilter: "blur(8px)",
            pointerEvents: "auto"
          }}
        >
          <button type="button" onClick={() => setTimeSim(v => !v)} style={ctrlBtnStyle(timeSim)}>
            {timeSim ? "☀ Sim ON" : "☀ Sim OFF"}
          </button>
          {timeSim && (
            <>
              {seasonPresets.map(sp => (
                <button key={sp.label} type="button" onClick={() => setSunDay(sp.day)} style={chipStyle(sunDay === sp.day)}>
                  {sp.label}
                </button>
              ))}
              <input
                type="range" min="5.5" max="18.5" step="0.25" value={sunHour}
                onChange={(e) => setSunHour(parseFloat(e.target.value))}
                style={{ width: 160, accentColor: "#38bdf8" }}
              />
              <span style={{ color: "#facc15", fontFamily: "monospace", fontSize: 11, fontWeight: 700, minWidth: 48 }}>
                {String(Math.floor(sunHour)).padStart(2, "0")}:{String(Math.round((sunHour % 1) * 60)).padStart(2, "0")}
              </span>
              <button type="button" onClick={toggleSunPlay} style={ctrlBtnStyle(playing)}>
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Right-Click Roof Edge Alignment Context Menu */}
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