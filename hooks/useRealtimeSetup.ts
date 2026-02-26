"use client";
import { useRealtime } from "@/lib/realtime";
import { useDataStore } from "@/lib/store";
import { taskFromDB, presuFromDB } from "@/lib/mappers";

export function useRealtimeSetup(
  isOnline: boolean,
  user: any,
  refreshNotifs: () => void,
) {
  const {
    sPd, sPr, sProjects, sProjTasks, sTaskTemplates,
    sInventory, sInvMaint, sInvDist, sBookings, sSponsors,
    sSponMsgs, sSponDeliveries, sProjBudgets,
  } = useDataStore();

  useRealtime([
    {
      table: "tasks",
      onInsert: (row: any) => sPd(p => [taskFromDB(row, []), ...p]),
      onUpdate: (row: any) => sPd(p => p.map(x => x.id === row.id ? { ...x, div: row.division, cId: row.creator_id, cN: row.creator_name, dId: row.dept_id, tipo: row.tipo, tit: row.title || "", desc: row.description, fReq: row.due_date, urg: row.urgency, st: row.status, asTo: row.assigned_to, rG: row.requires_expense, eOk: row.expense_ok, resp: row.resolution, monto: row.amount } : x)),
      onDelete: (row: any) => sPd(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "task_messages", onInsert: (msg: any) => {
        sPd(p => p.map(x => {
          if (x.id !== msg.task_id) return x;
          const dup = (x.log || []).some((l: any) => l.uid === msg.user_id && l.act === msg.content && l.dt?.slice(0, 16) === msg.created_at?.slice(0, 16));
          if (dup) return x;
          return { ...x, log: [...(x.log || []), { dt: msg.created_at || "", uid: msg.user_id, by: msg.user_name, act: msg.content, t: msg.type }] };
        }));
      }
    },
    {
      table: "presupuestos",
      onInsert: (row: any) => sPr(p => [presuFromDB(row), ...p]),
      onUpdate: (row: any) => sPr(p => p.map(x => x.id === row.id ? presuFromDB(row) : x)),
      onDelete: (row: any) => sPr(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "projects",
      onInsert: (row: any) => sProjects(p => [row, ...p]),
      onUpdate: (row: any) => sProjects(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sProjects(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "project_tasks",
      onInsert: (row: any) => sProjTasks(p => [row, ...p]),
      onUpdate: (row: any) => sProjTasks(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sProjTasks(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "task_templates",
      onInsert: (row: any) => sTaskTemplates(p => [row, ...p]),
      onUpdate: (row: any) => sTaskTemplates(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sTaskTemplates(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "inventory",
      onInsert: (row: any) => sInventory(p => [row, ...p]),
      onUpdate: (row: any) => sInventory(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sInventory(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "inventory_maintenance",
      onInsert: (row: any) => sInvMaint(p => [row, ...p]),
      onUpdate: (row: any) => sInvMaint(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sInvMaint(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "inventory_distributions",
      onInsert: (row: any) => sInvDist(p => [row, ...p]),
      onUpdate: (row: any) => sInvDist(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sInvDist(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "bookings",
      onInsert: (row: any) => sBookings(p => [row, ...p]),
      onUpdate: (row: any) => sBookings(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sBookings(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "sponsors",
      onInsert: (row: any) => sSponsors(p => [row, ...p]),
      onUpdate: (row: any) => sSponsors(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sSponsors(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "sponsor_messages", onInsert: (msg: any) => {
        sSponMsgs(p => {
          const dup = p.some((m: any) => m.user_id === msg.user_id && m.content === msg.content && m.created_at?.slice(0, 16) === msg.created_at?.slice(0, 16));
          if (dup) return p;
          return [...p, msg];
        });
      }
    },
    {
      table: "sponsor_deliveries",
      onInsert: (row: any) => sSponDeliveries(p => [row, ...p]),
      onUpdate: (row: any) => sSponDeliveries(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sSponDeliveries(p => p.filter(x => x.id !== row.id)),
    },
    {
      table: "project_budgets",
      onInsert: (row: any) => sProjBudgets(p => [row, ...p]),
      onUpdate: (row: any) => sProjBudgets(p => p.map(x => x.id === row.id ? row : x)),
      onDelete: (row: any) => sProjBudgets(p => p.filter(x => x.id !== row.id)),
    },
    { table: "notifications", onChange: () => refreshNotifs() },
  ], !!user && isOnline);
}
