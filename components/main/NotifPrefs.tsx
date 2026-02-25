"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import { Btn, Card } from "@/components/ui";

const supabase = createClient();

export function NotifPrefs({ user, mob }: { user: any; mob: boolean }) {
  const { colors, isDark } = useC();
  const { notifPrefs, sNotifPrefs } = useDataStore();

  const [saving, sSaving] = useState(false);
  const [local, sLocal] = useState({
    daily_summary: notifPrefs?.daily_summary ?? true,
    push_enabled: notifPrefs?.push_enabled ?? true,
    email_task_assign: notifPrefs?.email_task_assign ?? true,
    email_deadline: notifPrefs?.email_deadline ?? true,
    email_comment: notifPrefs?.email_comment ?? false,
    remind_days_before: notifPrefs?.remind_days_before ?? 1,
  });

  const toggle = (key: string) => sLocal((p: any) => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    sSaving(true);
    try {
      const row = { user_id: user.id, ...local, updated_at: new Date().toISOString() };
      await supabase.from("notification_preferences").upsert(row);
      sNotifPrefs(() => row);
    } catch {}
    sSaving(false);
  };

  const toggleStyle = (on: boolean): React.CSSProperties => ({
    width: 40,
    height: 22,
    borderRadius: 11,
    background: on ? colors.gn : colors.g3,
    border: "none",
    cursor: "pointer",
    position: "relative",
    transition: "background .2s",
    flexShrink: 0,
  });

  const dotStyle = (on: boolean): React.CSSProperties => ({
    width: 16,
    height: 16,
    borderRadius: 8,
    background: "#fff",
    position: "absolute",
    top: 3,
    left: on ? 21 : 3,
    transition: "left .2s",
    boxShadow: "0 1px 3px rgba(0,0,0,.2)",
  });

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid " + colors.g2,
  };

  const items: { key: string; label: string; desc: string }[] = [
    { key: "daily_summary", label: "Resumen diario por email", desc: "Lun-Vie 8:00 AM con tareas pendientes y vencidas" },
    { key: "push_enabled", label: "Notificaciones push", desc: "Alertas en el navegador/celular" },
    { key: "email_task_assign", label: "Email al asignar tarea", desc: "Recibir email cuando te asignan una tarea" },
    { key: "email_deadline", label: "Email por vencimiento", desc: "Recibir email cuando una tarea vence" },
    { key: "email_comment", label: "Email por comentario", desc: "Recibir email por cada comentario nuevo" },
  ];

  return (
    <Card style={{ margin: mob ? "8px 0" : "12px 0", padding: mob ? 14 : 18 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: colors.nv }}>
        Preferencias de notificaciones
      </h3>
      {items.map((item) => (
        <div key={item.key} style={rowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.nv }}>{item.label}</div>
            <div style={{ fontSize: 10, color: colors.g4, marginTop: 2 }}>{item.desc}</div>
          </div>
          <button onClick={() => toggle(item.key)} style={toggleStyle((local as any)[item.key])}>
            <div style={dotStyle((local as any)[item.key])} />
          </button>
        </div>
      ))}
      {/* Remind days before */}
      <div style={rowStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.nv }}>Recordar antes del vencimiento</div>
          <div style={{ fontSize: 10, color: colors.g4, marginTop: 2 }}>Cuántos días antes del vencimiento recordar</div>
        </div>
        <select
          value={local.remind_days_before}
          onChange={(e) => sLocal((p) => ({ ...p, remind_days_before: Number(e.target.value) }))}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid " + colors.g3,
            fontSize: 11,
            background: isDark ? colors.g1 : "#fff",
            color: colors.nv,
            cursor: "pointer",
          }}
        >
          {[0, 1, 2, 3, 5, 7].map((d) => (
            <option key={d} value={d}>
              {d === 0 ? "No recordar" : d + " día" + (d > 1 ? "s" : "")}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <Btn v="p" s="s" onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Btn>
      </div>
    </Card>
  );
}
