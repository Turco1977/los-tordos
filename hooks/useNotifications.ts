"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify, fetchNotifications, markRead } from "@/lib/notifications";
import { useDataStore } from "@/lib/store";
import { T, ST, isOD, daysDiff, fn, ROLES } from "@/lib/constants";

const supabase = createClient();
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64); const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

async function subscribePush(reg: ServiceWorkerRegistration, token: string) {
  try {
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) });
    await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ subscription: sub.toJSON() }) });
    return true;
  } catch { return false; }
}

/* Computed notification alerts */
function computeNotifs(user: any, peds: any[]) {
  const n: any[] = [];
  if (["coordinador", "admin", "superadmin"].indexOf(user.role) >= 0) {
    const pp = peds.filter((p: any) => p.st === ST.P);
    if (pp.length) n.push({ t: "🔴 " + pp.length + " pendientes", c: T.rd, act: "dash", filter: ST.P });
  }
  if (user.role === "embudo") {
    const ee = peds.filter((p: any) => p.st === ST.E);
    if (ee.length) n.push({ t: "💰 " + ee.length + " esperando aprobación", c: T.pr, act: "dash", filter: ST.E });
  }
  const myV = peds.filter((p: any) => p.st === ST.V && p.cId === user.id);
  if (myV.length) n.push({ t: "🔵 " + myV.length + " esperando validación", c: T.bl, act: "my", filter: ST.V, first: myV[0] });
  const od = peds.filter((p: any) => p.st !== ST.OK && isOD(p.fReq));
  if (od.length) n.push({ t: "⏰ " + od.length + " vencidas", c: "#DC2626", act: "dash", filter: "overdue", first: od[0] });
  const TODAY = new Date().toISOString().slice(0, 10);
  if (["coordinador", "admin", "superadmin"].indexOf(user.role) >= 0) {
    const stuck = peds.filter((p: any) => p.st !== ST.OK && p.st !== ST.P && p.cAt && daysDiff(p.cAt, TODAY) > 7 && !isOD(p.fReq));
    if (stuck.length) n.push({ t: "🚨 " + stuck.length + " tareas sin avance (+7d)", c: "#7C3AED", act: "dash", first: stuck[0] });
  }
  return n;
}

export function useNotifications(user: any, getToken: () => Promise<string>) {
  const { peds, dbNotifs, sDbNotifs } = useDataStore();
  const [pushEnabled, sPushEnabled] = useState(false);
  const [shNot, sShNot] = useState(false);
  const [notifTotal, sNotifTotal] = useState(0);
  const [notifFilter, sNotifFilter] = useState<string>("all");
  const [notifPage, sNotifPage] = useState(0);
  const [shNotifPrefs, sShNotifPrefs] = useState(false);
  const NOTIF_LIMIT = 30;

  // Push notification init
  useEffect(() => {
    if (!user || !("Notification" in window) || !("serviceWorker" in navigator) || !VAPID_KEY) return;
    const init = async () => {
      const perm = Notification.permission;
      if (perm === "denied") return;
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) { sPushEnabled(true); return; }
      if (perm === "granted") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const ok = await subscribePush(reg, session.access_token);
          sPushEnabled(ok);
        }
      }
    };
    init();
  }, [user]);

  const requestPush = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !VAPID_KEY) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const ok = await subscribePush(reg, session.access_token);
      sPushEnabled(ok);
    }
  }, []);

  const sendPush = useCallback((title: string, body: string, icon?: string) => {
    if (pushEnabled && document.hidden) {
      try { new Notification(title, { body, icon: icon || "/logo.jpg", badge: "/logo.jpg" }); } catch {}
    }
  }, [pushEnabled]);

  // Check for overdue tasks every 5 minutes
  useEffect(() => {
    if (!pushEnabled || !user || !peds.length) return;
    const check = () => {
      const od = peds.filter((p: any) => p.st !== ST.OK && isOD(p.fReq) && (p.asTo === user.id || p.cId === user.id));
      if (od.length > 0) sendPush("⏰ Tareas vencidas", "Tenés " + od.length + " tarea(s) vencida(s)");
    };
    const iv = setInterval(check, 300000);
    return () => clearInterval(iv);
  }, [pushEnabled, user, peds, sendPush]);

  // Fetch persistent notifications
  const refreshNotifs = useCallback(async (opts?: { filter?: string; offset?: number; append?: boolean }) => {
    const tok = await getToken();
    if (!tok) return;
    const f = opts?.filter || "all";
    const offset = opts?.offset || 0;
    const typeParam = f === "task" || f === "budget" || f === "deadline" ? f : "";
    const readParam = f === "unread" ? false : null;
    const { notifications: n, total } = await fetchNotifications(tok, { limit: NOTIF_LIMIT, offset, type: typeParam, read: readParam });
    if (opts?.append) sDbNotifs(prev => [...prev, ...n]);
    else sDbNotifs(() => n);
    sNotifTotal(total);
  }, [getToken, sDbNotifs]);

  // Auto-refresh notifications
  useEffect(() => {
    if (user) {
      refreshNotifs();
      const iv = setInterval(() => refreshNotifs(), 60000);
      return () => clearInterval(iv);
    }
  }, [user, refreshNotifs]);

  // Send notification helper
  const sendNotif = useCallback(async (userId: string, title: string, message: string, type: "task" | "budget" | "deadline" | "injury" | "info" = "task", link = "", sendEmail = false) => {
    const tok = await getToken();
    if (tok) await notify({ token: tok, user_id: userId, title, message, type, link, send_email: sendEmail });
  }, [getToken]);

  // Periodic deadline & overdue notifications
  useEffect(() => {
    if (!user || !peds.length) return;
    const check = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const key = "notif-dl-" + today;
      let sent: string[];
      try { sent = JSON.parse(localStorage.getItem(key) || "[]"); } catch { sent = []; }
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const toSend: Array<{ uid: string; title: string; msg: string; tag: string }> = [];
      peds.forEach((p: any) => {
        if (p.st === ST.OK) return;
        if (p.fReq && isOD(p.fReq)) {
          if (p.asTo && !sent.includes("od-" + p.id + "-" + p.asTo)) toSend.push({ uid: p.asTo, title: "Tarea vencida #" + p.id, msg: (p.tit || p.desc || "").slice(0, 60), tag: "od-" + p.id + "-" + p.asTo });
          if (p.cId && p.cId !== p.asTo && !sent.includes("od-" + p.id + "-" + p.cId)) toSend.push({ uid: p.cId, title: "Tarea vencida #" + p.id, msg: (p.tit || p.desc || "").slice(0, 60), tag: "od-" + p.id + "-" + p.cId });
        }
        if (p.fReq && p.fReq === tomorrow) {
          if (p.asTo && !sent.includes("dl-" + p.id + "-" + p.asTo)) toSend.push({ uid: p.asTo, title: "Tarea vence mañana #" + p.id, msg: (p.tit || p.desc || "").slice(0, 60), tag: "dl-" + p.id + "-" + p.asTo });
          if (p.cId && p.cId !== p.asTo && !sent.includes("dl-" + p.id + "-" + p.cId)) toSend.push({ uid: p.cId, title: "Tarea vence mañana #" + p.id, msg: (p.tit || p.desc || "").slice(0, 60), tag: "dl-" + p.id + "-" + p.cId });
        }
      });
      if (!toSend.length) return;
      const newSent = [...sent];
      for (const s of toSend.slice(0, 20)) { await sendNotif(s.uid, s.title, s.msg, "deadline"); newSent.push(s.tag); }
      try { localStorage.setItem(key, JSON.stringify(newSent)); } catch {}
    };
    const t = setTimeout(check, 5000);
    const iv = setInterval(check, 300000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [user, peds, sendNotif]);

  // Computed notifications
  const computedNts = user ? computeNotifs(user, peds) : [];
  const unreadDb = dbNotifs.filter((n: any) => !n.read);
  const badgeCount = computedNts.length + unreadDb.length;
  const ntColor = (type: string) => type === "task" ? T.bl : type === "budget" ? T.pr : type === "deadline" ? T.rd : T.gn;

  // Group dbNotifs by date
  const ntDateLabel = (dt: string) => {
    if (!dt) return "Sin fecha";
    const d = dt.slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const yd = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (d === today) return "Hoy"; if (d === yd) return "Ayer";
    const p = d.split("-"); return p[2] + "/" + p[1] + "/" + p[0];
  };
  const ntGrouped = useMemo(() => {
    const map = new Map<string, any[]>();
    dbNotifs.forEach((n: any) => { const key = ntDateLabel(n.created_at); if (!map.has(key)) map.set(key, []); map.get(key)!.push(n); });
    return Array.from(map.entries());
  }, [dbNotifs]);

  return {
    pushEnabled, requestPush, sendPush,
    shNot, sShNot,
    notifTotal, notifFilter, sNotifFilter,
    notifPage, sNotifPage,
    shNotifPrefs, sShNotifPrefs,
    NOTIF_LIMIT,
    refreshNotifs, sendNotif,
    computedNts, unreadDb, badgeCount, ntColor, ntGrouped,
  };
}
