"use client";
import { useC } from "@/lib/theme-context";
import { ROLES, fn } from "@/lib/constants";
import { Badge, OfflineIndicator } from "@/components/ui";
import type { OfflineState } from "@/lib/use-offline";

interface AppHeaderProps {
  user: any;
  mob: boolean;
  isDark: boolean;
  nav: any[];
  vw: string;
  sVw: (v: string) => void;
  scrollTop: () => void;
  sAA: (v: number | null) => void;
  sAD: (v: number | null) => void;
  sKpiFilt: (v: string | null) => void;
  sSbOpen: (v: boolean) => void;
  search: string;
  sSr: (v: string) => void;
  gsOpen: boolean;
  sGsOpen: (v: boolean) => void;
  gsRef: React.RefObject<HTMLDivElement | null>;
  gsResults: () => { tasks: any[]; users: any[]; presu: any[] };
  sSl: (v: any) => void;
  badgeCount: number;
  shNot: boolean;
  sShNot: (v: boolean) => void;
  notifFilter: string;
  sNotifFilter: (v: string) => void;
  notifPage: number;
  sNotifPage: (v: number) => void;
  refreshNotifs: (opts?: any) => void;
  toggleTheme: () => void;
  sShowPw: (v: boolean) => void;
  logout: () => void;
  offlineState: OfflineState;
  onSync: () => void;
  headerBg: string;
}

export function AppHeader(props: AppHeaderProps) {
  const { colors, isDark, cardBg } = useC();
  const {
    user, mob, nav, vw, sVw, scrollTop,
    sAA, sAD, sKpiFilt, sSbOpen,
    search, sSr, gsOpen, sGsOpen, gsRef, gsResults, sSl,
    badgeCount, shNot, sShNot, notifFilter, sNotifFilter, notifPage, sNotifPage, refreshNotifs,
    toggleTheme, sShowPw, logout, offlineState, onSync, headerBg,
  } = props;

  return (
    <header style={{ background: headerBg, borderBottom: "1px solid " + colors.g2, padding: mob ? "0 6px" : "0 14px", display: "flex", justifyContent: "space-between", alignItems: "center", height: mob ? 52 : 48 }}>
      <div style={{ display: "flex", gap: 1, overflowX: "auto" as const, alignItems: "center" }}>
        {mob && <button aria-label="Menu" onClick={() => sSbOpen(true)} title="Abrir menu" style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: colors.nv, padding: "4px 6px", flexShrink: 0, minHeight: 44, minWidth: 44 }}>☰</button>}
        {nav.filter(n => n.sh).map(n => <button key={n.k} onClick={() => { sVw(n.k); scrollTop(); if (n.k === "dash" || n.k === "my") { sAA(null); sAD(null); sKpiFilt(null); } }} style={{ padding: mob ? "8px 10px" : "6px 11px", border: "none", borderRadius: 7, background: vw === n.k ? colors.nv : "transparent", color: vw === n.k ? (isDark ? "#0F172A" : "#fff") : colors.g5, fontSize: mob ? 12 : 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, minHeight: 44 }}>{n.l}</button>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: mob ? 6 : 10, flexShrink: 0 }}>
        <div ref={gsRef} style={{ position: "relative" as const }}><input value={search} onChange={e => { sSr(e.target.value); sGsOpen(true); }} onFocus={() => { if (search.length >= 2) sGsOpen(true); }} onKeyDown={e => { if (e.key === "Escape") sGsOpen(false); }} placeholder="Buscar..." style={{ padding: mob ? "8px 10px" : "5px 10px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: mob ? 13 : 11, width: mob ? 100 : 140, minHeight: mob ? 40 : undefined }} />
          {gsOpen && search.length >= 2 && (() => { const r = gsResults(); const hasR = r.tasks.length || r.users.length || r.presu.length; return hasR ? <div style={{ position: "absolute" as const, top: 32, right: 0, background: cardBg, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,.12)", border: "1px solid " + colors.g2, width: 280, zIndex: 100, maxHeight: 360, overflowY: "auto" as const, padding: 6 }}>
            {r.tasks.length > 0 && <div><div style={{ fontSize: 9, fontWeight: 700, color: colors.g4, padding: "4px 8px", textTransform: "uppercase" as const }}>Tareas</div>{r.tasks.map((p: any) => <div key={p.id} onClick={() => { sSl(p); sGsOpen(false); sSr(""); }} style={{ padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, color: colors.nv, fontWeight: 600 }}><span style={{ color: colors.g4 }}>#{p.id}</span> {p.tit || p.desc?.slice(0, 35)} <Badge s={p.st} sm /></div>)}</div>}
            {r.users.length > 0 && <div><div style={{ fontSize: 9, fontWeight: 700, color: colors.g4, padding: "4px 8px", textTransform: "uppercase" as const }}>Personas</div>{r.users.map((u: any) => <div key={u.id} onClick={() => { sVw("profs"); sGsOpen(false); sSr(""); }} style={{ padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, color: colors.nv }}>👤 {fn(u)} <span style={{ color: colors.g4, fontSize: 9 }}>{ROLES[u.role]?.l}</span></div>)}</div>}
            {r.presu.length > 0 && <div><div style={{ fontSize: 9, fontWeight: 700, color: colors.g4, padding: "4px 8px", textTransform: "uppercase" as const }}>Presupuestos</div>{r.presu.map((pr: any) => <div key={pr.id} onClick={() => { sVw("presu"); sGsOpen(false); sSr(""); }} style={{ padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, color: colors.nv }}>💰 {pr.proveedor_nombre} <span style={{ color: colors.g4, fontSize: 9 }}>${Number(pr.monto).toLocaleString()}</span></div>)}</div>}
          </div> : <div style={{ position: "absolute" as const, top: 32, right: 0, background: cardBg, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,.12)", border: "1px solid " + colors.g2, width: 280, zIndex: 100, padding: "16px 12px", textAlign: "center" as const }}><div style={{ fontSize: 11, color: colors.g4 }}>Sin resultados para &ldquo;{search}&rdquo;</div></div>; })()}
        </div>
        <OfflineIndicator state={offlineState} onSync={onSync} />
        <button aria-label="Notificaciones" onClick={() => { sShNot(!shNot); if (!shNot) { sNotifFilter("all"); sNotifPage(0); refreshNotifs(); } }} title="Notificaciones" style={{ background: "none", border: "none", fontSize: mob ? 18 : 16, cursor: "pointer", position: "relative" as const, minWidth: mob ? 40 : undefined, minHeight: mob ? 40 : undefined, display: "flex", alignItems: "center", justifyContent: "center" }}>🔔{badgeCount > 0 && <span style={{ position: "absolute" as const, top: -4, right: -4, minWidth: 14, height: 14, borderRadius: 7, background: colors.rd, color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>{badgeCount > 99 ? "99+" : badgeCount}</span>}</button>
        {!mob && <div style={{ textAlign: "right" as const }}><div style={{ fontSize: 11, fontWeight: 700, color: colors.nv }}>{fn(user)}</div><div style={{ fontSize: 9, color: colors.g4 }}>{ROLES[user.role]?.i} {ROLES[user.role]?.l}{user.div ? " · " + user.div : ""}</div></div>}
        <button aria-label="Cambiar tema" onClick={toggleTheme} title={isDark ? "Modo claro" : "Modo oscuro"} style={{ width: mob ? 40 : 28, height: mob ? 40 : 28, borderRadius: 7, border: "1px solid " + colors.g2, background: cardBg, cursor: "pointer", fontSize: mob ? 14 : 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{isDark ? "☀️" : "🌙"}</button>
        <button aria-label="Cambiar contrasena" onClick={() => sShowPw(true)} title="Cambiar contrasena" style={{ width: mob ? 40 : 28, height: mob ? 40 : 28, borderRadius: 7, border: "1px solid " + colors.g2, background: cardBg, cursor: "pointer", fontSize: mob ? 14 : 12, display: "flex", alignItems: "center", justifyContent: "center" }}>🔒</button>
        <button aria-label="Cerrar sesion" onClick={logout} title="Cerrar sesion" style={{ width: mob ? 40 : 28, height: mob ? 40 : 28, borderRadius: 7, border: "1px solid " + colors.g2, background: cardBg, cursor: "pointer", fontSize: mob ? 14 : 12, display: "flex", alignItems: "center", justifyContent: "center" }}>↩</button>
      </div>
    </header>
  );
}
