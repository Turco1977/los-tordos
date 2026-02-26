"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDataStore } from "@/lib/store";
import { fn, FREQ, ST } from "@/lib/constants";

const supabase = createClient();

export function useRecurringTasks(
  user: any,
  dataLoading: boolean,
  fetchAll: () => Promise<void>,
) {
  const { taskTemplates } = useDataStore();
  const autoGenRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const isPersonalRole = user.role === "enlace" || user.role === "manager" || user.role === "usuario";
    if (isPersonalRole || autoGenRef.current || !taskTemplates.length || dataLoading) return;
    const isCoordOrAdmin = user.role === "admin" || user.role === "superadmin" || user.role === "coordinador";
    if (!isCoordOrAdmin) return;
    autoGenRef.current = true;

    (async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);
      for (const tpl of taskTemplates) {
        if (!tpl.active) continue;
        let shouldGen = false;
        if (!tpl.last_generated) { shouldGen = true; }
        else {
          const last = new Date(tpl.last_generated + "T12:00:00");
          const freq = FREQ[tpl.frequency];
          if (!freq) continue;
          let next: Date;
          if (tpl.frequency === "mensual" || tpl.frequency === "trimestral") {
            const months = tpl.frequency === "mensual" ? 1 : 3;
            next = new Date(last.getFullYear(), last.getMonth() + months, tpl.day_of_month || 1);
          } else { next = new Date(last.getTime() + freq.days * 864e5); }
          shouldGen = next <= today;
        }
        if (!shouldGen) continue;
        try {
          const dueDate = new Date(today.getTime() + 7 * 864e5).toISOString().slice(0, 10);
          const row: any = { division: "", creator_id: user.id, creator_name: fn(user), dept_id: tpl.dept_id || 1, tipo: tpl.tipo || "Administrativo", description: tpl.name + (tpl.description ? " - " + tpl.description : ""), due_date: dueDate, urgency: tpl.urgency || "Normal", status: tpl.assigned_to ? ST.C : ST.P, assigned_to: tpl.assigned_to || null, requires_expense: false, expense_ok: null, resolution: "", created_at: todayStr, amount: null };
          const { data } = await supabase.from("tasks").insert(row).select().single();
          if (data) {
            await supabase.from("task_messages").insert({ task_id: data.id, user_id: user.id, user_name: fn(user), content: "Creó tarea automáticamente (recurrente: " + tpl.name + ")", type: "sys" });
            await supabase.from("task_templates").update({ last_generated: todayStr }).eq("id", tpl.id);
          }
        } catch { /* silent */ }
      }
      fetchAll();
    })();
  }, [user, taskTemplates, dataLoading, fetchAll]);
}
