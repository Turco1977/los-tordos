"use client";
import { useEffect } from "react";

interface UseKeyboardOpts {
  user: any;
  cmdOpen: boolean;
  sel: any;
  showPw: boolean;
  isPersonal: boolean;
  sVw: (v: string) => void;
  sCmdOpen: (fn: (o: boolean) => boolean) => void;
  sAA: (v: number | null) => void;
  sAD: (v: number | null) => void;
  sKpiFilt: (v: string | null) => void;
}

export function useKeyboard(opts: UseKeyboardOpts) {
  const { user, cmdOpen, sel, showPw, isPersonal, sVw, sCmdOpen, sAA, sAD, sKpiFilt } = opts;

  useEffect(() => {
    if (!user) return;
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); sCmdOpen(o => !o); return; }
      if (inInput || cmdOpen || sel || showPw) return;
      if (e.key === "t" || e.key === "T") { e.preventDefault(); sVw("tasks"); }
      else if (e.key === "n" || e.key === "N") { e.preventDefault(); sVw("new"); }
      else if (e.key === "d" || e.key === "D") { e.preventDefault(); sVw(isPersonal ? "my" : "dash"); sAA(null); sAD(null); sKpiFilt(null); }
      else if (e.key === "k" || e.key === "K") { e.preventDefault(); sVw("kanban"); }
      else if (e.key === "c" || e.key === "C") { e.preventDefault(); sVw("cal"); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); sVw("reun"); }
      else if (e.key === "p" || e.key === "P") { e.preventDefault(); sVw("presu"); }
      else if (e.key === "/") { e.preventDefault(); sCmdOpen(() => true); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [user, cmdOpen, sel, showPw, isPersonal, sVw, sCmdOpen, sAA, sAD, sKpiFilt]);
}
