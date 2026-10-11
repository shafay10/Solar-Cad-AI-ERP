import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { Map, MapPin, Search, RefreshCw, X, Navigation, Check } from "lucide-react";

// Offline Pakistan Geocoding Dictionary for instant sector & city jumping
const PAK_REGIONAL_COORDINATES = {
  "islamabad": { lat: 33.6844, lng: 73.0479 },
  "rawalpindi": { lat: 33.5651, lng: 73.0169 },
  "bahria town": { lat: 33.5255, lng: 73.1095 },
  "bahria phase 7": { lat: 33.5188, lng: 73.0984 },
  "bahria phase 8": { lat: 33.5012, lng: 73.0825 },
  "dha phase 1": { lat: 33.5350, lng: 73.1180 },
  "dha phase 2": { lat: 33.5190, lng: 73.1490 },
  "dha islamabad": { lat: 33.5190, lng: 73.1490 },
  "lahore": { lat: 31.5204, lng: 74.3587 },
  "dha lahore": { lat: 31.4800, lng: 74.4000 },
  "gulberg": { lat: 31.5200, lng: 74.3400 },
  "karachi": { lat: 24.8607, lng: 67.0011 },
  "clifton": { lat: 24.8150, lng: 67.0300 },
  "defence karachi": { lat: 24.8200, lng: 67.0600 },
  "faisalabad": { lat: 31.4504, lng: 73.1350 },
  "multan": { lat: 30.1575, lng: 71.5249 },
  "peshawar": { lat: 34.0151, lng: 71.5249 },
  "sialkot": { lat: 32.4945, lng: 74.5229 },
  "gujranwala": { lat: 32.1877, lng: 74.1945 },
  "sukkur": { lat: 27.7052, lng: 68.8574 },
  "quetta": { lat: 30.1798, lng: 66.9750 },
  "hyderabad": { lat: 25.3960, lng: 68.3578 },
  "abbottabad": { lat: 34.1688, lng: 73.2215 },
  "swat": { lat: 34.7717, lng: 72.3602 },
  "mirpur": { lat: 33.1484, lng: 73.7519 }
};

// High-visibility draggable red rooftop pin marker icon
function createDraggableRoofPinIcon() {
  return L.divIcon({
    className: "custom-draggable-roof-pin",
    html: `
      <div style="position: relative; transform: translate(-50%, -100%); cursor: grab;">
        <div style="
          background: #dc2626;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 800;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
          white-space: nowrap;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.65);
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span style="width: 6px; height: 6px; border-radius: 9999px; background: #fef08a; box-shadow: 0 0 6px #fef08a;"></span>
          <span>ROOFTOP PIN</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #dc2626;
          margin: 0 auto;
        "></div>
      </div>
    `,
    iconSize: [86, 36],
    iconAnchor: [43, 36]
  });
}

export default function InteractiveSatellitePinPicker({
  latitude,
  longitude,
  onChange,
  addressQuery = "",
  isOpen: propIsOpen,
  onToggle: propOnToggle,
  showTriggerButton = true
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const toggleOpen = propOnToggle || (() => setInternalIsOpen(prev => !prev));

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Parse valid coordinates or fallback to Islamabad center
  const parsedLat = parseFloat(latitude);
  const parsedLng = parseFloat(longitude);
  const currentLat = !isNaN(parsedLat) && parsedLat >= 20 && parsedLat <= 40 ? parsedLat : 33.6844;
  const currentLng = !isNaN(parsedLng) && parsedLng >= 60 && parsedLng <= 80 ? parsedLng : 73.0479;

  // Initialize or update Leaflet Satellite Map when opened
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    // Small timeout to guarantee container DOM dimensions are ready
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 18,
        maxZoom: 20,
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true
      });

      // 100% Reliable Google Satellite Hybrid Tiles (0.15m HD in Pakistan)
      L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        maxNativeZoom: 20,
        crossOrigin: true
      }).addTo(map);

      // Create high-visibility draggable pin marker
      const pin = L.marker([currentLat, currentLng], {
        draggable: true,
        autoPan: true,
        icon: createDraggableRoofPinIcon()
      }).addTo(map);

      // Bind drag events for instant coordinate updates
      pin.on("drag", (e) => {
        const pos = e.target.getLatLng();
        onChange({
          latitude: pos.lat.toFixed(6),
          longitude: pos.lng.toFixed(6)
        });
      });

      pin.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        onChange({
          latitude: pos.lat.toFixed(6),
          longitude: pos.lng.toFixed(6)
        });
      });

      // Bind map click: jumps pin to clicked point on rooftop
      map.on("click", (e) => {
        pin.setLatLng(e.latlng);
        onChange({
          latitude: e.latlng.lat.toFixed(6),
          longitude: e.latlng.lng.toFixed(6)
        });
      });

      mapInstanceRef.current = map;
      markerRef.current = pin;

      // Invalidate size immediately and at 250ms
      map.invalidateSize();
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 250);

      // If coordinates were empty but address exists, try auto-geocoding the address once
      if ((!latitude || !longitude || parseFloat(latitude) === 0) && addressQuery.trim()) {
        autoGeocodeInitialAddress(addressQuery.trim(), map, pin);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  // Sync marker position if manual inputs change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const pLat = parseFloat(latitude);
      const pLng = parseFloat(longitude);
      if (!isNaN(pLat) && !isNaN(pLng) && pLat >= 20 && pLat <= 40 && pLng >= 60 && pLng <= 80) {
        const currentMarkerPos = markerRef.current.getLatLng();
        if (Math.abs(currentMarkerPos.lat - pLat) > 0.00001 || Math.abs(currentMarkerPos.lng - pLng) > 0.00001) {
          markerRef.current.setLatLng([pLat, pLng]);
          mapInstanceRef.current.setView([pLat, pLng], mapInstanceRef.current.getZoom(), { animate: true });
        }
      }
    }
  }, [latitude, longitude]);

  // Helper to auto-geocode site address on first open
  const autoGeocodeInitialAddress = async (addr, map, pin) => {
    const lower = addr.toLowerCase();
    // Fast dictionary match
    const dictKey = Object.keys(PAK_REGIONAL_COORDINATES).find(k => lower.includes(k));
    if (dictKey) {
      const match = PAK_REGIONAL_COORDINATES[dictKey];
      map.setView([match.lat, match.lng], 17);
      pin.setLatLng([match.lat, match.lng]);
      onChange({
        latitude: match.lat.toFixed(6),
        longitude: match.lng.toFixed(6)
      });
      return;
    }

    // Try OSM Nominatim query
    try {
      const q = encodeURIComponent(`${addr}, Pakistan`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=pk&q=${q}`, {
        headers: { "Accept-Language": "en" }
      });
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          map.setView([lat, lng], 18);
          pin.setLatLng([lat, lng]);
          onChange({
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          });
        }
      }
    } catch {}
  };

  // User-initiated sector/address quick search
  const handleSearchLocation = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    setSearchStatus(null);

    // 1. Check local dictionary
    const lower = query.toLowerCase();
    const dictKey = Object.keys(PAK_REGIONAL_COORDINATES).find(k => k === lower || lower.includes(k));
    if (dictKey) {
      const match = PAK_REGIONAL_COORDINATES[dictKey];
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.flyTo([match.lat, match.lng], 18, { animate: true });
        markerRef.current.setLatLng([match.lat, match.lng]);
        onChange({
          latitude: match.lat.toFixed(6),
          longitude: match.lng.toFixed(6)
        });
      }
      setSearching(false);
      setSearchStatus(`Centered on ${dictKey.toUpperCase()}`);
      setTimeout(() => setSearchStatus(null), 4000);
      return;
    }

    // 2. Fetch from OpenStreetMap Nominatim Pakistan
    try {
      const q = encodeURIComponent(`${query}, Pakistan`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=pk&q=${q}`, {
        headers: { "Accept-Language": "en" }
      });
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 18, { animate: true });
            markerRef.current.setLatLng([lat, lng]);
            onChange({
              latitude: lat.toFixed(6),
              longitude: lng.toFixed(6)
            });
          }
          setSearchStatus(`Found: ${first.display_name.split(",").slice(0, 2).join(",")}`);
          setTimeout(() => setSearchStatus(null), 5000);
        } else {
          setSearchStatus("Location not found. Please drag pin manually.");
          setTimeout(() => setSearchStatus(null), 4000);
        }
      } else {
        setSearchStatus("Search service busy. Please drag pin manually.");
        setTimeout(() => setSearchStatus(null), 4000);
      }
    } catch (err) {
      setSearchStatus("Network search failed. Please drag pin manually.");
      setTimeout(() => setSearchStatus(null), 4000);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2 pt-1">
      {/* Action Toggle Button */}
      {showTriggerButton && (
        <button
          type="button"
          onClick={toggleOpen}
          className={`w-full py-2 px-3 border font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
            isOpen
              ? "bg-emerald-700 text-white border-emerald-700"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>{isOpen ? "✕ Close Satellite Rooftop Pin Picker" : "🗺 Pick Location on Satellite Map (Drag Pin to Roof)"}</span>
        </button>
      )}

      {/* Embedded Lightweight Leaflet Satellite Map Container */}
      {isOpen && (
        <div className="rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-950 relative shadow-md transition-all">
          {/* Top Floating Sector Search Bar */}
          <div className="absolute top-2 left-2 right-2 z-[1000] flex gap-1 bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-lg border border-slate-700/60 shadow-lg">
            <input
              type="text"
              placeholder="Search sector / neighborhood (e.g. Bahria Phase 7, DHA 2, Gulberg)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchLocation();
                }
              }}
              className="flex-1 bg-slate-800/90 text-slate-100 text-xs px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-emerald-500 font-medium placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleSearchLocation}
              disabled={searching}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded transition flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </div>

          {/* Search Result Feedback Chip */}
          {searchStatus && (
            <div className="absolute top-12 left-2 right-2 z-[1000] bg-slate-900/95 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md text-center">
              {searchStatus}
            </div>
          )}

          {/* Leaflet Canvas */}
          <div ref={mapContainerRef} className="h-[260px] w-full" />

          {/* Bottom Floating Telemetry & Rooftop Pin Instructions */}
          <div className="absolute bottom-2 left-2 right-2 z-[1000] flex flex-wrap items-center justify-between gap-1 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-white text-[11px] shadow-lg">
            <div className="flex items-center gap-1.5 font-mono text-emerald-300 font-bold">
              <MapPin className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>LAT: {latitude || currentLat}°N</span>
              <span className="text-slate-500">|</span>
              <span>LNG: {longitude || currentLng}°E</span>
            </div>
            <div className="text-[10px] text-slate-300 flex items-center gap-1">
              <span className="text-amber-400 font-bold">Tip:</span>
              <span>Drag red pin or click rooftop to drop</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
