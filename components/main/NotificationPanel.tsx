"use client";
import { useC } from "@/lib/theme-context";
import { markRead } from "@/lib/notifications";
import { NotifPrefs } from "@/components/main/NotifPrefs";

interface NotificationPanelProps {
  user: any;
  mob: boolean;
  shNot: boolean;
  sShNot: (v: boolean) => void;
  shNotifPrefs: boolean;
  sShNotifPrefs: (fn: (v: boolean) => boolean) => void;
  computedNts: any[];
  dbNotifs: any[];
  ntGrouped: [string, any[]][];
  ntColor: (type: string) => string;
  unreadDb: any[];
  badgeCount: number;
  notifFilter: string;
  sNotifFilter: (v: string) => void;
  notifPage: number;
  sNotifPage: (v: number) => void;
  notifTotal: number;
  NOTIF_LIMIT: number;
  refreshNotifs: (opts?: { filter?: string; offset?: number; append?: boolean }) => void;
  pushEnabled: boolean;
  requestPush: () => void;
  getToken: () => Promise<string>;
  sDbNotifs: (fn: (prev: any[]) => any[]) => void;
  sVw: (v: string) => void;
  sSl: (v: any) => void;
  sAA: (v: number | null) => void;
  sAD: (v: number | null) => void;
}

export function NotificationPanel(props: NotificationPanelProps) {
  const { colors, cardBg } = useC();
  const {
    user, mob, shNot, sShNot, shNotifPrefs, sShNotifPrefs,
    computedNts, dbNotifs, ntGrouped, ntColor, unreadDb,
    notifFilter, sNotifFilter, notifPage, sNotifPage, notifTotal, NOTIF_LIMIT,
    refreshNotifs, pushEnabled, requestPush, getToken, sDbNotifs,
    sVw, sSl, sAA, sAD,
  } = props;

  if (!shNot) return null;

  return (
    <>
      <div onClick={() => sShNot(false)} style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,.3)", zIndex: 200 }} />
      <div style={{ position: "fixed" as const, top: 0, right: 0, bottom: 0, width: mob ? "100%" : 360, background: cardBg, zIndex: 201, boxShadow: "-4px 0 24px rgba(0,0,0,.12)", display: "flex", flexDirection: "column" as const, borderLeft: "1px solid " + colors.g2 }}>
        {/* Header */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid " + colors.g2, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: colors.nv }}>Notificaciones</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => sShNotifPrefs(p => !p)} title="Preferencias" style={{ background: shNotifPrefs ? colors.bl + "15" : "none", border: "none", fontSize: 16, cursor: "pointer", color: shNotifPrefs ? colors.bl : colors.g4, padding: 4, minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>⚙️</button>
            <button onClick={() => sShNot(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: colors.g4, padding: 4, minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        {/* Filters */}
        <div style={{ padding: "8px 16px", borderBottom: "1px solid " + colors.g2, display: "flex", gap: 4, flexWrap: "wrap" as const, flexShrink: 0 }}>
          {[{ k: "all", l: "Todas" }, { k: "unread", l: "No leidas" }, { k: "task", l: "Tareas" }, { k: "budget", l: "Compras" }, { k: "deadline", l: "Vencimientos" }].map(f =>
            <button key={f.k} onClick={() => { sNotifFilter(f.k); sNotifPage(0); refreshNotifs({ filter: f.k, offset: 0 }); }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid " + (notifFilter === f.k ? colors.bl : colors.g3), background: notifFilter === f.k ? colors.bl + "15" : "transparent", color: notifFilter === f.k ? colors.bl : colors.g5, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{f.l}</button>
          )}
        </div>
        {shNotifPrefs && <div style={{ padding: "0 16px", overflowY: "auto" as const, flexShrink: 0 }}><NotifPrefs user={user} mob={mob} /></div>}
        {/* Computed notifications (real-time) */}
        {computedNts.length > 0 && <div style={{ padding: "8px 16px", borderBottom: "1px solid " + colors.g2, flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: colors.g4, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 }}>En tiempo real</div>
          {computedNts.map((n: any, i: number) => <div key={"c" + i} onClick={() => { sShNot(false); if (n.first) sSl(n.first); else if (n.act) { sVw(n.act); sAA(null); sAD(null); } }} style={{ padding: "8px 10px", borderRadius: 8, background: n.c + "10", marginBottom: 3, fontSize: 11, color: n.c, fontWeight: 600, cursor: "pointer", borderLeft: "3px solid " + n.c }}>{n.t}</div>)}
        </div>}
        {/* DB notifications grouped by date */}
        <div style={{ flex: 1, overflowY: "auto" as const, padding: "8px 16px" }}>
          {dbNotifs.length === 0 && <div style={{ textAlign: "center" as const, padding: 24, color: colors.g4, fontSize: 11 }}>Sin notificaciones{notifFilter !== "all" ? " con este filtro" : ""}</div>}
          {ntGrouped.map(([dateKey, items]) => (
            <div key={dateKey} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: colors.g4, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4, padding: "0 2px" }}>{dateKey}</div>
              {items.map((n: any) => { const c = ntColor(n.type); const unread = !n.read; return (
                <div key={n.id} onClick={() => { if (unread) { getToken().then(tok => markRead(tok, [n.id])); sDbNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); } sShNot(false); if (n.link) { window.location.hash = n.link; } else { sVw("dash"); sAA(null); sAD(null); } }} style={{ padding: "8px 10px", borderRadius: 8, background: unread ? c + "10" : "transparent", marginBottom: 3, cursor: "pointer", borderLeft: unread ? "3px solid " + c : "3px solid transparent", transition: "background .15s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: unread ? 700 : 500, color: unread ? colors.nv : colors.g5 }}>{n.title}</div>
                      {n.message && <div style={{ fontSize: 10, color: colors.g4, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{n.message}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      {unread && <span style={{ width: 6, height: 6, borderRadius: 3, background: c, flexShrink: 0 }} />}
                      <span style={{ fontSize: 9, color: colors.g4, whiteSpace: "nowrap" as const }}>{n.created_at ? n.created_at.slice(11, 16) : ""}</span>
                    </div>
                  </div>
                </div>
              ); })}
            </div>
          ))}
          {/* Load more */}
          {dbNotifs.length < notifTotal && <div style={{ textAlign: "center", padding: "8px 0" }}>
            <button onClick={() => { const next = notifPage + 1; sNotifPage(next); refreshNotifs({ filter: notifFilter, offset: next * NOTIF_LIMIT, append: true }); }} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid " + colors.g3, background: "transparent", color: colors.bl, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Cargar mas ({notifTotal - dbNotifs.length} restantes)</button>
          </div>}
        </div>
        {/* Footer actions */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid " + colors.g2, display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" as const }}>
          {unreadDb.length > 0 && <button onClick={async () => { const tok = await getToken(); await markRead(tok); sDbNotifs(prev => prev.map((n: any) => ({ ...n, read: true }))); }} style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid " + colors.g3, background: "transparent", color: colors.bl, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Marcar todas como leidas</button>}
          {!pushEnabled && "Notification" in (typeof window !== "undefined" ? window : {}) && <button onClick={requestPush} style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid " + colors.bl, background: "transparent", color: colors.bl, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Activar push</button>}
        </div>
      </div>
    </>
  );
}
