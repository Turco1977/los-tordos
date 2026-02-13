"use client";
import { useState, useEffect } from "react";
import { T } from "@/lib/constants";
import { uploadFile, getFileIcon } from "@/lib/storage";
import { paginate } from "@/lib/pagination";

/* ── TOAST ── */
export function Toast({ msg, type, onDone }: { msg: string; type: "ok" | "err"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "10px 20px", borderRadius: 10, background: type === "ok" ? "#065F46" : "#991B1B", color: "#fff", fontSize: 12, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,.2)", maxWidth: "90vw", textAlign: "center" }}>
      {type === "ok" ? "✅" : "❌"} {msg}
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
  const vs: Record<string, React.CSSProperties> = {
    p: { background: T.nv, color: "#fff" },
    r: { background: T.rd, color: "#fff" },
    s: { background: T.gn, color: "#fff" },
    w: { background: T.yl, color: "#fff" },
    g: { background: "transparent", color: T.nv, border: "1px solid " + T.g3 },
    pu: { background: T.pr, color: "#fff" },
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
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.05)", border: "1px solid " + T.g2, ...(st || {}) }}>
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
  const r = (size / 2) - 6, ci = 2 * Math.PI * r, of2 = ci - (pct / 100) * ci;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.g2} strokeWidth="5" />
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
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "center", marginTop: 12 }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + T.g3, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, opacity: page <= 1 ? .4 : 1 }}>←</button>
      <span style={{ fontSize: 11, color: T.g5, fontWeight: 600 }}>{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + T.g3, background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, opacity: page >= totalPages ? .4 : 1 }}>→</button>
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
      <label style={{ fontSize: 10, fontWeight: 600, color: T.g5 }}>Archivo/cotización</label>
      <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL o subir archivo..." style={{ flex: 1, padding: 7, borderRadius: 7, border: "1px solid " + T.g3, fontSize: 12, boxSizing: "border-box" as const }} />
        <label style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid " + T.g3, background: "#fff", fontSize: 11, fontWeight: 600, color: T.nv, cursor: uploading ? "wait" : "pointer", opacity: uploading ? .5 : 1 }}>
          {uploading ? "Subiendo..." : "📎 Subir"}
          <input type="file" onChange={doUpload} style={{ display: "none" }} disabled={uploading} />
        </label>
      </div>
      {value && <div style={{ marginTop: 4, fontSize: 10 }}><a href={value} target="_blank" rel="noopener noreferrer" style={{ color: T.bl }}>{getFileIcon(value)} Ver archivo</a></div>}
    </div>
  );
}

/* ── BREADCRUMB ── */
interface BreadProps {
  parts: { label: string; onClick?: () => void }[];
  mob?: boolean;
}
export function Bread({ parts, mob }: BreadProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: mob ? 10 : 14, flexWrap: "wrap" as const }}>
      {parts.map((p, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {i > 0 && <span style={{ color: T.g4, fontSize: 11 }}>›</span>}
          {p.onClick
            ? <button onClick={p.onClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: mob ? 12 : 13, fontWeight: i === parts.length - 1 ? 700 : 500, color: i === parts.length - 1 ? T.nv : T.bl, padding: 0, textDecoration: i < parts.length - 1 ? "underline" : "none" }}>{p.label}</button>
            : <span style={{ fontSize: mob ? 12 : 13, fontWeight: 700, color: T.nv }}>{p.label}</span>}
        </span>
      ))}
    </div>
  );
}
