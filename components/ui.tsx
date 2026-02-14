"use client";
import { useState, useEffect } from "react";
import { T, SC, PSC } from "@/lib/constants";
import { useC } from "@/lib/theme-context";
import { uploadFile, getFileIcon } from "@/lib/storage";
import { paginate } from "@/lib/pagination";

/* ── BADGES ── */
export function Badge({s,sm}:{s:string;sm?:boolean}){const c=SC[s];return <span style={{background:c.bg,color:c.c,padding:sm?"1px 6px":"2px 9px",borderRadius:20,fontSize:sm?9:11,fontWeight:600,whiteSpace:"nowrap"}}>{c.i} {c.l}</span>;}
export function PBadge({s,sm}:{s:string;sm?:boolean}){const c=PSC[s];if(!c)return null;return <span style={{background:c.bg,color:c.c,padding:sm?"1px 6px":"2px 9px",borderRadius:20,fontSize:sm?9:11,fontWeight:600,whiteSpace:"nowrap"}}>{c.i} {c.l}</span>;}

/* ── TOAST ── */
export function Toast({ msg, type, onDone }: { msg: string; type: "ok" | "err"; onDone: () => void }) {
  const dur=Math.max(3000,Math.min(msg.length*60,8000));
  useEffect(() => { const t = setTimeout(onDone, dur); return () => clearTimeout(t); }, [onDone, dur]);
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "10px 20px", borderRadius: 10, background: type === "ok" ? "#065F46" : "#991B1B", color: "#fff", fontSize: 12, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,.2)", maxWidth: "90vw", textAlign: "center", display: "flex", alignItems: "center", gap: 8 }}>
      <span>{type === "ok" ? "✅" : "❌"} {msg}</span>
      <button onClick={onDone} style={{ background: "rgba(255,255,255,.3)", border: "none", borderRadius: 4, color: "#fff", fontSize: 10, cursor: "pointer", padding: "2px 6px", flexShrink: 0 }}>✕</button>
    </div>
  );
}

/* ── MOBILE HOOK ── */
export function useMobile(bp = 768) {
  const [mob, sMob] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    sMob(mq.matches);
    const h = (e: any) => sMob(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [bp]);
  return mob;
}

/* ── BUTTON ── */
type BtnVariant = "p" | "r" | "s" | "w" | "g" | "pu";
type BtnSize = "s" | "m";
interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  v?: BtnVariant;
  s?: BtnSize;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function Btn({ children, onClick, v, s, disabled, style: st }: BtnProps) {
  const { colors, isDark } = useC();
  const vs: Record<string, React.CSSProperties> = {
    p: { background: colors.nv, color: isDark ? "#0F172A" : "#fff" },
    r: { background: colors.rd, color: "#fff" },
    s: { background: colors.gn, color: "#fff" },
    w: { background: colors.yl, color: "#fff" },
    g: { background: "transparent", color: colors.nv, border: "1px solid " + colors.g3 },
    pu: { background: colors.pr, color: "#fff" },
  };
  const sz: Record<string, React.CSSProperties> = {
    s: { padding: "4px 10px", fontSize: 11 },
    m: { padding: "7px 16px", fontSize: 13 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, opacity: disabled ? .5 : 1, ...sz[s || "m"], ...vs[v || "p"], ...(st || {}) }}>
      {children}
    </button>
  );
}

/* ── CARD ── */
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}
export function Card({ children, style: st, onClick }: CardProps) {
  const { cardBg, colors } = useC();
  return (
    <div onClick={onClick} style={{ background: cardBg, borderRadius: 14, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.05)", border: "1px solid " + colors.g2, ...(st || {}) }}>
      {children}
    </div>
  );
}

/* ── PROGRESS RING ── */
interface RingProps {
  pct: number;
  color: string;
  size: number;
  icon?: string;
}
export function Ring({ pct, color, size, icon }: RingProps) {
  const { colors } = useC();
  const r = (size / 2) - 6, ci = 2 * Math.PI * r, of2 = ci - (pct / 100) * ci;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.g2} strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={ci} strokeDashoffset={of2} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {icon && <span style={{ fontSize: size / 4 }}>{icon}</span>}
        <span style={{ fontSize: size / 6, fontWeight: 800, color }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ── PAGER ── */
interface PagerProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}
export function Pager({ page, totalPages, onPage }: PagerProps) {
  const { colors, cardBg } = useC();
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "center", marginTop: 12 }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + colors.g3, background: cardBg, cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, opacity: page <= 1 ? .4 : 1, color: colors.nv }}>←</button>
      <span style={{ fontSize: 11, color: colors.g5, fontWeight: 600 }}>{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + colors.g3, background: cardBg, cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, opacity: page >= totalPages ? .4 : 1, color: colors.nv }}>→</button>
    </div>
  );
}

/* ── FILE UPLOAD FIELD ── */
interface FileFieldProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}
export function FileField({ value, onChange, folder }: FileFieldProps) {
  const { colors, cardBg } = useC();
  const [uploading, sUploading] = useState(false);
  const doUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    sUploading(true);
    const res = await uploadFile(file, folder || "general");
    sUploading(false);
    if ("url" in res) onChange(res.url);
  };
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Archivo/cotización</label>
      <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL o subir archivo..." style={{ flex: 1, padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const }} />
        <label style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid " + colors.g3, background: cardBg, fontSize: 11, fontWeight: 600, color: colors.nv, cursor: uploading ? "wait" : "pointer", opacity: uploading ? .5 : 1 }}>
          {uploading ? "Subiendo..." : "📎 Subir"}
          <input type="file" onChange={doUpload} style={{ display: "none" }} disabled={uploading} />
        </label>
      </div>
      {value && <div style={{ marginTop: 4, fontSize: 10 }}><a href={value} target="_blank" rel="noopener noreferrer" style={{ color: colors.bl }}>{getFileIcon(value)} Ver archivo</a></div>}
    </div>
  );
}

/* ── BREADCRUMB ── */
interface BreadProps {
  parts: { label: string; onClick?: () => void }[];
  mob?: boolean;
}
export function Bread({ parts, mob }: BreadProps) {
  const { colors } = useC();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: mob ? 10 : 14, flexWrap: "wrap" as const }}>
      {parts.map((p, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {i > 0 && <span style={{ color: colors.g4, fontSize: 11 }}>›</span>}
          {p.onClick
            ? <button onClick={p.onClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: mob ? 12 : 13, fontWeight: i === parts.length - 1 ? 700 : 500, color: i === parts.length - 1 ? colors.nv : colors.bl, padding: 0, textDecoration: i < parts.length - 1 ? "underline" : "none" }}>{p.label}</button>
            : <span style={{ fontSize: mob ? 12 : 13, fontWeight: 700, color: colors.nv }}>{p.label}</span>}
        </span>
      ))}
    </div>
  );
}
