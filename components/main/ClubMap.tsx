"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { BOOK_FAC, BOOK_ST } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";

/* ── Zone type ── */
type Zone = {
  k: string;
  l: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: "cancha" | "hockey" | "pool" | "building" | "parking" | "label";
  facKey?: string;
  rotate?: boolean;
};

/* ── Zone definitions: Mapa Urquiza (main club area) ── */
const ZONES_URQUIZA: Zone[] = [
  { k: "cancha1",  l: "CANCHA 1",        x: 2,  y: 6,  w: 30, h: 33, type: "cancha",   facKey: "cancha1" },
  { k: "hockey1",  l: "HOCKEY 1",        x: 34, y: 6,  w: 16, h: 22, type: "hockey",   facKey: "hockey1" },
  { k: "estUrq",   l: "EST. URQUIZA",    x: 55, y: 3,  w: 32, h: 15, type: "parking" },
  { k: "cancha2",  l: "CANCHA 2",        x: 55, y: 22, w: 32, h: 24, type: "cancha",   facKey: "cancha2", rotate: true },
  { k: "pileta",   l: "PILETA",          x: 34, y: 30, w: 10, h: 8,  type: "pool",     facKey: "pileta" },
  { k: "pajarera", l: "PAJARERA",        x: 46, y: 30, w: 5,  h: 8,  type: "building", facKey: "pajarera" },
  { k: "cantina",  l: "CANTINA",         x: 2,  y: 42, w: 16, h: 5,  type: "building", facKey: "cantina" },
  { k: "gym",      l: "GYM",             x: 20, y: 42, w: 20, h: 5,  type: "building", facKey: "gimnasio" },
  { k: "secre",    l: "SECRETARIA",      x: 2,  y: 49, w: 4,  h: 10, type: "label" },
  { k: "shop",     l: "TORDOS\nSHOP",    x: 7,  y: 49, w: 5,  h: 7,  type: "label" },
  { k: "cancha3",  l: "CANCHA 3",        x: 14, y: 50, w: 28, h: 16, type: "cancha",   facKey: "cancha3" },
  { k: "cancha4",  l: "CANCHA 4",        x: 14, y: 68, w: 28, h: 16, type: "cancha",   facKey: "cancha4" },
  { k: "hockey2",  l: "HOCKEY 2",        x: 48, y: 52, w: 22, h: 18, type: "hockey",   facKey: "hockey2" },
  { k: "salon",    l: "SALON\nBLANCO",   x: 42, y: 42, w: 12, h: 5,  type: "building", facKey: "salon" },
  { k: "pergola",  l: "PÉRGOLA",         x: 52, y: 30, w: 8,  h: 8,  type: "building", facKey: "pergola" },
];

/* ── Zone definitions: Mapa Anexo (separate area) ── */
const ZONES_ANEXO: Zone[] = [
  { k: "cancha5",  l: "CANCHA 5",          x: 5,  y: 8,  w: 42, h: 50, type: "cancha",  facKey: "cancha5" },
  { k: "cancha6",  l: "CANCHA 6",          x: 53, y: 8,  w: 42, h: 50, type: "cancha",  facKey: "cancha6" },
  { k: "estMad",   l: "EST.\nMADRESELVA",  x: 5,  y: 66, w: 90, h: 22, type: "parking" },
];

/* ── Zone definitions: Mapa Hockey ── */
const ZONES_HOCKEY: Zone[] = [
  { k: "hockey1",  l: "HOCKEY 1",  x: 5,  y: 8,  w: 42, h: 75, type: "hockey", facKey: "hockey1" },
  { k: "hockey2",  l: "HOCKEY 2",  x: 53, y: 8,  w: 42, h: 75, type: "hockey", facKey: "hockey2" },
];

/* ── Map tab type ── */
type MapTab = "urquiza" | "anexo" | "hockey";

/* ── Color helpers ── */
const CANCHA_FREE = "#4ADE80";
const CANCHA_BOOKED = "#16A34A";
const HOCKEY_FREE = "#9CA3AF";
const HOCKEY_BOOKED = "#6B7280";
const POOL_FREE = "#38BDF8";
const POOL_BOOKED = "#0284C7";
const BUILDING_FREE = "#475569";
const BUILDING_BOOKED = "#334155";
const PARKING_BG = "#6B7280";
const LABEL_BG = "#64748B";

/* ── Status color mapping ── */
const statusOverlayColor = (st: string) => {
  if (st === "confirmada") return "rgba(16,185,129,0.25)";
  if (st === "pendiente") return "rgba(245,158,11,0.25)";
  if (st === "cancelada") return "rgba(220,38,38,0.2)";
  return "rgba(0,0,0,0.1)";
};

/* ── Rugby field SVG markings ── */
function RugbyMarkings({ w, h, rotate }: { w: number; h: number; rotate?: boolean }) {
  if (rotate) {
    return (
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <line x1={w / 2} y1={h * 0.1} x2={w / 2} y2={h * 0.9} stroke="rgba(255,255,255,0.5)" strokeWidth={0.3} strokeDasharray="1,0.8" />
        <line x1={w * 0.25} y1={h * 0.1} x2={w * 0.25} y2={h * 0.9} stroke="rgba(255,255,255,0.25)" strokeWidth={0.2} strokeDasharray="0.6,0.6" />
        <line x1={w * 0.75} y1={h * 0.1} x2={w * 0.75} y2={h * 0.9} stroke="rgba(255,255,255,0.25)" strokeWidth={0.2} strokeDasharray="0.6,0.6" />
        <line x1={w * 0.08} y1={h * 0.15} x2={w * 0.08} y2={h * 0.85} stroke="rgba(255,255,255,0.4)" strokeWidth={0.25} />
        <line x1={w * 0.92} y1={h * 0.15} x2={w * 0.92} y2={h * 0.85} stroke="rgba(255,255,255,0.4)" strokeWidth={0.25} />
        <line x1={w * 0.04} y1={h * 0.4} x2={w * 0.04} y2={h * 0.6} stroke="rgba(255,255,255,0.6)" strokeWidth={0.3} />
        <line x1={w * 0.04} y1={h * 0.5} x2={w * 0.07} y2={h * 0.5} stroke="rgba(255,255,255,0.6)" strokeWidth={0.3} />
        <line x1={w * 0.96} y1={h * 0.4} x2={w * 0.96} y2={h * 0.6} stroke="rgba(255,255,255,0.6)" strokeWidth={0.3} />
        <line x1={w * 0.93} y1={h * 0.5} x2={w * 0.96} y2={h * 0.5} stroke="rgba(255,255,255,0.6)" strokeWidth={0.3} />
        <rect x={w * 0.04} y={h * 0.1} width={w * 0.92} height={h * 0.8} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.2} />
      </svg>
    );
  }
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <line x1={w * 0.1} y1={h / 2} x2={w * 0.9} y2={h / 2} stroke="rgba(255,255,255,0.5)" strokeWidth={0.3} strokeDasharray="1,0.8" />
      <line x1={w * 0.1} y1={h * 0.25} x2={w * 0.9} y2={h * 0.25} stroke="rgba(255,255,255,0.25)" strokeWidth={0.2} strokeDasharray="0.6,0.6" />
      <line x1={w * 0.1} y1={h * 0.75} x2={w * 0.9} y2={h * 0.75} stroke="rgba(255,255,255,0.25)" strokeWidth={0.2} strokeDasharray="0.6,0.6" />
      <line x1={w * 0.15} y1={h * 0.08} x2={w * 0.85} y2={h * 0.08} stroke="rgba(255,255,255,0.4)" strokeWidth={0.25} />
      <line x1={w * 0.15} y1={h * 0.92} x2={w * 0.85} y2={h * 0.92} stroke="rgba(255,255,255,0.4)" strokeWidth={0.25} />
      <line x1={w * 0.4} y1={h * 0.03} x2={w * 0.6} y2={h * 0.03} stroke="rgba(255,255,255,0.6)" strokeWidth={0.3} />
      <line x1={w * 0.5} y1={h * 0.03} x2={w * 0.5} y2={h * 0.06} stroke="rgba(255,255,255,0.6)" strokeWidth={0.3} />
      <line x1={w * 0.4} y1={h * 0.97} x2={w * 0.6} y2={h * 0.97} stroke="rgba(255,255,255,0.6)" strokeWidth={0.3} />
      <line x1={w * 0.5} y1={h * 0.94} x2={w * 0.5} y2={h * 0.97} stroke="rgba(255,255,255,0.6)" strokeWidth={0.3} />
      <rect x={w * 0.08} y={h * 0.05} width={w * 0.84} height={h * 0.9} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.2} />
    </svg>
  );
}

/* ── Hockey field SVG markings ── */
function HockeyMarkings({ w, h }: { w: number; h: number }) {
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <rect x={w * 0.06} y={h * 0.08} width={w * 0.88} height={h * 0.84} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.25} />
      <line x1={w * 0.06} y1={h / 2} x2={w * 0.94} y2={h / 2} stroke="rgba(255,255,255,0.35)" strokeWidth={0.2} strokeDasharray="0.8,0.6" />
      <path d={`M ${w * 0.3} ${h * 0.12} A ${w * 0.2} ${h * 0.15} 0 0 1 ${w * 0.7} ${h * 0.12}`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.2} />
      <path d={`M ${w * 0.3} ${h * 0.88} A ${w * 0.2} ${h * 0.15} 0 0 0 ${w * 0.7} ${h * 0.88}`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.2} />
    </svg>
  );
}

export function ClubMap({ bookings, date, mob, onSelectFacility, onSelectBooking }: any) {
  const { colors, isDark, cardBg } = useC();
  const [mapTab, setMapTab] = useState<MapTab>("urquiza");

  /* ── bookings for the selected date ── */
  const dayBookings = useMemo(() => {
    if (!bookings || !date) return [];
    return bookings.filter((b: any) => b.date === date && b.status !== "cancelada");
  }, [bookings, date]);

  /* ── lookup: facilityKey -> bookings[] ── */
  const facMap = useMemo(() => {
    const m: Record<string, any[]> = {};
    dayBookings.forEach((b: any) => {
      if (!m[b.facility]) m[b.facility] = [];
      m[b.facility].push(b);
    });
    return m;
  }, [dayBookings]);

  /* ── get background color for a zone ── */
  const zoneBg = (z: Zone, booked: boolean) => {
    switch (z.type) {
      case "cancha": return booked ? CANCHA_BOOKED : CANCHA_FREE;
      case "hockey": return booked ? HOCKEY_BOOKED : HOCKEY_FREE;
      case "pool": return booked ? POOL_BOOKED : POOL_FREE;
      case "building": return booked ? BUILDING_BOOKED : BUILDING_FREE;
      case "parking": return PARKING_BG;
      case "label": return LABEL_BG;
      default: return "#9CA3AF";
    }
  };

  /* ── click handler for a zone ── */
  const handleClick = (z: Zone) => {
    if (!z.facKey) return;
    const zoneBookings = facMap[z.facKey];
    if (zoneBookings && zoneBookings.length > 0) {
      onSelectBooking?.(zoneBookings[0]);
    } else {
      onSelectFacility?.(z.facKey);
    }
  };

  /* ── render a single zone ── */
  const renderZone = (z: Zone) => {
    const isBookable = !!z.facKey;
    const zoneBookings = z.facKey ? (facMap[z.facKey] || []) : [];
    const booked = zoneBookings.length > 0;
    const bg = zoneBg(z, booked);
    const firstBooking = zoneBookings[0];
    const statusInfo = firstBooking ? BOOK_ST[firstBooking.status] : null;
    const isSmall = z.w < 8 || z.h < 8;
    const fontSize = mob
      ? (isSmall ? 7 : z.type === "building" ? 8 : 9)
      : (isSmall ? 7 : z.type === "building" ? 9 : 10);

    return (
      <div
        key={z.k}
        onClick={() => isBookable && handleClick(z)}
        style={{
          position: "absolute" as const,
          left: z.x + "%",
          top: z.y + "%",
          width: z.w + "%",
          height: z.h + "%",
          background: bg,
          borderRadius: z.type === "pool" ? 8 : z.type === "building" ? 4 : 6,
          cursor: isBookable ? "pointer" : "default",
          overflow: "hidden",
          transition: "filter 0.15s, box-shadow 0.15s",
          boxShadow: isBookable ? "0 2px 8px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.1)",
          border: isBookable
            ? (booked
              ? `2px solid ${statusInfo?.c || "#fff"}90`
              : `1px solid rgba(255,255,255,0.2)`)
            : `1px solid rgba(0,0,0,0.15)`,
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none" as const
        }}
        onMouseEnter={e => { if (isBookable) (e.currentTarget as HTMLDivElement).style.filter = "brightness(1.12)"; }}
        onMouseLeave={e => { if (isBookable) (e.currentTarget as HTMLDivElement).style.filter = "brightness(1)"; }}
      >
        {/* Field markings */}
        {z.type === "cancha" && <RugbyMarkings w={z.w} h={z.h} rotate={z.rotate} />}
        {z.type === "hockey" && <HockeyMarkings w={z.w} h={z.h} />}

        {/* Pool wave pattern */}
        {z.type === "pool" && (
          <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "40%", pointerEvents: "none", opacity: 0.3 }} viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 10 Q 15 4, 30 10 Q 45 16, 60 10 Q 75 4, 90 10 L100 10 L100 20 L0 20 Z" fill="rgba(255,255,255,0.4)" />
          </svg>
        )}

        {/* Booking overlay */}
        {booked && statusInfo && (
          <div style={{
            position: "absolute" as const,
            top: 0, left: 0, right: 0, bottom: 0,
            background: statusOverlayColor(firstBooking.status),
            borderRadius: "inherit",
            zIndex: 1
          }} />
        )}

        {/* Content */}
        <div style={{
          position: "relative" as const,
          zIndex: 2,
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center" as const,
          padding: mob ? 2 : 4,
          width: "100%",
          height: "100%"
        }}>
          {/* Zone name */}
          <div style={{
            fontSize: fontSize,
            fontWeight: 800,
            color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            letterSpacing: 0.5,
            lineHeight: 1.2,
            whiteSpace: "pre-line" as const
          }}>
            {z.l}
          </div>

          {/* Booking info (if booked) */}
          {booked && firstBooking && !isSmall && (
            <div style={{
              marginTop: mob ? 2 : 3,
              background: "rgba(0,0,0,0.45)",
              borderRadius: 4,
              padding: mob ? "2px 4px" : "2px 6px",
              maxWidth: "92%"
            }}>
              <div style={{
                fontSize: mob ? 7 : 8,
                fontWeight: 700,
                color: statusInfo?.c || "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const
              }}>
                {statusInfo?.i} {firstBooking.title}
              </div>
              <div style={{
                fontSize: mob ? 6 : 7,
                color: "#CBD5E1",
                fontWeight: 500
              }}>
                {firstBooking.time_start} - {firstBooking.time_end}
              </div>
              {zoneBookings.length > 1 && (
                <div style={{ fontSize: mob ? 6 : 6, color: "#94A3B8", fontWeight: 600 }}>
                  +{zoneBookings.length - 1} mas
                </div>
              )}
            </div>
          )}

          {/* Booked badge for small zones */}
          {booked && isSmall && statusInfo && (
            <div style={{
              marginTop: 1,
              width: mob ? 8 : 6,
              height: mob ? 8 : 6,
              borderRadius: "50%",
              background: statusInfo.c,
              border: "1px solid rgba(255,255,255,0.5)"
            }} />
          )}

          {/* "Libre" indicator for empty bookable zones */}
          {!booked && isBookable && !isSmall && (
            <div style={{
              marginTop: mob ? 2 : 3,
              fontSize: mob ? 7 : 7,
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
              fontStyle: "italic" as const
            }}>
              Libre
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── responsive ── */
  const maxW = mob ? "100vw" : 700;

  /* ── active zones and aspect ratio based on selected tab ── */
  const activeZones = mapTab === "urquiza" ? ZONES_URQUIZA : mapTab === "anexo" ? ZONES_ANEXO : ZONES_HOCKEY;
  const aspectPadding = mapTab === "urquiza" ? "100%" : "65%";

  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      {/* ── Title ── */}
      <div style={{
        textAlign: "center" as const,
        padding: mob ? "8px 6px" : "10px 12px",
        marginBottom: 8,
        background: isDark ? "#0F172A" : "#1E293B",
        borderRadius: 10,
        color: "#fff"
      }}>
        <div style={{ fontSize: mob ? 12 : 15, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" as const }}>
          Disposicion de Espacios
        </div>
        <div style={{ fontSize: mob ? 10 : 12, color: "#94A3B8", marginTop: 2, fontWeight: 500 }}>
          {date ? fmtD(date) : "Seleccione una fecha"}
        </div>
      </div>

      {/* ── Map Tab Selector ── */}
      <div style={{
        display: "flex",
        gap: 0,
        marginBottom: 8,
        borderRadius: 10,
        overflow: "hidden",
        border: `2px solid ${isDark ? "#334155" : "#9CA3AF"}`
      }}>
        {([
          { key: "urquiza" as MapTab, label: "🏈 Urquiza" },
          { key: "anexo" as MapTab, label: "🏈 Anexo" },
          { key: "hockey" as MapTab, label: "🏑 Hockey" }
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setMapTab(t.key)}
            style={{
              flex: 1,
              padding: mob ? "8px 6px" : "10px 12px",
              background: mapTab === t.key
                ? (isDark ? "#1E40AF" : "#2563EB")
                : (isDark ? "#1E293B" : "#F1F5F9"),
              color: mapTab === t.key ? "#fff" : (isDark ? "#94A3B8" : "#475569"),
              border: "none",
              borderRight: t.key !== "hockey" ? `1px solid ${isDark ? "#334155" : "#9CA3AF"}` : "none",
              fontSize: mob ? 11 : 13,
              fontWeight: mapTab === t.key ? 800 : 600,
              cursor: "pointer",
              letterSpacing: 0.5,
              textTransform: "uppercase" as const,
              transition: "background 0.15s, color 0.15s"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Map Container ── */}
      <div style={{
        position: "relative" as const,
        width: "100%",
        paddingBottom: aspectPadding,
        background: isDark ? "#1E293B" : "#D1D5DB",
        borderRadius: 10,
        overflow: "hidden",
        border: `2px solid ${isDark ? "#334155" : "#9CA3AF"}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
      }}>
        {/* ── Render zones for active tab ── */}
        {activeZones.map(z => renderZone(z))}

        {/* ── Road / path labels ── */}
        {mapTab === "urquiza" && (
          <>
            <div style={{
              position: "absolute" as const,
              top: "0.5%",
              left: "55%",
              fontSize: mob ? 7 : 7,
              color: isDark ? "#64748B" : "#475569",
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase" as const,
              opacity: 0.7
            }}>
              Calle Urquiza
            </div>
            <div style={{
              position: "absolute" as const,
              bottom: "0.5%",
              left: "2%",
              fontSize: mob ? 7 : 7,
              color: isDark ? "#64748B" : "#475569",
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase" as const,
              opacity: 0.7
            }}>
              Calle Madreselva
            </div>
          </>
        )}
        {mapTab === "anexo" && (
          <div style={{
            position: "absolute" as const,
            top: "1.5%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: mob ? 7 : 7,
            color: isDark ? "#64748B" : "#475569",
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase" as const,
            opacity: 0.7
          }}>
            Calle Madreselva
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: mob ? 10 : 18,
        marginTop: 10,
        padding: mob ? "6px 8px" : "8px 14px",
        background: isDark ? "#0F172A" : "#F8FAFC",
        borderRadius: 8,
        border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
        flexWrap: "wrap" as const
      }}>
        {/* Libre */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: mob ? 8 : 10, height: mob ? 8 : 10, borderRadius: "50%", background: CANCHA_FREE, border: "1px solid rgba(0,0,0,0.1)" }} />
          <span style={{ fontSize: mob ? 9 : 11, color: colors.g5, fontWeight: 600 }}>Libre</span>
        </div>
        {/* Pendiente */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: mob ? 8 : 10, height: mob ? 8 : 10, borderRadius: "50%", background: BOOK_ST.pendiente.c, border: "1px solid rgba(0,0,0,0.1)" }} />
          <span style={{ fontSize: mob ? 9 : 11, color: colors.g5, fontWeight: 600 }}>Pendiente</span>
        </div>
        {/* Confirmada */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: mob ? 8 : 10, height: mob ? 8 : 10, borderRadius: "50%", background: BOOK_ST.confirmada.c, border: "1px solid rgba(0,0,0,0.1)" }} />
          <span style={{ fontSize: mob ? 9 : 11, color: colors.g5, fontWeight: 600 }}>Confirmada</span>
        </div>
        {/* No reservable */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: mob ? 8 : 10, height: mob ? 8 : 10, borderRadius: "50%", background: PARKING_BG, border: "1px solid rgba(0,0,0,0.1)" }} />
          <span style={{ fontSize: mob ? 9 : 11, color: colors.g5, fontWeight: 600 }}>No reservable</span>
        </div>
      </div>

      {/* ── Day summary ── */}
      {dayBookings.length > 0 && (
        <div style={{
          marginTop: 8,
          padding: mob ? "6px 8px" : "8px 14px",
          background: isDark ? "#0F172A" : "#F8FAFC",
          borderRadius: 8,
          border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`
        }}>
          <div style={{ fontSize: mob ? 10 : 12, fontWeight: 700, color: colors.nv, marginBottom: 6 }}>
            Reservas del dia ({dayBookings.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
            {dayBookings.map((b: any, i: number) => {
              const fac = BOOK_FAC[b.facility];
              const st = BOOK_ST[b.status] || BOOK_ST.pendiente;
              return (
                <div
                  key={b.id || i}
                  onClick={() => onSelectBooking?.(b)}
                  style={{
                    padding: mob ? "8px 10px" : "4px 10px",
                    borderRadius: 6,
                    background: st.bg,
                    border: `1px solid ${st.c}40`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    transition: "transform 0.1s",
                    minHeight: mob ? 40 : undefined
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.03)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; }}
                >
                  <span style={{ fontSize: mob ? 11 : 10, fontWeight: 700, color: st.c }}>
                    {st.i} {fac?.l || b.facility}
                  </span>
                  <span style={{ fontSize: mob ? 10 : 9, color: colors.g5, fontWeight: 500 }}>
                    {b.time_start}-{b.time_end}
                  </span>
                  <span style={{
                    fontSize: mob ? 10 : 9,
                    color: colors.nv,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                    maxWidth: mob ? 60 : 100
                  }}>
                    {b.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
