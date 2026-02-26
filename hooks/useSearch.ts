"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDataStore } from "@/lib/store";

export function useSearch() {
  const { peds, users, presu } = useDataStore();
  const [search, sSr] = useState("");
  const [gsOpen, sGsOpen] = useState(false);
  const gsRef = useRef<HTMLDivElement>(null);

  const gsResults = useCallback(() => {
    if (!search || search.length < 2) return { tasks: [], users: [], presu: [] };
    const s = search.toLowerCase();
    const tasks = peds.filter((p: any) => (p.tit + p.desc + p.cN + p.tipo + (p.id + "")).toLowerCase().includes(s)).slice(0, 5);
    const usrs = users.filter((u: any) => (u.n + " " + u.a).toLowerCase().includes(s)).slice(0, 5);
    const pres = presu.filter((pr: any) => (pr.proveedor_nombre + pr.descripcion).toLowerCase().includes(s)).slice(0, 5);
    return { tasks, users: usrs, presu: pres };
  }, [search, peds, users, presu]);

  // Close global search on outside click
  useEffect(() => {
    const h = (e: any) => {
      if (gsRef.current && !gsRef.current.contains(e.target)) sGsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return { search, sSr, gsOpen, sGsOpen, gsRef, gsResults };
}
