"use client";
import { useState, useCallback, useRef } from "react";
import { AREAS, DEPTOS, T } from "@/lib/constants";

export function useViews(isPersonal: boolean) {
  const [vw, sVw_] = useState("dash");
  const [prevVw, sPrevVw] = useState<string | null>(null);
  const sVw = useCallback((v: string) => { sPrevVw(vw); sVw_(v); }, [vw]);
  const [sel, sSl] = useState<any>(null);
  const [aA, sAA] = useState<number | null>(null);
  const [aD, sAD] = useState<number | null>(null);
  const [sbCol, sSbCol] = useState(false);
  const [sbOpen, sSbOpen] = useState(false);
  const [kpiFilt, sKpiFilt] = useState<string | null>(null);
  const [preAT, sPreAT] = useState<any>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const scrollTop = useCallback(() => mainRef.current?.scrollTo({ top: 0 }), []);

  const hAC = useCallback((id: number) => {
    sAA(prev => prev === id ? null : id);
    sAD(null);
    sKpiFilt(null);
    sVw_("dash");
    mainRef.current?.scrollTo({ top: 0 });
  }, []);

  const hDC = useCallback((id: number) => {
    sAD(prev => prev === id ? null : id);
    mainRef.current?.scrollTo({ top: 0 });
  }, []);

  // Computed view data
  const areas = AREAS;
  const deptos = DEPTOS;

  const computeViewFilter = useCallback((peds: any[]) => {
    let vT = "", vI = "", vC = T.nv, vP = peds;
    if (aD) {
      const dd = deptos.find((x: any) => x.id === aD);
      const aar = dd ? areas.find((x: any) => x.id === dd.aId) : null;
      vT = dd ? dd.name : "";
      vI = "📂";
      vC = aar ? aar.color : T.nv;
      const chIds = deptos.filter((d: any) => d.pId === aD).map((d: any) => d.id);
      const allIds = [aD, ...chIds];
      const inclEmb = allIds.indexOf(7) >= 0;
      vP = peds.filter((p: any) => allIds.indexOf(p.dId) >= 0 || (inclEmb && p.st === "emb"));
    } else if (aA) {
      const aar2 = areas.find((x: any) => x.id === aA);
      const ids2 = deptos.filter((d: any) => d.aId === aA).map((d: any) => d.id);
      vT = aar2 ? aar2.name : "";
      vI = aar2 ? aar2.icon : "";
      vC = aar2 ? aar2.color : T.nv;
      vP = peds.filter((p: any) => ids2.indexOf(p.dId) >= 0);
    }
    return { vT, vI, vC, vP };
  }, [aA, aD, areas, deptos]);

  const computeNav = useCallback(() => {
    if (isPersonal) {
      return [{ k: "my", l: "Mis Tareas", sh: true }, { k: "cal", l: "📅 Calendario", sh: true }, { k: "new", l: "+ Tarea", sh: true }];
    }
    return [{ k: "dash", l: "Dashboard", sh: true }, { k: "tasks", l: "📋 Tareas", sh: true }, { k: "kanban", l: "📊 Kanban", sh: true }, { k: "feed", l: "📰 Actividad", sh: true }, { k: "cal", l: "📅 Calendario", sh: true }, { k: "new", l: "+ Tarea", sh: true }];
  }, [isPersonal]);

  return {
    vw, sVw, prevVw,
    sel, sSl,
    aA, sAA, aD, sAD,
    sbCol, sSbCol,
    sbOpen, sSbOpen,
    kpiFilt, sKpiFilt,
    preAT, sPreAT,
    mainRef, scrollTop,
    hAC, hDC,
    computeViewFilter, computeNav,
    areas, deptos,
  };
}
