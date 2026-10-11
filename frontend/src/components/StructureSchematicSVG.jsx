import React from "react";
import { ShieldCheck, Wind, Layers, Compass, Sliders, Box } from "lucide-react";

/**
 * StructureSchematicSVG
 * Architectural 2D Side-Profile Vector Cross-Section (ASTM A123 & IEC 60364 Standard)
 * Dynamically draws foundation pads, front leg (H1), rear column (H2), rafter slope,
 * solar PV modules, wind bracing, angle arc, and dimension leaders.
 */
export default function StructureSchematicSVG({
  structureType = "L2 Elevated",
  frontHeightMm = 450,
  backHeightMm = 1850,
  tiltAngle = 18,
  azimuthDirection = "True South (180°)",
  materialSpec = "Hot-Dip Galvanized (ASTM A123, ≥80µm)",
  windRating = "130 km/h (BCP 2021)",
  pitchMeters = 3.2,
  rafterLengthMm = 4650
}) {
  const h1 = Number(frontHeightMm) || 450;
  const h2 = Number(backHeightMm) || 1850;
  const tilt = Number(tiltAngle) || 18;

  // Normalized SVG canvas dimensions (viewBox: 0 0 540 280)
  // Ground level line at Y = 220
  const groundY = 220;
  const frontX = 140;
  const rearX = 360;

  // Scale heights so they fit aesthetically in SVG (max height ~2900mm maps to ~130px)
  const scale = 130 / 3000;
  const frontLegHeightPx = Math.max(25, h1 * scale);
  const rearLegHeightPx = Math.max(60, h2 * scale);

  const frontTopY = groundY - frontLegHeightPx;
  const rearTopY = groundY - rearLegHeightPx;

  // Rafter slope extension beyond columns
  const overhangFront = 25;
  const overhangRear = 25;
  const angleRad = Math.atan2(frontTopY - rearTopY, rearX - frontX);
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  const rafterStartX = frontX - overhangFront * cosA;
  const rafterStartY = frontTopY + overhangFront * sinA;
  const rafterEndX = rearX + overhangRear * cosA;
  const rafterEndY = rearTopY - overhangRear * sinA;

  // Midpoint for bracing
  const midRafterX = (frontX + rearX) / 2;
  const midRafterY = (frontTopY + rearTopY) / 2;

  // Solar PV Module panels mounted on rafter (2 panels for L2, 3 panels for L3)
  const isL3 = structureType === "L3 Elevated";
  const numPanels = isL3 ? 3 : 2;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
      {/* Header Info */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg">
            <Box className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              {structureType} Mechanical Cross-Section
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                ASTM / IEC 60364
              </span>
            </h4>
            <p className="text-[10px] text-slate-500">
              Structural profile with plinth foundations, wind bracing & live dimension leaders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
            <Wind className="w-3 h-3 text-emerald-700" /> {windRating}
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-200 relative">
        <svg
          viewBox="0 0 540 270"
          className="w-full h-auto select-none"
          style={{ maxHeight: "250px" }}
        >
          <defs>
            {/* Concrete Hatch Pattern for Plinths */}
            <pattern id="concreteHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1" />
            </pattern>
            {/* Arrowhead marker for dimension lines */}
            <marker id="dimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
            </marker>
            <marker id="dimArrowEnd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
            </marker>
          </defs>

          {/* 1. Ground Level Line & Earth Hatch */}
          <line x1="20" y1={groundY} x2="520" y2={groundY} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,3" />
          <text x="30" y={groundY + 18} fill="#475569" fontSize="9" fontFamily="monospace" fontWeight="bold">
            FINISH ROOF / GROUND LEVEL (±0.00m)
          </text>

          {/* 2. Concrete Foundation Pads (Plinths) */}
          {/* Front Pad */}
          <rect x={frontX - 22} y={groundY} width="44" height="26" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" rx="2" />
          <rect x={frontX - 22} y={groundY} width="44" height="26" fill="url(#concreteHatch)" opacity="0.6" rx="2" />
          {/* Anchor Bolts Callout */}
          <line x1={frontX - 10} y1={groundY} x2={frontX - 10} y2={groundY + 18} stroke="#64748b" strokeWidth="2" />
          <line x1={frontX + 10} y1={groundY} x2={frontX + 10} y2={groundY + 18} stroke="#64748b" strokeWidth="2" />

          {/* Rear Pad */}
          <rect x={rearX - 26} y={groundY} width="52" height="26" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" rx="2" />
          <rect x={rearX - 26} y={groundY} width="52" height="26" fill="url(#concreteHatch)" opacity="0.6" rx="2" />
          <line x1={rearX - 12} y1={groundY} x2={rearX - 12} y2={groundY + 18} stroke="#64748b" strokeWidth="2" />
          <line x1={rearX + 12} y1={groundY} x2={rearX + 12} y2={groundY + 18} stroke="#64748b" strokeWidth="2" />

          {/* Plinth Text */}
          <text x={frontX} y={groundY + 38} fill="#475569" fontSize="8" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">
            RCC Pad (M12 Anchors)
          </text>
          <text x={rearX} y={groundY + 38} fill="#475569" fontSize="8" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">
            RCC Plinth (Hilti HIT-RE)
          </text>

          {/* 3. Front Vertical Leg (H1) */}
          <line x1={frontX} y1={groundY} x2={frontX} y2={frontTopY} stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
          <line x1={frontX - 4} y1={groundY} x2={frontX + 4} y2={groundY} stroke="#94a3b8" strokeWidth="2" />

          {/* 4. Rear Vertical Column (H2) */}
          <line x1={rearX} y1={groundY} x2={rearX} y2={rearTopY} stroke="#475569" strokeWidth="5.5" strokeLinecap="round" />
          {/* Base plate */}
          <line x1={rearX - 6} y1={groundY} x2={rearX + 6} y2={groundY} stroke="#94a3b8" strokeWidth="3" />

          {/* 5. Diagonal Cross Wind Bracing */}
          <line x1={frontX} y1={groundY} x2={midRafterX} y2={midRafterY} stroke="#0284c7" strokeWidth="2" strokeDasharray="4,2" />
          <line x1={midRafterX} y1={midRafterY} x2={rearX} y2={groundY} stroke="#0284c7" strokeWidth="2" strokeDasharray="4,2" />
          {/* Horizontal Tie Beam */}
          <line x1={frontX} y1={groundY - 20} x2={rearX} y2={groundY - 20} stroke="#94a3b8" strokeWidth="1.5" />

          {/* 6. Main Inclined Heavy HDG Rafter */}
          <line
            x1={rafterStartX}
            y1={rafterStartY}
            x2={rafterEndX}
            y2={rafterEndY}
            stroke="#1e293b"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* 7. Mounted Solar PV Module Panels (Tilted Dark Blue Silicon Plates) */}
          {Array.from({ length: numPanels }).map((_, idx) => {
            const spanFraction = 1 / numPanels;
            const pStartX = rafterStartX + (rafterEndX - rafterStartX) * (idx * spanFraction + 0.03);
            const pStartY = rafterStartY + (rafterEndY - rafterStartY) * (idx * spanFraction + 0.03);
            const pEndX = rafterStartX + (rafterEndX - rafterStartX) * ((idx + 1) * spanFraction - 0.03);
            const pEndY = rafterStartY + (rafterEndY - rafterStartY) * ((idx + 1) * spanFraction - 0.03);

            // Normal offset to elevate panel slightly above rafter
            const normalX = -sinA * 8;
            const normalY = -cosA * 8;

            return (
              <g key={idx}>
                {/* Module Body */}
                <line
                  x1={pStartX + normalX}
                  y1={pStartY + normalY}
                  x2={pEndX + normalX}
                  y2={pEndY + normalY}
                  stroke="#0f172a"
                  strokeWidth="8"
                  strokeLinecap="butt"
                />
                {/* Silver Anodized Frame */}
                <line
                  x1={pStartX + normalX}
                  y1={pStartY + normalY}
                  x2={pEndX + normalX}
                  y2={pEndY + normalY}
                  stroke="#0284c7"
                  strokeWidth="1.5"
                />
                {/* Wafer Half-Cut Split */}
                <circle
                  cx={(pStartX + pEndX) / 2 + normalX}
                  cy={(pStartY + pEndY) / 2 + normalY}
                  r="2"
                  fill="#ffffff"
                />
              </g>
            );
          })}

          {/* 8. Tilt Angle Arc & Degree Label */}
          {/* Horizontal datum line at rear top */}
          <line x1={rearX} y1={rearTopY} x2={rearX - 50} y2={rearTopY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
          <path
            d={`M ${rearX - 35} ${rearTopY} A 35 35 0 0 1 ${rearX - 35 * Math.cos((tilt * Math.PI) / 180)} ${rearTopY + 35 * Math.sin((tilt * Math.PI) / 180)}`}
            fill="none"
            stroke="#d97706"
            strokeWidth="1.8"
          />
          <text x={rearX - 52} y={rearTopY + 18} fill="#b45309" fontSize="11" fontFamily="monospace" fontWeight="bold">
            θ = {tilt}°
          </text>

          {/* 9. Dynamic Dimension Leaders */}
          {/* H1 Front Height Dimension */}
          <line x1={frontX - 40} y1={groundY} x2={frontX - 40} y2={frontTopY} stroke="#0284c7" strokeWidth="1.2" markerStart="url(#dimArrow)" markerEnd="url(#dimArrowEnd)" />
          <line x1={frontX - 46} y1={groundY} x2={frontX - 34} y2={groundY} stroke="#0284c7" strokeWidth="1" />
          <line x1={frontX - 46} y1={frontTopY} x2={frontX - 34} y2={frontTopY} stroke="#0284c7" strokeWidth="1" />
          <text x={frontX - 46} y={(groundY + frontTopY) / 2} fill="#0369a1" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="end" dominantBaseline="middle">
            H₁={h1}mm
          </text>

          {/* H2 Rear Height Dimension */}
          <line x1={rearX + 44} y1={groundY} x2={rearX + 44} y2={rearTopY} stroke="#0284c7" strokeWidth="1.2" markerStart="url(#dimArrow)" markerEnd="url(#dimArrowEnd)" />
          <line x1={rearX + 38} y1={groundY} x2={rearX + 50} y2={groundY} stroke="#0284c7" strokeWidth="1" />
          <line x1={rearX + 38} y1={rearTopY} x2={rearX + 50} y2={rearTopY} stroke="#0284c7" strokeWidth="1" />
          <text x={rearX + 52} y={(groundY + rearTopY) / 2} fill="#0369a1" fontSize="10" fontFamily="monospace" fontWeight="bold" dominantBaseline="middle">
            H₂={h2}mm
          </text>

          {/* Inter-Row Pitch (P) Dimension */}
          <line x1={frontX} y1={groundY + 54} x2={rearX} y2={groundY + 54} stroke="#0284c7" strokeWidth="1.2" markerStart="url(#dimArrow)" markerEnd="url(#dimArrowEnd)" />
          <line x1={frontX} y1={groundY + 48} x2={frontX} y2={groundY + 60} stroke="#0284c7" strokeWidth="1" />
          <line x1={rearX} y1={groundY + 48} x2={rearX} y2={groundY + 60} stroke="#0284c7" strokeWidth="1" />
          <text x={(frontX + rearX) / 2} y={groundY + 66} fill="#0369a1" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            Row Footprint / Pitch ≈ {pitchMeters}m
          </text>

          {/* Azimuth Indicator */}
          <text x="510" y="25" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
            Orientation: {azimuthDirection}
          </text>
        </svg>
      </div>

      {/* Engineering Specifications Spec Sheet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-xs">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Material Quality</span>
          <span className="text-slate-800 font-bold truncate block" title={materialSpec}>
            {materialSpec}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-xs">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Rafter Slope Length</span>
          <span className="text-emerald-700 font-mono font-extrabold block">
            {rafterLengthMm ? `${(rafterLengthMm / 1000).toFixed(2)}m` : "4.65m"} ({numPanels} Panels/Rafter)
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-xs">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Wind Code Compliance</span>
          <span className="text-emerald-700 font-bold block">
            BCP 2021 ({windRating})
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-xs">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Chemical Anchoring</span>
          <span className="text-amber-700 font-bold block">
            Hilti / Fischer M12 Sleeve
          </span>
        </div>
      </div>
    </div>
  );
}
