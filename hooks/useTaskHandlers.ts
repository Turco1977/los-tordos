"use client";
import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDataStore } from "@/lib/store";
import { fn } from "@/lib/constants";
import { ST, SC } from "@/lib/constants";

const supabase = createClient();
const TODAY = new Date().toISOString().slice(0, 10);

const sanitize = (s: string) => s.replace(/<\/?[^>]+(>|$)/g, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "").trim();

export function useTaskHandlers(
  user: any,
  showT: (msg: string, type?: "ok" | "err") => void,
  sendNotif: (userId: string, title: string, message: string, type?: "task" | "budget" | "deadline" | "injury" | "info", link?: string, sendEmail?: boolean) => Promise<void>,
) {
  const { peds, users, sPd } = useDataStore();

  const addLog = useCallback(async (id: number, uid: string, by: string, act: string, t?: string) => {
    const ts = TODAY + " " + new Date().toTimeString().slice(0, 5);
    const tp = t || "sys";
    sPd(p => p.map(x => x.id === id ? { ...x, log: [...(x.log || []), { dt: ts, uid, by, act, t: tp }] } : x));
    await supabase.from("task_messages").insert({ task_id: id, user_id: uid, user_name: by, content: act, type: tp });
  }, [sPd]);

  const handleBulk = useCallback(async (ids: number[], action: string, value: string) => {
    try {
      if (action === "status") {
        sPd(p => p.map(x => ids.includes(x.id) ? { ...x, st: value } : x));
        for (const id of ids) {
          await supabase.from("tasks").update({ status: value }).eq("id", id);
          await addLog(id, user.id, fn(user), "Cambió estado a " + SC[value]?.l, "sys");
        }
        showT(ids.length + " tareas actualizadas");
      } else if (action === "assign") {
        sPd(p => p.map(x => ids.includes(x.id) ? { ...x, asTo: value, st: x.st === ST.P ? ST.C : x.st } : x));
        const ag = users.find((u: any) => u.id === value);
        for (const id of ids) {
          await supabase.from("tasks").update({ assigned_to: value, status: peds.find(x => x.id === id)?.st === ST.P ? ST.C : undefined }).eq("id", id);
          await addLog(id, user.id, fn(user), "Asignó a " + (ag ? fn(ag) : ""), "sys");
        }
        if (value && value !== user.id) {
          sendNotif(value, ids.length + " tareas asignadas", "Te asignaron " + ids.length + " tareas", "task", "", true);
        }
        showT(ids.length + " tareas asignadas");
      }
    } catch (e: any) { showT(e.message || "Error", "err"); }
  }, [user, users, peds, sPd, addLog, showT, sendNotif]);

  const handleImport = useCallback(async (rows: any[]) => {
    try {
      const ts = TODAY + " " + new Date().toTimeString().slice(0, 5);
      const newTasks: any[] = [];
      for (const r of rows) {
        const row: any = { division: r.division || "", creator_id: user.id, creator_name: fn(user), dept_id: user.dId || 1, tipo: r.tipo, description: r.descripcion, due_date: r.fecha_limite, urgency: r.urgencia || "Normal", status: ST.P, assigned_to: null, requires_expense: false, expense_ok: null, resolution: "", created_at: TODAY, amount: null };
        const { data } = await supabase.from("tasks").insert(row).select().single();
        const tid = data?.id || 0;
        if (tid) {
          await supabase.from("task_messages").insert({ task_id: tid, user_id: user.id, user_name: fn(user), content: "Creó tarea (importado CSV)", type: "sys" });
          newTasks.push({ id: tid, div: r.division || "", cId: user.id, cN: fn(user), dId: user.dId || 1, tipo: r.tipo, desc: r.descripcion, fReq: r.fecha_limite, urg: r.urgencia || "Normal", st: ST.P, asTo: null, rG: false, eOk: null, resp: "", cAt: TODAY, monto: null, log: [{ dt: ts, uid: user.id, by: fn(user), act: "Creó tarea (importado CSV)", t: "sys" }] });
        }
      }
      sPd(p => [...newTasks, ...p]);
      showT(newTasks.length + " tareas importadas");
    } catch (e: any) { showT(e.message || "Error al importar", "err"); }
  }, [user, sPd, showT]);

  return { addLog, handleBulk, handleImport, sanitize };
}
