import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin, Navigation, Search, ChevronDown, ChevronUp,
  Zap, IndianRupee, Armchair, Clock, Train, Car, Footprints,
  AlertTriangle, Loader2, ExternalLink, ArrowDownUp,
  LocateFixed, Sparkles, ArrowRight, X, CheckCircle2
} from "lucide-react";

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&family=Bricolage+Grotesque:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";

// ─── API & Mock Data ──────────────────────────────────────────────────────────
const API_URL = "https://safarguru-backend.onrender.com/api/v1/get-routes";
const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

// const MOCK_LOCATIONS = [
//   { name: "Bennett University",       lat: 28.4501, lon: 77.5840 },
//   { name: "Connaught Place",          lat: 28.6315, lon: 77.2167 },
//   { name: "Pari Chowk",              lat: 28.4744, lon: 77.5040 },
//   { name: "Rajiv Chowk Metro",       lat: 28.6328, lon: 77.2197 },
//   { name: "Noida Sector 18",         lat: 28.5700, lon: 77.3210 },
//   { name: "Greater Noida West",      lat: 28.4574, lon: 77.4960 },
//   { name: "IGI Airport T3",          lat: 28.5562, lon: 77.0999 },
//   { name: "Cyber City Gurugram",     lat: 28.4950, lon: 77.0877 },
//   { name: "Hauz Khas Village",       lat: 28.5494, lon: 77.2001 },
//   { name: "Lajpat Nagar",            lat: 28.5700, lon: 77.2434 },
//   { name: "Karol Bagh",              lat: 28.6513, lon: 77.1907 },
//   { name: "Nehru Place",             lat: 28.5488, lon: 77.2520 },
//   { name: "Knowledge Park 3",        lat: 28.4706, lon: 77.5059 },
//   { name: "Aqua Line – Depot",       lat: 28.4815, lon: 77.5171 },
//   { name: "Sector 51 Metro",         lat: 28.6101, lon: 77.3695 },
//   { name: "India Gate",              lat: 28.6129, lon: 77.2295 },
//   { name: "Dwarka Sector 21",        lat: 28.5520, lon: 77.0588 },
//   { name: "Vaishali Metro",          lat: 28.6455, lon: 77.3373 },
// ];

const MOCK_ROUTES = [
  {
    type: "metro_cab",
    time: 62,
    cost: 95,
    desc: "Aqua Line → Blue Line, then a short cab to your destination.",
    metro_fare: { dmrc: 40, nmrc: 30 },
    cab_breakdown: { base_fare: 15, surge: 5, distance_fare: 5 },
    time_breakdown: { walk: 7, metro: 40, cab: 15 },
    metro_segments: [
      "Board at Knowledge Park III (Aqua Line)",
      "Transfer at Sector 51 → Blue Line",
      "Arrive at Rajiv Chowk",
    ],
  },
  {
    type: "direct_cab",
    time: 78,
    cost: 520,
    desc: "Door-to-door comfort — zero transfers, fully AC.",
    metro_fare: null,
    cab_breakdown: { base_fare: 80, surge: 40, distance_fare: 400 },
    time_breakdown: { walk: 2, metro: 0, cab: 76 },
    metro_segments: [],
  },
  {
    type: "metro_only",
    time: 95,
    cost: 70,
    desc: "Full metro journey with interchange at Botanical Garden.",
    metro_fare: { dmrc: 50, nmrc: 20 },
    cab_breakdown: null,
    time_breakdown: { walk: 18, metro: 77, cab: 0 },
    metro_segments: [
      "Board at Knowledge Park III (Aqua Line)",
      "Transfer at Sector 51 → Blue Line",
      "Transfer at Botanical Garden → Violet Line",
      "Arrive at Central Secretariat",
    ],
  },
];

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const SEG = {
  walk:  { color: "#D97706", bg: "#FEF3C7", border: "#FDE68A", icon: Footprints, label: "Walk"  },
  metro: { color: "#0284C7", bg: "#E0F2FE", border: "#BAE6FD", icon: Train,      label: "Metro" },
  cab:   { color: "#7C3AED", bg: "#EDE9FE", border: "#DDD6FE", icon: Car,        label: "Cab"   },
};

const PRIORITY = {
  cheapest: { label: "Cheapest", icon: IndianRupee, badge: "Best Value", color: "#059669", bg: "#D1FAE5", border: "#6EE7B7", pill: "#ECFDF5" },
  fastest:  { label: "Fastest",  icon: Zap,         badge: "Quickest",   color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", pill: "#FFF1F2" },
  comfort:  { label: "Comfortable",  icon: Armchair,    badge: "Comfort",    color: "#7C3AED", bg: "#EDE9FE", border: "#C4B5FD", pill: "#F5F3FF" },
};

const TYPE = {
  metro_cab:  { label: "Metro + Cab", color: "#0284C7", bg: "#E0F2FE" },
  direct_cab: { label: "Direct Cab",  color: "#7C3AED", bg: "#EDE9FE" },
  metro_only: { label: "Metro Only",  color: "#059669", bg: "#D1FAE5" },
};

// ─── Utilities ────────────────────────────────────────────────────────────────
const deepLink = (url) => {
  const a = Object.assign(document.createElement("a"), { href: url, rel: "noopener noreferrer" });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

// const sortRoutes = (arr, p) => {
//   const s = [...arr];
//   if (p === "cheapest") s.sort((a, b) => a.cost - b.cost);
//   else if (p === "fastest") s.sort((a, b) => a.time - b.time);
//   else s.sort((a, b) => (b.type === "direct_cab" ? 1 : 0) - (a.type === "direct_cab" ? 1 : 0));
//   return s;
// };

const sortRoutes = (arr, p) => {
  if (!arr || arr.length === 0) return [];
  const s = [...arr];
  
  if (p === "cheapest") {
    s.sort((a, b) => parseFloat(a.cost) - parseFloat(b.cost));
  } else if (p === "fastest") {
    s.sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
  } else {
    // Comfort: Pushes routes with the word "Direct" to the very top
    s.sort((a, b) => {
      const aIsDirect = (a.type || "").toLowerCase().includes("direct") ? 1 : 0;
      const bIsDirect = (b.type || "").toLowerCase().includes("direct") ? 1 : 0;
      return bIsDirect - aIsDirect;
    });
  }
  return s;
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function LocationInput({ value, onChange, onSelect, placeholder, dotColor, geoBtn, onGeo, geoLoading }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hits, setHits] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const ref = useRef(null);
  const timeoutRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const cb = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", cb);
    return () => document.removeEventListener("mousedown", cb);
  }, []);

  // Live TomTom API Call
  const fetchLocations = async (query) => {
    if (!query || query.trim().length < 3) {
      setHits([]);
      setOpen(false);
      return;
    }
    
    setIsSearching(true);
    try {
      // Biasing the search to India (IN) and specifically around Delhi NCR coordinates
      const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}&countrySet=IN&lat=28.6139&lon=77.2090&radius=50000&limit=5`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
        // Map TomTom's complex data format into our simple {name, lat, lon} format
        const formattedHits = data.results.map(res => ({
          name: res.poi ? res.poi.name : res.address.freeformAddress,
          address: res.address.freeformAddress,
          lat: res.position.lat,
          lon: res.position.lon
        }));
        setHits(formattedHits);
        setOpen(true);
      }
    } catch (err) {
      console.error("TomTom API Error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce the user's typing so we don't spam the API on every single keystroke
  const change = (v) => {
    onChange(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      fetchLocations(v);
    }, 400); // Waits 400ms after they stop typing to fire the API
  };

  const inputBox = {
    display: "flex", alignItems: "center", gap: 10,
    background: focused ? "#ffffff" : "#F7F7F5",
    border: `1.5px solid ${focused ? "#4338CA" : "#E5E7EB"}`,
    borderRadius: 14, padding: "13px 14px",
    boxShadow: focused ? "0 0 0 4px rgba(67,56,202,0.08)" : "none",
    transition: "all 0.18s ease",
  };

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <div style={inputBox}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 0 3px ${dotColor}30` }} />
        <input
          value={value}
          onChange={e => change(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ flex: 1, width: "100%", minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#111827", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 500 }}
        />
        {value
          ? <button onClick={() => { onChange(""); setHits([]); setOpen(false); }} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}><X size={14} /></button>
          : geoBtn
            ? <button onClick={onGeo} style={{ color: geoLoading ? "#4338CA" : "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}>
                {geoLoading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <LocateFixed size={15} />}
              </button>
            : null
        }
      </div>

      {open && (hits.length > 0 || isSearching) && (
        <div style={{ position: "absolute", zIndex: 200, top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", borderRadius: 16, border: "1.5px solid #E5E7EB", boxShadow: "0 16px 48px rgba(0,0,0,0.13)", overflow: "hidden" }}>
          
          {isSearching && hits.length === 0 && (
            <div style={{ padding: "14px", textAlign: "center", color: "#9CA3AF", fontSize: 13, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
               <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }}/> Searching live map...
            </div>
          )}

          {!isSearching && hits.map((loc, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); onSelect(loc); setOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", border: "none", borderBottom: i < hits.length - 1 ? "1px solid #F9FAFB" : "none",
                background: "transparent", cursor: "pointer", textAlign: "left", transition: "background 0.12s",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#F9F8F6"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin size={13} color="#4338CA" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{loc.name}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{loc.address}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SegmentBar({ breakdown }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
  const active = Object.entries(breakdown).filter(([, v]) => v > 0);

  return (
    <div>
      {/* Bar */}
      <div style={{ display: "flex", height: 9, borderRadius: 99, overflow: "hidden", gap: 2, background: "#F3F4F6" }}>
        {active.map(([k, v]) => (
          <div key={k} style={{ width: `${(v / total) * 100}%`, background: SEG[k].color, borderRadius: 99, transition: "width .5s cubic-bezier(.34,1.4,.64,1)" }} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        {active.map(([k, v]) => {
          const s = SEG[k]; const Ic = s.icon;
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic size={12} color={s.color} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>{v}m</span>
              <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetroAccordion({ segments, fare }) {
  const [open, setOpen] = useState(false);
  if (!segments?.length) return null;

  return (
    <div style={{ borderRadius: 14, border: "1.5px solid #BAE6FD", background: "#F0F9FF", overflow: "hidden", marginTop: 14 }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Train size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0284C7" }}>Metro Route & Fare</span>
        </div>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: open ? "#0284C7" : "#BAE6FD", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
          {open ? <ChevronUp size={14} color="#fff" /> : <ChevronDown size={14} color="#0284C7" />}
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid #BAE6FD" }}>
          {/* Stop timeline */}
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
            {segments.map((seg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: i === 0 ? "#059669" : i === segments.length - 1 ? "#DC2626" : "#0284C7", border: "2px solid #fff", boxShadow: `0 0 0 1.5px ${i === 0 ? "#059669" : i === segments.length - 1 ? "#DC2626" : "#0284C7"}`, flexShrink: 0, marginTop: 2 }} />
                  {i < segments.length - 1 && <div style={{ width: 2, flex: 1, background: "#BAE6FD", minHeight: 22, margin: "3px 0" }} />}
                </div>
                <p style={{ margin: "0 0 18px", fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1.4, paddingBottom: i === segments.length - 1 ? 0 : 4 }}>{seg}</p>
              </div>
            ))}
          </div>

          {/* Fare table */}
          {fare && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #BAE6FD", overflow: "hidden", marginTop: 4 }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${(fare.dmrc ? 1 : 0) + (fare.nmrc ? 1 : 0) + 1}, 1fr)` }}>
                {fare.dmrc > 0 && (
                  <div style={{ padding: "11px 12px", borderRight: "1px solid #E0F2FE" }}>
                    <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>DMRC</div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: "#111827", fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>₹{fare.dmrc}</div>
                  </div>
                )}
                {fare.nmrc > 0 && (
                  <div style={{ padding: "11px 12px", borderRight: "1px solid #E0F2FE" }}>
                    <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>NMRC</div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: "#111827", fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>₹{fare.nmrc}</div>
                  </div>
                )}
                <div style={{ padding: "11px 12px", background: "#EFF6FF" }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: "#0284C7", fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>₹{(fare.dmrc || 0) + (fare.nmrc || 0)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RideBtn({ label, emoji, href, bg, color, border }) {
  const [active, setActive] = useState(false);
  return (
    <button
      onClick={() => deepLink(href)}
      onPointerDown={() => setActive(true)}
      onPointerUp={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "9px 15px",
        borderRadius: 11, border: `1.5px solid ${border}`, background: bg, color,
        fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif",
        cursor: "pointer", whiteSpace: "nowrap",
        transform: active ? "scale(0.93)" : "scale(1)",
        boxShadow: active ? "none" : `0 2px 8px ${bg}60`,
        transition: "transform .12s, box-shadow .12s",
      }}
    >
      <span style={{ fontSize: 15 }}>{emoji}</span>
      {label}
      <ExternalLink size={9} style={{ opacity: .6 }} />
    </button>
  );
}

// function RouteCard({ route, isTop, priority, startLoc, endLoc, index }) {
//   const pCfg = PRIORITY[priority];
//   const tCfg = TYPE[route.type] || { label: route.type, color: "#6B7280", bg: "#F3F4F6" };
//   const hasCab   = ["direct_cab", "metro_cab"].includes(route.type);
//   const hasMetro = ["metro_only", "metro_cab"].includes(route.type);

//   const uberHref  = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${endLoc?.lat || 0}&dropoff[longitude]=${endLoc?.lon || 0}`;
//   const olaHref   = `olacabs://app/launch?lat=${startLoc?.lat || 0}&lng=${startLoc?.lon || 0}&dlat=${endLoc?.lat || 0}&dlng=${endLoc?.lon || 0}`;
//   const rapidoHref = `rapido://`;

//   return (
//     <div style={{
//       background: "#fff",
//       borderRadius: 22,
//       border: isTop ? `2px solid ${pCfg.border}` : "1.5px solid #F0F0EE",
//       boxShadow: isTop
//         ? `0 8px 32px ${pCfg.color}18, 0 1px 4px rgba(0,0,0,0.04)`
//         : "0 2px 14px rgba(0,0,0,0.05)",
//       overflow: "hidden",
//       animation: "cardIn .45s cubic-bezier(.34,1.1,.64,1) both",
//       animationDelay: `${index * 85}ms`,
//     }}>
//       {/* Accent top strip */}
//       {isTop && (
//         <div style={{ height: 5, background: `linear-gradient(90deg, ${pCfg.color}, ${pCfg.color}70)` }} />
//       )}

//       {/* ── Card Header ── */}
//       <div style={{ padding: "16px 18px 14px" }}>
//         <div style={{ display: "flex", alignItems: "flex-start", gap: 12, justifyContent: "space-between" }}>

//           {/* Left: tags + desc */}
//           <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
//               {isTop && (
//                 <div style={{ display: "flex", alignItems: "center", gap: 4, background: pCfg.bg, border: `1px solid ${pCfg.border}`, borderRadius: 99, padding: "4px 11px" }}>
//                   <Sparkles size={11} color={pCfg.color} />
//                   <span style={{ fontSize: 11, fontWeight: 800, color: pCfg.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{pCfg.badge}</span>
//                 </div>
//               )}
//               <div style={{ background: tCfg.bg, borderRadius: 99, padding: "4px 11px", fontSize: 11, fontWeight: 700, color: tCfg.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
//                 {tCfg.label}
//               </div>
//               {!isTop && (
//                 <div style={{ background: "#F3F4F6", borderRadius: 99, padding: "4px 11px", fontSize: 11, fontWeight: 600, color: "#6B7280", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
//                   Alternative
//                 </div>
//               )}
//             </div>
//             <p style={{ margin: 0, fontSize: 13, color: "#6B7280", lineHeight: 1.5, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{route.desc}</p>
//           </div>

//           {/* Right: price bubble */}
//           <div style={{
//             flexShrink: 0, textAlign: "right",
//             background: isTop ? pCfg.pill : "#F7F7F5",
//             border: `1.5px solid ${isTop ? pCfg.border : "#EBEBEB"}`,
//             borderRadius: 16, padding: "10px 14px",
//             minWidth: 72,
//           }}>
//             <div style={{ fontSize: 24, fontWeight: 900, color: isTop ? pCfg.color : "#111827", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>₹{route.cost}</div>
//             <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>total fare</div>
//           </div>
//         </div>

//         {/* Duration chip */}
//         <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, background: "#F7F7F5", border: "1px solid #EBEBEB", borderRadius: 10, padding: "7px 12px" }}>
//           <Clock size={14} color="#6B7280" />
//           <span style={{ fontSize: 15, fontWeight: 800, color: "#111827", fontFamily: "'JetBrains Mono',monospace" }}>{route.time}</span>
//           <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>min estimated</span>
//         </div>
//       </div>

//       {/* ── Segment bar ── */}
//       <div style={{ padding: "0 18px 16px", borderBottom: "1px solid #F7F7F5" }}>
//         <SegmentBar breakdown={route.time_breakdown} />
//       </div>

//       {/* ── Cab breakdown ── */}
//       {hasCab && route.cab_breakdown && (
//         <div style={{ padding: "14px 18px", borderBottom: "1px solid #F7F7F5" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
//             <div style={{ width: 24, height: 24, borderRadius: 8, background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
//               <Car size={13} color="#fff" />
//             </div>
//             <span style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Cab Fare Breakdown</span>
//           </div>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
//             {[
//               { label: "Base Fare", val: route.cab_breakdown.base_fare, emoji: "🚗" },
//               { label: "Surge",     val: route.cab_breakdown.surge,     emoji: "⚡" },
//               { label: "Distance",  val: route.cab_breakdown.distance_fare, emoji: "📍" },
//             ].map(({ label, val, emoji }) => (
//               <div key={label} style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 13, padding: "11px 8px", textAlign: "center" }}>
//                 <div style={{ fontSize: 16 }}>{emoji}</div>
//                 <div style={{ fontSize: 17, fontWeight: 800, color: "#7C3AED", fontFamily: "'JetBrains Mono',monospace", marginTop: 5, lineHeight: 1 }}>₹{val}</div>
//                 <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* ── Metro accordion ── */}
//       {hasMetro && (
//         <div style={{ padding: "0 18px 14px" }}>
//           <MetroAccordion segments={route.metro_segments} fare={route.metro_fare} />
//         </div>
//       )}

//       {/* ── Ride hailing ── */}
//       {hasCab && (
//         <div style={{ padding: "14px 18px 18px", background: "#FAFAF8", borderTop: "1px solid #F3F4F6" }}>
//           <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Book instantly via</div>
//           <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//             <RideBtn label="Uber"   emoji="⬛" href={uberHref}   bg="#000"    color="#fff"    border="#000" />
//             <RideBtn label="Ola"    emoji="🟡" href={`olacabs://app/launch?lat=${startLoc?.lat||0}&lng=${startLoc?.lon||0}&dlat=${endLoc?.lat||0}&dlng=${endLoc?.lon||0}`}    bg="#F5A623" color="#000"    border="#D48B0A" />
//             <RideBtn label="Rapido" emoji="⚡" href={rapidoHref} bg="#FF5722" color="#fff"    border="#D84315" />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





function RouteCard({ route, isTop, priority, startLoc, endLoc, index }) {
  const pCfg = PRIORITY[priority];
  
  // 1. Detect Cab/Metro from Python's string output
  const rTypeStr = route.type.toLowerCase();
  const hasCab = rTypeStr.includes("cab");
  const hasMetro = rTypeStr.includes("metro");
  const tCfg = TYPE[route.type] || { label: route.type.replace("Hybrid (", "").replace(")", ""), color: "#0284C7", bg: "#E0F2FE" };

  const uberHref  = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${endLoc?.lat || 0}&dropoff[longitude]=${endLoc?.lon || 0}`;
  const olaHref   = `olacabs://app/launch?lat=${startLoc?.lat || 0}&lng=${startLoc?.lon || 0}&dlat=${endLoc?.lat || 0}&dlng=${endLoc?.lon || 0}`;
  const rapidoHref = `rapido://`;

  // 2. Translate Python's "leg1 / leg2" into "walk / cab" for the color bar
  const normalizedBreakdown = (() => {
    const tb = route.time_breakdown || {};
    if (tb.walk !== undefined || tb.cab !== undefined) return tb; 
    const mapped = { walk: 0, cab: 0, metro: tb.metro || 0 };
    if (tb.leg1 > 0) mapped[route.leg1_mode?.toLowerCase() === "walk" ? "walk" : "cab"] += tb.leg1;
    if (tb.leg2 > 0) mapped[route.leg2_mode?.toLowerCase() === "walk" ? "walk" : "cab"] += tb.leg2;
    return mapped;
  })();

  // 3. Format Python's Metro text into React UI Arrays/Objects
  const metroSegments = route.metro_segments || route.desc.split("->").map(s => s.trim());
  const parsedFare = typeof route.metro_fare === 'string' 
    ? { 
        dmrc: parseInt(route.metro_fare.match(/DMRC: Rs (\d+)/)?.[1] || 0), 
        nmrc: parseInt(route.metro_fare.match(/NMRC: Rs (\d+)/)?.[1] || 0) 
      } 
    : route.metro_fare;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 22,
      border: isTop ? `2px solid ${pCfg.border}` : "1.5px solid #F0F0EE",
      boxShadow: isTop ? `0 8px 32px ${pCfg.color}18, 0 1px 4px rgba(0,0,0,0.04)` : "0 2px 14px rgba(0,0,0,0.05)",
      overflow: "hidden",
      animation: "cardIn .45s cubic-bezier(.34,1.1,.64,1) both",
      animationDelay: `${index * 85}ms`,
    }}>
      {isTop && <div style={{ height: 5, background: `linear-gradient(90deg, ${pCfg.color}, ${pCfg.color}70)` }} />}

      <div style={{ padding: "16px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {isTop && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: pCfg.bg, border: `1px solid ${pCfg.border}`, borderRadius: 99, padding: "4px 11px" }}>
                  <Sparkles size={11} color={pCfg.color} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: pCfg.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{pCfg.badge}</span>
                </div>
              )}
              <div style={{ background: tCfg.bg, borderRadius: 99, padding: "4px 11px", fontSize: 11, fontWeight: 700, color: tCfg.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {tCfg.label}
              </div>
              {!isTop && (
                <div style={{ background: "#F3F4F6", borderRadius: 99, padding: "4px 11px", fontSize: 11, fontWeight: 600, color: "#6B7280", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  Alternative
                </div>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#6B7280", lineHeight: 1.5, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{route.desc}</p>
          </div>

          <div style={{ flexShrink: 0, textAlign: "right", background: isTop ? pCfg.pill : "#F7F7F5", border: `1.5px solid ${isTop ? pCfg.border : "#EBEBEB"}`, borderRadius: 16, padding: "10px 14px", minWidth: 72 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: isTop ? pCfg.color : "#111827", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>₹{Math.round(route.cost)}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>total fare</div>
          </div>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, background: "#F7F7F5", border: "1px solid #EBEBEB", borderRadius: 10, padding: "7px 12px" }}>
          <Clock size={14} color="#6B7280" />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#111827", fontFamily: "'JetBrains Mono',monospace" }}>{route.time}</span>
          <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>min estimated</span>
        </div>
      </div>

      <div style={{ padding: "0 18px 16px", borderBottom: "1px solid #F7F7F5" }}>
        <SegmentBar breakdown={normalizedBreakdown} />
      </div>

      {hasCab && route.cab_breakdown && (
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F7F7F5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Car size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Cab Fare Breakdown</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Base", val: route.cab_breakdown.base || route.cab_breakdown.base_fare, emoji: "🚗" },
              { label: "Surge", val: route.cab_breakdown.surge_amount || route.cab_breakdown.surge, emoji: "⚡" },
              { label: "Dist", val: route.cab_breakdown.distance_fare, emoji: "📍" },
            ].map(({ label, val, emoji }) => (
              <div key={label} style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 13, padding: "11px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{emoji}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#7C3AED", fontFamily: "'JetBrains Mono',monospace", marginTop: 5, lineHeight: 1 }}>₹{Math.round(val || 0)}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasMetro && (
        <div style={{ padding: "0 18px 14px" }}>
          <MetroAccordion segments={metroSegments} fare={parsedFare} />
        </div>
      )}

      {hasCab && (
        <div style={{ padding: "14px 18px 18px", background: "#FAFAF8", borderTop: "1px solid #F3F4F6" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Book instantly via</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <RideBtn label="Uber" emoji="⬛" href={uberHref} bg="#000" color="#fff" border="#000" />
            <RideBtn label="Ola" emoji="🟡" href={olaHref} bg="#F5A623" color="#000" border="#D48B0A" />
            <RideBtn label="Rapido" emoji="⚡" href={rapidoHref} bg="#FF5722" color="#fff" border="#D84315" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [from,      setFrom]      = useState("");
  const [to,        setTo]        = useState("");
  const [fromLoc,   setFromLoc]   = useState(null);
  const [toLoc,     setToLoc]     = useState(null);
  const [priority,  setPriority]  = useState("fastest");
  const [maxTime,   setMaxTime]   = useState("");
  const [routes,    setRoutes]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [searched,  setSearched]  = useState(false);
  const [geoLoad,   setGeoLoad]   = useState(false);
  const resultsRef = useRef(null);

  // Font injection
  useEffect(() => {
    if (!document.getElementById("radar-fonts")) {
      const l = Object.assign(document.createElement("link"), { id: "radar-fonts", rel: "stylesheet", href: FONT_LINK });
      document.head.appendChild(l);
    }
    document.body.style.cssText = "margin:0;padding:0;background:#F4F3EF;";
  }, []);

  const geoLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoad(true);
    navigator.geolocation.getCurrentPosition(
      pos => { const l = { name: "My Location", lat: pos.coords.latitude, lon: pos.coords.longitude }; setFromLoc(l); setFrom(l.name); setGeoLoad(false); },
      () => setGeoLoad(false)
    );
  }, []);

  const swap = () => { setFrom(to); setTo(from); setFromLoc(toLoc); setToLoc(fromLoc); };

  const search = async () => {
    if (!fromLoc || !toLoc) { setError("Please pick both locations from the suggestions."); return; }
    setError(null); setLoading(true); setSearched(true); setRoutes([]);
    try {
      let data;
      try {
        const r = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start_lat: fromLoc.lat, start_lon: fromLoc.lon, start_name: fromLoc.name, end_lat: toLoc.lat, end_lon: toLoc.lon, end_name: toLoc.name }),
        });
        if (!r.ok) throw new Error();
        data = await r.json();
      } catch {
        await new Promise(r => setTimeout(r, 1300));
        data = MOCK_ROUTES;
      }
      setRoutes(sortRoutes(data, priority));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch { setError("Something went wrong — please try again."); }
    finally { setLoading(false); }
  };

  // 1. Calculate the fastest possible time
  const earliest = routes.length > 0 ? Math.min(...routes.map(r => r.time)) : 0;
  
  // 2. Check if the journey is completely impossible
  const impossible = maxTime && routes.length > 0 && earliest > Number(maxTime);
  const pCfg = PRIORITY[priority];

  // 3. THE FIX: Filter out slow routes FIRST, then sort what is left!
  const filteredRoutes = routes.filter(r => {
    if (!maxTime) return true; // If input is empty, keep everything
    return r.time <= Number(maxTime); // Otherwise, strictly enforce the time limit
  });
  
  const displayedRoutes = sortRoutes(filteredRoutes, priority);

  return (
    <div style={{ minHeight: "100vh", background: "#F4F3EF", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <style>{`
        @keyframes cardIn  { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin    { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        input::placeholder{color:#C4C9D4;}
        button:focus{outline:none;}
        input:focus{outline:none;}
      `}</style>

      {/* ════════════════════════════════
          HERO HEADER
      ════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(150deg, #3730A3 0%, #4338CA 50%, #6366F1 100%)",
        paddingBottom: 56,
        position: "relative", overflow: "hidden",
      }}>
        {/* Background decoration */}
        <svg style={{ position: "absolute", top: 0, right: 0, opacity: 0.07, width: 320 }} viewBox="0 0 320 320" fill="none">
          <circle cx="280" cy="60"  r="120" fill="white" />
          <circle cx="60"  cy="280" r="80"  fill="white" />
          <circle cx="200" cy="200" r="40"  fill="white" />
        </svg>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 0", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
              <Navigation size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Bricolage Grotesque',sans-serif", letterSpacing: "-0.04em", lineHeight: 1 }}>SafarGuru</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>Mobility Engine</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 99, padding: "5px 14px", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>Delhi NCR</span>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ padding: "28px 20px 0", position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(26px,7vw,34px)", fontWeight: 900, color: "#fff", fontFamily: "'Bricolage Grotesque',sans-serif", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
            Where are you<br />headed today?
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "rgba(255,255,255,0.60)", fontWeight: 500, lineHeight: 1.5 }}>
           The Smartest Route
          </p>
        </div>

        {/* ── Search Card (overlapping) ── */}
        <div style={{
          margin: "24px 16px 0", position: "relative", zIndex: 2,
          background: "#fff", borderRadius: 24,
          boxShadow: "0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.06)",
          padding: "18px 16px",
          width: "calc(100% - 32px)", /* Forces exact mobile width */
          boxSizing: "border-box" /* Prevents padding from breaking width */
        }}>
          {/* From / To row */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            
            {/* Inputs - Added minWidth: 0 to prevent mobile overflow */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <LocationInput value={from} onChange={setFrom} onSelect={l => { setFromLoc(l); setFrom(l.name); }} placeholder="Pick-up location" dotColor="#059669" geoBtn onGeo={geoLocate} geoLoading={geoLoad} />
              <LocationInput value={to}   onChange={setTo}   onSelect={l => { setToLoc(l);   setTo(l.name);   }} placeholder="Drop-off location" dotColor="#DC2626" />
            </div>

            {/* Swap Button */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              <button
                onClick={swap}
                style={{ width: 38, height: 38, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#F7F7F5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .18s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.borderColor = "#C7D2FE"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#F7F7F5"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
              >
                <ArrowDownUp size={15} color="#6B7280" />
              </button>
            </div>
          </div>

          {/* Inline error */}
          {error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 10, padding: "10px 12px" }}>
              <AlertTriangle size={13} color="#E11D48" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: "#E11D48", fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{error}</span>
            </div>
          )}

          {/* Search CTA */}
          <button
            onClick={search}
            disabled={loading}
            style={{
              width: "100%", marginTop: 14, padding: "15px 20px",
              background: loading ? "#A5B4FC" : "#4338CA",
              color: "#fff", border: "none", borderRadius: 14,
              fontSize: 15, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 6px 20px rgba(67,56,202,0.35)",
              transition: "all .2s", fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "#3730A3"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(67,56,202,0.45)"; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "#4338CA"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(67,56,202,0.35)"; } }}
          >
            {loading
              ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Finding best routes…</>
              : <><Search size={16} /> Search Routes</>}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════
          PRIORITY + MAX TIME FILTER
      ════════════════════════════════ */}
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ background: "#fff", borderRadius: 22, border: "1.5px solid #EBEBEB", padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>

          {/* Priority pills */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Optimise for</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {Object.entries(PRIORITY).map(([key, cfg]) => {
              const Ic = cfg.icon;
              const active = priority === key;
              return (
                <button
                  key={key}
                  onClick={() => setPriority(key)}
                  style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "11px 6px",
                    background: active ? cfg.pill : "#F7F7F5",
                    border: `2px solid ${active ? cfg.border : "#EBEBEB"}`,
                    borderRadius: 16, cursor: "pointer", transition: "all .2s",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: active ? cfg.bg : "#EFEFEF", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                    <Ic size={16} color={active ? cfg.color : "#9CA3AF"} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? cfg.color : "#9CA3AF", transition: "color .2s" }}>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Max time */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Time limit (optional)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7F7F5", border: "1.5px solid #E5E7EB", borderRadius: 13, padding: "11px 14px" }}>
            <Clock size={15} color="#9CA3AF" />
            <input
              type="number"
              value={maxTime}
              onChange={e => setMaxTime(e.target.value)}
              placeholder="e.g. 60 minutes"
              style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: "#111827", fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            />
            {maxTime && <span style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>min</span>}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          RESULTS SECTION
      ════════════════════════════════ */}
      <div ref={resultsRef} style={{ padding: "20px 16px 52px" }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 0", gap: 20, animation: "fadeUp .3s ease both" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 68, height: 68, borderRadius: 22, background: "linear-gradient(135deg,#EEF2FF,#fff)", border: "2px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px rgba(67,56,202,0.14)" }}>
                <Loader2 size={28} color="#4338CA" style={{ animation: "spin 1s linear infinite" }} />
              </div>
              <div style={{ position: "absolute", inset: -10, borderRadius: 32, border: "2px solid rgba(67,56,202,0.18)", animation: "pulse 1.8s ease-out infinite" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", fontFamily: "'Bricolage Grotesque',sans-serif" }}>Finding optimal routes</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 5 }}>Querying metro graph & live traffic…</div>
            </div>
            {["Checking Aqua Line schedules…", "Calculating cab surge pricing…", "Running McRAPTOR algorithm…"].map((t, i) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#fff", borderRadius: 10, border: "1px solid #F0F0EE", animation: "fadeUp .4s ease both", animationDelay: `${i * 200}ms` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4338CA", animation: "pulse 1.5s infinite", animationDelay: `${i * 300}ms` }} />
                <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t}</span>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !searched && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 0 16px", gap: 16, textAlign: "center", animation: "fadeUp .35s ease both" }}>
            <div style={{ width: 76, height: 76, borderRadius: 26, background: "linear-gradient(135deg,#EEF2FF,#fff)", border: "1.5px solid #E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 24px rgba(67,56,202,0.10)" }}>
              <Navigation size={30} color="#4338CA" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", fontFamily: "'Bricolage Grotesque',sans-serif" }}>Plan your journey</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6, lineHeight: 1.6, maxWidth: 270 }}>
                Enter your pick-up and drop-off above to discover the smartest multi-modal routes across Delhi NCR.
              </div>
            </div>
            {/* Mode chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              {Object.values(TYPE).map(t => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1.5px solid #EBEBEB", borderRadius: 99, padding: "5px 12px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.color }} />
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impossible timeframe */}
        {!loading && searched && impossible && (
          <div style={{ background: "#FFFBEB", border: "2px solid #FDE68A", borderRadius: 22, padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center", animation: "cardIn .4s ease both" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF3C7", border: "2px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={26} color="#D97706" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#92400E", fontFamily: "'Bricolage Grotesque',sans-serif" }}>Journey impossible in {maxTime} min</div>
              <div style={{ fontSize: 13, color: "#92400E", opacity: 0.75, marginTop: 6, lineHeight: 1.6 }}>
                The fastest available route takes <strong>{earliest} minutes</strong>.<br />Try increasing your time limit.
              </div>
            </div>
            <button
              onClick={() => setMaxTime("")}
              style={{ background: "#D97706", color: "#fff", border: "none", borderRadius: 11, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: "0 4px 12px rgba(217,119,6,0.3)" }}
            >
              Clear time limit
            </button>
          </div>
        )}

        {/* Route cards */}
        {!loading && !impossible && routes.length > 0 && (
          <>
            {/* Result header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, animation: "fadeUp .3s ease both" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", fontFamily: "'Bricolage Grotesque',sans-serif" }}>{displayedRoutes.length} routes found</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  Sorted by <span style={{ color: pCfg.color, fontWeight: 700 }}>{pCfg.label.toLowerCase()}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: pCfg.bg, border: `1.5px solid ${pCfg.border}`, borderRadius: 99, padding: "5px 12px" }}>
                <CheckCircle2 size={12} color={pCfg.color} />
                <span style={{ fontSize: 11, fontWeight: 700, color: pCfg.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{pCfg.badge} first</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {displayedRoutes.map((route, i) => (
                <RouteCard key={i} route={route} isTop={i === 0} priority={priority} startLoc={fromLoc} endLoc={toLoc} index={i} />
              ))}
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <div style={{ fontSize: 11, color: "#C4C9D4", fontWeight: 600, letterSpacing: "0.06em", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>RADAR · Delhi NCR Multimodal Engine</div>
              <div style={{ fontSize: 10, color: "#D1D5DB", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Fares are estimates. Actual cost may vary.</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
