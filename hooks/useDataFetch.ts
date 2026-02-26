"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDataStore } from "@/lib/store";
import { profileToUser, taskFromDB, presuFromDB, provFromDB } from "@/lib/mappers";

const supabase = createClient();

export function useDataFetch(
  user: any,
  showT: (msg: string, type?: "ok" | "err") => void,
  saveToCache: (data: Record<string, any[]>) => void,
  loadFromCache: (handlers: Record<string, (d: any[]) => void>) => Promise<void>,
  cacheLoaded: boolean,
) {
  const {
    setAll, sUs, sOm, sPd, sHi, sAgs, sMins, sPr, sPv, sRems,
    sProjects, sProjTasks, sTaskTemplates, sProjBudgets,
    sInventory, sInvMaint, sInvDist, sBookings, sSponsors,
    sSponDeliveries, sNotifPrefs,
  } = useDataStore();

  const [dataLoading, sDataLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    // Phase 1: Load 50 most recent tasks + user's assigned tasks immediately, plus core data
    const [pRes, recentRes, userRes, omRes, msRes, agRes, miRes, prRes, pvRes, remRes, projRes, ptRes, ttRes, invRes, bkRes, spRes, pbRes, imRes, idRes, sdRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("tasks").select("*").order("id", { ascending: false }).limit(50),
      user ? supabase.from("tasks").select("*").eq("assigned_to", user.id).order("id", { ascending: false }) : Promise.resolve({ data: [] }),
      supabase.from("org_members").select("*"),
      supabase.from("milestones").select("*").order("id"),
      supabase.from("agendas").select("*").order("id", { ascending: false }).limit(100),
      supabase.from("minutas").select("*").order("id", { ascending: false }).limit(100),
      supabase.from("presupuestos").select("*").order("id", { ascending: false }).limit(200),
      supabase.from("proveedores").select("*").order("id", { ascending: false }).limit(200),
      supabase.from("reminders").select("*").order("date", { ascending: true }),
      supabase.from("projects").select("*").order("id", { ascending: false }),
      supabase.from("project_tasks").select("*").order("id", { ascending: false }),
      supabase.from("task_templates").select("*").order("id", { ascending: false }),
      supabase.from("inventory").select("*").order("id", { ascending: false }),
      supabase.from("bookings").select("*").order("id", { ascending: false }),
      supabase.from("sponsors").select("*").order("id", { ascending: false }),
      supabase.from("project_budgets").select("*").order("id", { ascending: false }),
      supabase.from("inventory_maintenance").select("*").order("id", { ascending: false }),
      supabase.from("inventory_distributions").select("*").order("id", { ascending: false }),
      supabase.from("sponsor_deliveries").select("*").order("id", { ascending: false }),
    ]);
    const errors: string[] = [];
    if (pRes.error) errors.push("Perfiles: " + pRes.error.message);
    if (recentRes.error) errors.push("Tareas: " + recentRes.error.message);
    if (omRes.error) errors.push("Organigrama: " + omRes.error.message);
    if (prRes.error) errors.push("Presupuestos: " + prRes.error.message);
    if (errors.length) showT(errors.join("; "), "err");

    // Merge recent + user-assigned tasks without duplicates
    const seen = new Set<number>();
    const phase1Tasks: any[] = [];
    for (const t of [...(recentRes.data || []), ...(userRes.data || [])]) {
      if (!seen.has(t.id)) { seen.add(t.id); phase1Tasks.push(t); }
    }

    let tmData: any[] = [];
    let mappedPeds: any[] | undefined;
    if (phase1Tasks.length) {
      const tmRes = await supabase.from("task_messages").select("*").order("created_at");
      const msgs: any[] = tmRes.data || [];
      tmData = msgs;
      mappedPeds = phase1Tasks.map((t: any) => taskFromDB(t, msgs.filter((m: any) => m.task_id === t.id)));
    }
    const smRes = await supabase.from("sponsor_messages").select("*").order("created_at");

    setAll({
      ...(pRes.data ? { users: pRes.data.map((p: any) => profileToUser(p)) } : {}),
      ...(omRes.data ? { om: omRes.data.map((m: any) => ({ id: m.id, t: m.type, cargo: m.cargo, n: m.first_name, a: m.last_name, mail: m.email, tel: m.phone, so: m.sort_order || 0 })) } : {}),
      ...(msRes.data ? { hitos: msRes.data.map((h: any) => ({ id: h.id, fase: h.phase, name: h.name, periodo: h.period, pct: h.pct, color: h.color })) } : {}),
      ...(agRes.data ? { agendas: agRes.data.map((a: any) => ({ id: a.id, type: a.type, areaName: a.area_name, date: a.date, sections: a.sections, presentes: a.presentes || [], status: a.status, createdAt: a.created_at })) } : {}),
      ...(miRes.data ? { minutas: miRes.data.map((m: any) => ({ id: m.id, type: m.type, areaName: m.area_name, agendaId: m.agenda_id, date: m.date, horaInicio: m.hora_inicio, horaCierre: m.hora_cierre, lugar: m.lugar, presentes: m.presentes, ausentes: m.ausentes, sections: m.sections, tareas: m.tareas, status: m.status, createdAt: m.created_at })) } : {}),
      ...(prRes.data ? { presu: prRes.data.map(presuFromDB) } : {}),
      ...(pvRes.data ? { provs: pvRes.data.map(provFromDB) } : {}),
      ...(remRes.data ? { reminders: remRes.data } : {}),
      ...(projRes.data ? { projects: projRes.data } : {}),
      ...(ptRes.data ? { projTasks: ptRes.data } : {}),
      ...(ttRes.data ? { taskTemplates: ttRes.data } : {}),
      ...(invRes.data ? { inventory: invRes.data } : {}),
      ...(imRes.data ? { invMaint: imRes.data } : {}),
      ...(idRes.data ? { invDist: idRes.data } : {}),
      ...(bkRes.data ? { bookings: bkRes.data } : {}),
      ...(spRes.data ? { sponsors: spRes.data } : {}),
      ...(smRes.data ? { sponMsgs: smRes.data } : {}),
      ...(sdRes.data ? { sponDeliveries: sdRes.data } : {}),
      ...(pbRes.data ? { projBudgets: pbRes.data } : {}),
      ...(mappedPeds ? { peds: mappedPeds } : {}),
    });

    const { data: { user: authU } } = await supabase.auth.getUser();
    if (authU) {
      const { data: npData } = await supabase.from("notification_preferences").select("*").eq("user_id", authU.id).maybeSingle();
      if (npData) sNotifPrefs(() => npData);
    }
    sDataLoading(false);

    // Phase 2: Load remaining tasks in background (after 2s delay)
    if (phase1Tasks.length >= 50) {
      setTimeout(async () => {
        try {
          const { data: allTasks } = await supabase.from("tasks").select("*").order("id", { ascending: false }).limit(500);
          if (allTasks && allTasks.length > phase1Tasks.length) {
            const newTasks: any[] = [];
            for (const t of allTasks) {
              if (!seen.has(t.id)) { seen.add(t.id); newTasks.push(t); }
            }
            if (newTasks.length > 0) {
              const mapped = newTasks.map((t: any) => taskFromDB(t, tmData.filter((m: any) => m.task_id === t.id)));
              sPd(prev => [...prev, ...mapped]);
            }
          }
        } catch { /* background load — best effort */ }
      }, 2000);
    }

    const anyData = pRes.data || recentRes.data || omRes.data;
    if (anyData) {
      saveToCache({
        profiles: pRes.data || [], tasks: phase1Tasks, task_messages: tmData,
        org_members: omRes.data || [], milestones: msRes.data || [],
        agendas: agRes.data || [], minutas: miRes.data || [],
        presupuestos: prRes.data || [], proveedores: pvRes.data || [],
        reminders: remRes.data || [], projects: projRes.data || [],
        project_tasks: ptRes.data || [], task_templates: ttRes.data || [],
        inventory: invRes.data || [], inventory_maintenance: imRes.data || [], inventory_distributions: idRes.data || [], bookings: bkRes.data || [],
        sponsors: spRes.data || [], sponsor_deliveries: sdRes.data || [], project_budgets: pbRes.data || [],
      });
    }
  }, [user, saveToCache, setAll, sPd, sNotifPrefs, showT, sDataLoading]);

  // Load cached data from IndexedDB
  useEffect(() => {
    if (!user || cacheLoaded) return;
    loadFromCache({
      profiles: (d: any[]) => sUs(() => d.map((p: any) => profileToUser(p))),
      tasks: () => { /* handled with task_messages below */ },
      org_members: (d: any[]) => sOm(() => d.map((m: any) => ({ id: m.id, t: m.type, cargo: m.cargo, n: m.first_name, a: m.last_name, mail: m.email, tel: m.phone, so: m.sort_order || 0 }))),
      milestones: (d: any[]) => sHi(() => d.map((h: any) => ({ id: h.id, fase: h.phase, name: h.name, periodo: h.period, pct: h.pct, color: h.color }))),
      agendas: (d: any[]) => sAgs(() => d.map((a: any) => ({ id: a.id, type: a.type, areaName: a.area_name, date: a.date, sections: a.sections, presentes: a.presentes || [], status: a.status, createdAt: a.created_at }))),
      minutas: (d: any[]) => sMins(() => d.map((m: any) => ({ id: m.id, type: m.type, areaName: m.area_name, agendaId: m.agenda_id, date: m.date, horaInicio: m.hora_inicio, horaCierre: m.hora_cierre, lugar: m.lugar, presentes: m.presentes, ausentes: m.ausentes, sections: m.sections, tareas: m.tareas, status: m.status, createdAt: m.created_at }))),
      presupuestos: (d: any[]) => sPr(() => d.map(presuFromDB)),
      proveedores: (d: any[]) => sPv(() => d.map(provFromDB)),
      reminders: (d: any[]) => sRems(() => d),
      projects: (d: any[]) => sProjects(() => d),
      project_tasks: (d: any[]) => sProjTasks(() => d),
      task_templates: (d: any[]) => sTaskTemplates(() => d),
      inventory: (d: any[]) => sInventory(() => d),
      inventory_maintenance: (d: any[]) => sInvMaint(() => d),
      inventory_distributions: (d: any[]) => sInvDist(() => d),
      bookings: (d: any[]) => sBookings(() => d),
      sponsors: (d: any[]) => sSponsors(() => d),
      sponsor_deliveries: (d: any[]) => sSponDeliveries(() => d),
      project_budgets: (d: any[]) => sProjBudgets(() => d),
    }).then(async () => {
      try {
        const { getAll } = await import("@/lib/offline-store");
        const [cachedTasks, cachedMsgs] = await Promise.all([getAll("tasks"), getAll("task_messages")]);
        if (cachedTasks.length) {
          sPd(() => cachedTasks.map((t: any) => taskFromDB(t, (cachedMsgs || []).filter((m: any) => m.task_id === t.id))));
          sDataLoading(false);
        }
      } catch {}
    });
  }, [user, cacheLoaded, loadFromCache, sUs, sOm, sPd, sHi, sAgs, sMins, sPr, sPv, sRems, sProjects, sProjTasks, sTaskTemplates, sInventory, sInvMaint, sInvDist, sBookings, sSponsors, sSponDeliveries, sProjBudgets]);

  // Fetch data when user logs in
  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  return { dataLoading, fetchAll };
}
