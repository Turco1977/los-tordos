"use client";
import { useState, useEffect, useRef, memo } from "react";
import { T, SC, PSC } from "@/lib/constants";
import type { OfflineState } from "@/lib/use-offline";
import { useC } from "@/lib/theme-context";
import { uploadFile, getFileIcon } from "@/lib/storage";
import { paginate } from "@/lib/pagination";

/* ── BADGES ── */
export const Badge = memo(function Badge({s,sm}:{s:string;sm?:boolean}){const c=SC[s];return <span style={{background:c.bg,color:c.c,padding:sm?"1px 6px":"2px 9px",borderRadius:20,fontSize:sm?9:11,fontWeight:600,whiteSpace:"nowrap"}}>{c.i} {c.l}</span>;});
export const PBadge = memo(function PBadge({s,sm}:{s:string;sm?:boolean}){const c=PSC[s];if(!c)return null;return <span style={{background:c.bg,color:c.c,padding:sm?"1px 6px":"2px 9px",borderRadius:20,fontSize:sm?9:11,fontWeight:600,whiteSpace:"nowrap"}}>{c.i} {c.l}</span>;});

/* ── TOAST ── */
export function Toast({ msg, type, onDone }: { msg: string; type: "ok" | "err"; onDone: () => void }) {
  const dur=Math.max(3000,Math.min(msg.length*60,8000));
  useEffect(() => { const t = setTimeout(onDone, dur); return () => clearTimeout(t); }, [onDone, dur]);
  return (
    <div role="alert" aria-live="polite" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "10px 20px", borderRadius: 10, background: type === "ok" ? "#065F46" : "#991B1B", color: "#fff", fontSize: 12, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,.2)", maxWidth: "90vw", textAlign: "center", display: "flex", alignItems: "center", gap: 8 }}>
      <span>{type === "ok" ? "✅" : "❌"} {msg}</span>
      <button onClick={onDone} title="Cerrar" style={{ background: "rgba(255,255,255,.3)", border: "none", borderRadius: 4, color: "#fff", fontSize: 12, cursor: "pointer", padding: "4px 10px", flexShrink: 0 }}>✕</button>
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
  title?: string;
  ariaLabel?: string;
}
export function Btn({ children, onClick, v, s, disabled, style: st, title, ariaLabel }: BtnProps) {
  const { colors, isDark } = useC();
  const vs: Record<string, React.CSSProperties> = {
    p: { background: colors.nv, color: isDark ? "#0F172A" : "#fff" },
    r: { background: colors.rd, color: "#fff" },
    s: { background: colors.gn, color: "#fff" },
    w: { background: colors.yl, color: "#422006" },
    g: { background: "transparent", color: colors.nv, border: "1px solid " + colors.g3 },
    pu: { background: colors.pr, color: "#fff" },
  };
  const sz: Record<string, React.CSSProperties> = {
    s: { padding: "8px 14px", fontSize: 11, minHeight: 36 },
    m: { padding: "7px 16px", fontSize: 13 },
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title} aria-label={ariaLabel || title} style={{ border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, opacity: disabled ? .5 : 1, ...sz[s || "m"], ...vs[v || "p"], ...(st || {}) }}>
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
  pe?: number;
  cu?: number;
  ok?: number;
  tot?: number;
}
export const Ring = memo(function Ring({ pct, color, size, icon, pe, cu, ok, tot }: RingProps) {
  const { colors, isDark } = useC();
  const cx = size / 2, sw = size * 0.07;
  const track = isDark ? "rgba(255,255,255,.25)" : colors.g2;
  if (tot != null && tot > 0) {
    const rExt = cx - sw / 2 - 1, rMid = rExt - sw - 2, rInt = rMid - sw - 2;
    const ciExt = 2 * Math.PI * rExt, ciMid = 2 * Math.PI * rMid, ciInt = 2 * Math.PI * rInt;
    const pePct = (pe ?? 0) / tot, cuPct = (cu ?? 0) / tot, okPct = (ok ?? 0) / tot;
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cx} r={rExt} fill="none" stroke={track} strokeWidth={sw} />
          <circle cx={cx} cy={cx} r={rExt} fill="none" stroke={colors.rd} strokeWidth={sw} strokeDasharray={ciExt} strokeDashoffset={ciExt - pePct * ciExt} strokeLinecap="round" />
          <circle cx={cx} cy={cx} r={rMid} fill="none" stroke={track} strokeWidth={sw} />
          <circle cx={cx} cy={cx} r={rMid} fill="none" stroke={colors.yl} strokeWidth={sw} strokeDasharray={ciMid} strokeDashoffset={ciMid - cuPct * ciMid} strokeLinecap="round" />
          <circle cx={cx} cy={cx} r={rInt} fill="none" stroke={track} strokeWidth={sw} />
          <circle cx={cx} cy={cx} r={rInt} fill="none" stroke={colors.gn} strokeWidth={sw} strokeDasharray={ciInt} strokeDashoffset={ciInt - okPct * ciInt} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {icon && <span style={{ fontSize: size / 5 }}>{icon}</span>}
          <span style={{ fontSize: size / 7, fontWeight: 800, color }}>{pct}%</span>
        </div>
      </div>
    );
  }
  const r = cx - sw / 2 - 1, ci = 2 * Math.PI * r, of2 = ci - (pct / 100) * ci;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={track} strokeWidth={sw} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={ci} strokeDashoffset={of2} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {icon && <span style={{ fontSize: size / 5 }}>{icon}</span>}
        <span style={{ fontSize: size / 7, fontWeight: 800, color }}>{pct}%</span>
      </div>
    </div>
  );
});

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
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={{ padding: "8px 12px", minHeight: 36, borderRadius: 6, border: "1px solid " + colors.g3, background: cardBg, cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, opacity: page <= 1 ? .4 : 1, color: colors.nv }}>←</button>
      <span style={{ fontSize: 11, color: colors.g5, fontWeight: 600 }}>{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} style={{ padding: "8px 12px", minHeight: 36, borderRadius: 6, border: "1px solid " + colors.g3, background: cardBg, cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, opacity: page >= totalPages ? .4 : 1, color: colors.nv }}>→</button>
    </div>
  );
}

/* ── FILE UPLOAD FIELD ── */
interface FileFieldProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  onUploadingChange?: (uploading: boolean) => void;
}
export function FileField({ value, onChange, folder, onUploadingChange }: FileFieldProps) {
  const { colors, cardBg } = useC();
  const [uploading, sUploading] = useState(false);
  const [err, sErr] = useState("");
  const [ok, sOk] = useState(false);
  const doUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    sErr(""); sOk(false);
    sUploading(true); onUploadingChange?.(true);
    const res = await uploadFile(file, folder || "general");
    sUploading(false); onUploadingChange?.(false);
    if ("url" in res) { onChange(res.url); sOk(true); setTimeout(() => sOk(false), 3000); }
    else sErr(res.error || "Error al subir archivo");
  };
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Archivo/cotización</label>
      <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
        <input value={value} onChange={e => { sErr(""); onChange(e.target.value); }} placeholder="URL o subir archivo..." style={{ flex: 1, padding: 7, borderRadius: 7, border: "1px solid " + (err ? "#DC2626" : colors.g3), fontSize: 12, boxSizing: "border-box" as const }} />
        <label style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid " + colors.g3, background: cardBg, fontSize: 11, fontWeight: 600, color: colors.nv, cursor: uploading ? "wait" : "pointer", opacity: uploading ? .5 : 1 }}>
          {uploading ? "Subiendo..." : "📎 Subir"}
          <input type="file" onChange={doUpload} style={{ display: "none" }} disabled={uploading} />
        </label>
      </div>
      {err && <div style={{ marginTop: 3, fontSize: 10, color: "#DC2626", fontWeight: 600 }}>⚠️ {err}</div>}
      {ok && !err && <div style={{ marginTop: 3, fontSize: 10, color: "#059669", fontWeight: 600 }}>✅ Archivo subido correctamente</div>}
      {value && <div style={{ marginTop: 4, fontSize: 10 }}><a href={value} target="_blank" rel="noopener noreferrer" style={{ color: colors.bl }}>{getFileIcon(value)} Ver archivo</a></div>}
    </div>
  );
}

/* ── USER PICKER (autocomplete) ── */
interface UserPickerProps {
  users: any[];
  value: string;
  onChange: (userId: string, user?: any) => void;
  placeholder?: string;
  labelFn?: (u: any) => string;
  style?: React.CSSProperties;
}
export function UserPicker({ users, value, onChange, placeholder, labelFn, style: st }: UserPickerProps) {
  const { colors, cardBg } = useC();
  const [open, sOpen] = useState(false);
  const [q, sQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const label = labelFn || ((u: any) => ((u.n || u.first_name || "") + " " + (u.a || u.last_name || "")).trim());
  const selUser = users.find((u: any) => u.id === value);
  const filtered = q
    ? users.filter((u: any) => label(u).toLowerCase().includes(q.toLowerCase()))
    : users;

  useEffect(() => {
    const h = (e: any) => { if (ref.current && !ref.current.contains(e.target)) { sOpen(false); sQ(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", ...(st || {}) }}>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid " + colors.g3, borderRadius: 8, background: cardBg, overflow: "hidden" }}>
        <input
          value={open ? q : (selUser ? label(selUser) : "")}
          onChange={e => { sQ(e.target.value); if (!open) sOpen(true); }}
          onFocus={() => { sOpen(true); sQ(""); }}
          placeholder={placeholder || "Buscar persona..."}
          style={{ flex: 1, padding: "8px 10px", border: "none", outline: "none", fontSize: 12, background: "transparent", color: colors.nv, boxSizing: "border-box" as const, minWidth: 0 }}
        />
        {value && !open && <button onClick={() => { onChange(""); sQ(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontSize: 11, color: colors.g4, flexShrink: 0 }} title="Limpiar">✕</button>}
      </div>
      {open && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: cardBg, border: "1px solid " + colors.g3, borderRadius: 8, marginTop: 2, maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,.12)" }}>
        {filtered.length === 0 && <div style={{ padding: "10px 12px", fontSize: 11, color: colors.g4 }}>Sin resultados</div>}
        {filtered.map((u: any) => (
          <div key={u.id} onClick={() => { onChange(u.id, u); sOpen(false); sQ(""); }}
            style={{ padding: "8px 12px", fontSize: 12, cursor: "pointer", color: colors.nv, borderBottom: "1px solid " + colors.g1 }}
            onMouseEnter={e => (e.currentTarget.style.background = colors.g1)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            {label(u)}
          </div>
        ))}
      </div>}
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

/* ── OFFLINE INDICATOR ── */
interface OfflineIndicatorProps {
  state: OfflineState;
  onSync?: () => void;
}
export function OfflineIndicator({ state, onSync }: OfflineIndicatorProps) {
  const { colors } = useC();
  if (state.isOnline && state.pendingCount === 0 && !state.isSyncing) return null;
  if (!state.isOnline) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "#DC262620", color: "#DC2626", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#DC2626", display: "inline-block" }} />
        Sin conexion
      </div>
    );
  }
  if (state.isSyncing) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: colors.bl + "20", color: colors.bl, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
        Sincronizando...
      </div>
    );
  }
  if (state.pendingCount > 0) {
    return (
      <button onClick={onSync} title="Sincronizar cambios pendientes" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "#F59E0B20", color: "#B45309", fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
        {state.pendingCount} pendiente{state.pendingCount > 1 ? "s" : ""}
      </button>
    );
  }
  return null;
}
