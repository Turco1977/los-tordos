"use client";
import { useState, useMemo } from "react";
import { useDataStore } from "@/lib/store";
import { fn, ROLES, SC } from "@/lib/constants";

export function useCommandPalette(
  user: any,
  isPersonal: boolean,
  isDark: boolean,
  toggleTheme: () => void,
  sVw: (v: string) => void,
  sAA: (v: number | null) => void,
  sAD: (v: number | null) => void,
  sKpiFilt: (v: string | null) => void,
  sShowPw: (v: boolean) => void,
  sSl: (v: any) => void,
  logout: () => void,
) {
  const { peds, users } = useDataStore();
  const [cmdOpen, sCmdOpen] = useState(false);

  const cmdItems = useMemo(() => {
    if (!user) return [];
    const items: any[] = [];
    const navItems = [
      { id: "nav-dash", label: isPersonal ? "Mis Tareas" : "Dashboard", icon: isPersonal ? "📋" : "📊", keywords: "d,inicio,home", action: () => { sVw(isPersonal ? "my" : "dash"); sAA(null); sAD(null); sKpiFilt(null); } },
      { id: "nav-tasks", label: "Tareas", icon: "📋", keywords: "t,tareas,tasks,lista,all", action: () => sVw("tasks") },
      { id: "nav-kanban", label: "Kanban", icon: "📊", keywords: "k,tablero,board", action: () => sVw("kanban") },
      { id: "nav-cal", label: "Calendario", icon: "📅", keywords: "c,calendar,fecha", action: () => sVw("cal") },
      { id: "nav-reun", label: "Reuniones", icon: "🤝", keywords: "r,agenda,minuta", action: () => sVw("reun") },
      { id: "nav-presu", label: "Presupuestos", icon: "💰", keywords: "p,budget,gasto", action: () => sVw("presu") },
      { id: "nav-proy", label: "Proyectos", icon: "📋", keywords: "proyecto,board", action: () => sVw("proyectos") },
      { id: "nav-org", label: "Organigrama", icon: "🏛️", keywords: "estructura,org", action: () => sVw("org") },
      { id: "nav-profs", label: "Perfiles", icon: "👤", keywords: "personas,users", action: () => sVw("profs") },
      { id: "nav-feed", label: "Actividad", icon: "📰", keywords: "feed,timeline", action: () => sVw("feed") },
      { id: "nav-recur", label: "Recurrentes", icon: "🔁", keywords: "template,automatica,repetir", action: () => sVw("recurrentes") },
      { id: "nav-plan", label: "Plan 2035", icon: "🎯", keywords: "hitos,roadmap", action: () => sVw("proy") },
      { id: "nav-inv", label: "Inventario", icon: "📦", keywords: "equipo,stock,material", action: () => sVw("inventario") },
      { id: "nav-res", label: "Espacios", icon: "🏟️", keywords: "cancha,booking,reserva,espacio", action: () => sVw("reservas") },
      { id: "nav-spon", label: "Sponsors", icon: "🥇", keywords: "sponsor,patrocinador,crm", action: () => sVw("sponsors") },
    ];
    navItems.forEach(n => items.push({ ...n, category: "nav" }));
    items.push({ id: "act-new", label: "Nueva tarea", icon: "➕", category: "action", keywords: "crear,add,agregar", action: () => sVw("new") });
    items.push({ id: "act-theme", label: isDark ? "Modo claro" : "Modo oscuro", icon: isDark ? "☀️" : "🌙", category: "action", keywords: "tema,theme,dark,light", action: toggleTheme });
    items.push({ id: "act-pw", label: "Cambiar contrasena", icon: "🔒", category: "action", keywords: "password,clave", action: () => sShowPw(true) });
    items.push({ id: "act-logout", label: "Cerrar sesion", icon: "↩", category: "action", keywords: "salir,logout", action: logout });
    peds.slice(0, 8).forEach(p => items.push({ id: "task-" + p.id, label: "#" + p.id + " " + (p.tit || p.desc?.slice(0, 40)), icon: SC[p.st]?.i || "📌", category: "task", badge: p.st, keywords: p.tipo + "," + p.cN, action: () => sSl(p) }));
    users.slice(0, 5).forEach(u => items.push({ id: "user-" + u.id, label: fn(u), icon: "👤", category: "user", keywords: u.role + "," + (ROLES[u.role]?.l || ""), action: () => { sVw("profs"); } }));
    return items;
  }, [user, isPersonal, isDark, peds, users, toggleTheme, sVw, sAA, sAD, sKpiFilt, sShowPw, sSl, logout]);

  return { cmdOpen, sCmdOpen, cmdItems };
}
