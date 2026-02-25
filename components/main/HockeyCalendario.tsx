"use client";
import { useState, useMemo } from "react";
import { T, HOCKEY_DIV, HOCKEY_RAMA, CALENDARIO_TIPOS } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";

const TODAY = new Date().toISOString().slice(0, 10);
const fmtD = (d: string) => { if (!d) return "–"; const p = d.slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_SEM = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDayOfMonth = (y: number, m: number) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };
const toISO = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const getMonday = (dt: Date) => { const d = new Date(dt); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); d.setDate(diff); return d; };
const addDays = (dt: Date, n: number) => { const d = new Date(dt); d.setDate(d.getDate() + n); return d; };
const dateToISO = (dt: Date) => dt.toISOString().slice(0, 10);

export function HockeyCalendario({ user, mob, getToken, showT, onNavAsist, onNavPartido }: any) {
  const { colors, isDark, cardBg } = useC();
  const calEventos = useDataStore(s => s.hkCalendario);
  const sCalEventos = useDataStore(s => s.sHkCalendario);
  const sesiones = useDataStore(s => s.hkSesiones);
  const partidos = useDataStore(s => s.hkPartidos);

  const [tab, sTab] = useState<"mes" | "sem" | "hoy">("mes");
  const [month, sMonth] = useState(() => new Date());
  const [weekStart, sWeekStart] = useState(() => getMonday(new Date()));
  const [selDay, sSelDay] = useState<string | null>(null);
  const [fTipo, sFTipo] = useState("");
  const [fDiv, sFDiv] = useState("");
  const [showAdd, sShowAdd] = useState(false);
  const [form, sForm] = useState({ titulo: "", tipo: "entrenamiento", fecha: TODAY, hora: "", duracion_min: 60, division: "", rama: "", recurrencia: "none" as string, color: "#3B82F6", notas: "" });
  const RECUR_OPTS = [{ k: "none", l: "Una vez" }, { k: "weekly", l: "Semanal" }, { k: "biweekly", l: "Quincenal" }, { k: "monthly", l: "Mensual" }];
  const EVT_COLORS = ["#3B82F6", "#C8102E", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

  // Build events: calendar_eventos + sesiones + partidos
  const events = useMemo(() => {
    const evts: { date: string; tipo: string; icon: string; color: string; label: string; sub?: string; data: any; source: string }[] = [];
    // Expand recurring calendar events
    const expandRecur = (ev: any) => {
      const rec = ev.recurrencia || "none";
      const base = new Date(ev.fecha + "T12:00:00");
      if (isNaN(base.getTime())) return;
      const ct = CALENDARIO_TIPOS[ev.tipo] || CALENDARIO_TIPOS.otro;
      const make = (iso: string) => ({ date: iso, tipo: ev.tipo, icon: ct.i, color: ev.color || ct.c, label: ev.titulo, data: ev, source: "cal" });
      if (rec === "none") { evts.push(make(ev.fecha)); return; }
      const rangeStart = new Date(); rangeStart.setFullYear(rangeStart.getFullYear() - 1);
      const rangeEnd = new Date(); rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);
      const step = (d: Date, fwd: boolean) => {
        const n = new Date(d); const dir = fwd ? 1 : -1;
        if (rec === "weekly") n.setDate(n.getDate() + 7 * dir);
        else if (rec === "biweekly") n.setDate(n.getDate() + 14 * dir);
        else if (rec === "monthly") n.setMonth(n.getMonth() + 1 * dir);
        return n;
      };
      let cur = new Date(base);
      const dates: Date[] = [];
      while (cur <= rangeEnd) { if (cur >= rangeStart) dates.push(new Date(cur)); cur = step(cur, true); if (dates.length > 200) break; }
      cur = step(new Date(base), false);
      while (cur >= rangeStart) { dates.push(new Date(cur)); cur = step(cur, false); if (dates.length > 200) break; }
      dates.forEach(d => evts.push(make(d.toISOString().slice(0, 10))));
    };
    calEventos.forEach((ev: any) => expandRecur(ev));
    // Sesiones as events
    sesiones.forEach((s: any) => {
      evts.push({ date: s.fecha, tipo: "asistencia", icon: "📋", color: "#3B82F6", label: `Asistencia: ${s.division}`, sub: s.tipo_actividad, data: s, source: "sesion" });
    });
    // Partidos as events
    partidos.forEach((p: any) => {
      evts.push({ date: p.fecha, tipo: "partido", icon: "🏑", color: "#C8102E", label: `vs ${p.rival}`, sub: p.division, data: p, source: "partido" });
    });
    return evts;
  }, [calEventos, sesiones, partidos]);

  // Filter
  const fEvts = events.filter(e => {
    if (fTipo && e.tipo !== fTipo) return false;
    if (fDiv && e.data.division !== fDiv) return false;
    return true;
  });
  const evtsByDate = (d: string) => fEvts.filter(e => e.date === d);

  const handleEvtClick = (e: any) => {
    if (e.source === "sesion" && onNavAsist) onNavAsist(e.data);
    else if (e.source === "partido" && onNavPartido) onNavPartido(e.data);
  };

  // Create calendar event
  const createEvt = async () => {
    if (!form.titulo.trim() || !form.fecha) return;
    const tok = await getToken();
    const res = await fetch("/api/hockey/calendario", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ ...form, hora: form.hora || null, division: form.division || null, rama: form.rama || null }),
    });
    const data = await res.json();
    if (data.error) { showT(data.error, "err"); return; }
    sCalEventos(p => [...p, data]);
    showT("Evento creado");
    sShowAdd(false);
    sForm({ titulo: "", tipo: "entrenamiento", fecha: TODAY, hora: "", duracion_min: 60, division: "", rama: "", recurrencia: "none", color: "#3B82F6", notas: "" });
  };

  const delEvt = async (id: number) => {
    const tok = await getToken();
    await fetch(`/api/hockey/calendario?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${tok}` } });
    sCalEventos(p => p.filter((e: any) => e.id !== id));
    showT("Evento eliminado");
  };

  /* ── Event Pill ── */
  const EvtPill = ({ e, compact }: { e: any; compact?: boolean }) => (
    <div onClick={ev => { ev.stopPropagation(); handleEvtClick(e); }} style={{ padding: compact ? "1px 4px" : "3px 8px", borderRadius: 10, background: e.color + "18", cursor: "pointer", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: compact ? 8 : 10, flexShrink: 0 }}>{e.icon}</span>
        {!compact && <span style={{ fontSize: 10, fontWeight: 600, color: e.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1 }}>{e.label}</span>}
      </div>
    </div>
  );

  /* ── Month View ── */
  const MonthView = () => {
    const y = month.getFullYear(), m = month.getMonth();
    const dim = daysInMonth(y, m), fd = firstDayOfMonth(y, m);
    const prevDim = daysInMonth(y, m === 0 ? 11 : m - 1);
    const cells: any[] = [];
    for (let i = fd - 1; i >= 0; i--) cells.push({ d: prevDim - i, cur: false, iso: "" });
    for (let d = 1; d <= dim; d++) cells.push({ d, cur: true, iso: toISO(y, m, d) });
    while (cells.length % 7 !== 0) cells.push({ d: cells.length - fd - dim + 1, cur: false, iso: "" });
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => sMonth(new Date(y, m - 1, 1))} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 14, color: colors.nv }}>◀</button>
          <div style={{ fontSize: mob ? 14 : 16, fontWeight: 800, color: colors.nv }}>{MESES[m]} {y}</div>
          <button onClick={() => sMonth(new Date(y, m + 1, 1))} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 14, color: colors.nv }}>▶</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
          {DIAS_SEM.map(d => <div key={d} style={{ textAlign: "center" as const, fontSize: 10, fontWeight: 700, color: colors.g4, padding: "4px 0" }}>{d}</div>)}
          {cells.map((c, i) => {
            const dayEvts = c.cur ? evtsByDate(c.iso) : [];
            const isToday = c.iso === TODAY;
            return (
              <div key={i} onClick={() => { if (c.cur) sSelDay(selDay === c.iso ? null : c.iso); }} style={{
                minHeight: mob ? 44 : 80, padding: mob ? "2px" : "4px 6px",
                background: isToday ? (isDark ? "#1E3A5F" : "#EFF6FF") : cardBg,
                border: isToday ? "2px solid " + colors.bl : "1px solid " + colors.g2,
                borderRadius: 6, cursor: c.cur ? "pointer" : "default", overflow: "hidden"
              }}>
                <div style={{ fontSize: mob ? 10 : 12, fontWeight: isToday ? 800 : c.cur ? 600 : 400, color: c.cur ? (isToday ? colors.bl : colors.nv) : colors.g3, marginBottom: 2 }}>{c.d}</div>
                {c.cur && !mob && dayEvts.slice(0, 3).map((e, j) => <div key={j} style={{ marginBottom: 1 }}><EvtPill e={e} /></div>)}
                {c.cur && mob && dayEvts.length > 0 && <div style={{ display: "flex", gap: 2, flexWrap: "wrap" as const }}>{dayEvts.slice(0, 4).map((e, j) => <div key={j} style={{ width: 6, height: 6, borderRadius: 3, background: e.color }} />)}</div>}
                {c.cur && !mob && dayEvts.length > 3 && <div style={{ fontSize: 9, color: colors.g4, fontWeight: 600 }}>+{dayEvts.length - 3} más</div>}
              </div>
            );
          })}
        </div>
        {selDay && (
          <Card style={{ marginTop: 12, borderLeft: "4px solid " + colors.bl }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: colors.nv }}>{selDay === TODAY ? "Hoy — " : ""}{fmtD(selDay)}</div>
              <button onClick={() => sSelDay(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: colors.g4 }}>✕</button>
            </div>
            {evtsByDate(selDay).length === 0 && <div style={{ fontSize: 12, color: colors.g4, textAlign: "center" as const, padding: 12 }}>Sin eventos este día</div>}
            {evtsByDate(selDay).map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, background: e.color + "10", marginBottom: 3, cursor: "pointer" }} onClick={() => handleEvtClick(e)}>
                <span style={{ fontSize: 12 }}>{e.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: e.color, flex: 1 }}>{e.label}</span>
                {e.source === "cal" && <button onClick={ev => { ev.stopPropagation(); delEvt(e.data.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: colors.g4 }}>✕</button>}
              </div>
            ))}
            {/* Quick actions */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {onNavAsist && <button onClick={() => onNavAsist(null, selDay)} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid " + colors.bl, background: colors.bl + "12", color: colors.bl, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>📋 Tomar Asistencia</button>}
              {onNavPartido && <button onClick={() => onNavPartido(null, selDay)} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid " + T.rd, background: T.rd + "12", color: T.rd, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>🏑 Registrar Partido</button>}
            </div>
          </Card>
        )}
      </div>
    );
  };

  /* ── Week View ── */
  const WeekView = () => {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) days.push(dateToISO(addDays(weekStart, i)));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => sWeekStart(addDays(weekStart, -7))} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 14, color: colors.nv }}>◀</button>
          <div style={{ fontSize: mob ? 12 : 14, fontWeight: 800, color: colors.nv }}>Semana del {fmtD(days[0])} al {fmtD(days[6])}</div>
          <button onClick={() => sWeekStart(addDays(weekStart, 7))} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 14, color: colors.nv }}>▶</button>
        </div>
        <div style={{ display: mob ? "flex" : "grid", gridTemplateColumns: "repeat(7,1fr)", flexDirection: mob ? "column" as const : undefined, gap: mob ? 6 : 4 }}>
          {days.map((d, i) => {
            const dayEvts = evtsByDate(d);
            const isToday = d === TODAY;
            return (
              <div key={i} style={{
                background: isToday ? (isDark ? "#1E3A5F" : "#EFF6FF") : cardBg,
                border: isToday ? "2px solid " + colors.bl : "1px solid " + colors.g2,
                borderRadius: 10, padding: mob ? "10px 12px" : "8px", minHeight: mob ? undefined : 120
              }}>
                <div style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? colors.bl : colors.nv, marginBottom: 6 }}>{DIAS_SEM[i]} {d.slice(8)}{isToday ? " (Hoy)" : ""}</div>
                {dayEvts.length === 0 && <div style={{ fontSize: 10, color: colors.g3 }}>—</div>}
                {dayEvts.map((e, j) => (
                  <div key={j} style={{ marginBottom: 3, cursor: "pointer" }} onClick={() => handleEvtClick(e)}>
                    <div style={{ padding: "4px 8px", background: e.color + "12", borderRadius: 8, border: "1px solid " + e.color + "30" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 10 }}>{e.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: e.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{e.label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Today View ── */
  const TodayView = () => {
    const todayEvts = evtsByDate(TODAY);
    const next7: string[] = []; for (let i = 1; i <= 7; i++) next7.push(dateToISO(addDays(new Date(), i)));
    const upcomingEvts = next7.flatMap(d => evtsByDate(d).map(e => ({ ...e, dateLabel: fmtD(d) })));
    return (
      <div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 6 }}>Hoy — {fmtD(TODAY)}</div>
          {todayEvts.length === 0 && <Card style={{ textAlign: "center" as const, padding: 20, color: colors.g4 }}>Sin eventos hoy</Card>}
          {todayEvts.map((e, i) => (
            <div key={i} style={{ marginBottom: 4, cursor: "pointer" }} onClick={() => handleEvtClick(e)}>
              <div style={{ padding: "6px 10px", background: e.color + "12", borderRadius: 8, border: "1px solid " + e.color + "30" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11 }}>{e.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: e.color, flex: 1 }}>{e.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 6 }}>Próximos 7 días</div>
          {upcomingEvts.length === 0 && <Card style={{ textAlign: "center" as const, padding: 20, color: colors.g4 }}>Sin eventos próximos</Card>}
          {upcomingEvts.map((e: any, i) => (
            <div key={i} style={{ marginBottom: 4, cursor: "pointer" }} onClick={() => handleEvtClick(e)}>
              <div style={{ padding: "6px 10px", background: cardBg, borderRadius: 8, border: "1px solid " + colors.g2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11 }}>{e.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: e.color, flex: 1 }}>{e.label}</span>
                  <span style={{ fontSize: 9, color: colors.g4, flexShrink: 0 }}>{e.dateLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: mob ? undefined : 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 19, color: colors.nv, fontWeight: 800 }}>Calendario Hockey</h2>
        <Btn v="s" s="s" onClick={() => sShowAdd(!showAdd)}>+ Evento</Btn>
      </div>
      <p style={{ color: colors.g4, fontSize: 12, margin: "0 0 14px" }}>Entrenamientos, partidos y eventos</p>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {([["mes", "Mes"], ["sem", "Semana"], ["hoy", "Hoy"]] as const).map(([k, l]) => <button key={k} onClick={() => sTab(k)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: tab === k ? colors.nv : cardBg, color: tab === k ? (isDark ? "#0F172A" : "#fff") : colors.g5, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>)}
      </div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" as const }}>
        <select value={fTipo} onChange={e => sFTipo(e.target.value)} style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 10 }}>
          <option value="">Todos los tipos</option>
          {Object.entries(CALENDARIO_TIPOS).map(([k, v]) => <option key={k} value={k}>{v.i} {v.l}</option>)}
          <option value="asistencia">📋 Asistencia</option>
          <option value="partido">🏑 Partido</option>
        </select>
        <select value={fDiv} onChange={e => sFDiv(e.target.value)} style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 10 }}>
          <option value="">Todas las divisiones</option>
          {HOCKEY_DIV.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {/* Add event form */}
      {showAdd && (
        <Card style={{ marginBottom: 14, background: isDark ? colors.g2 : "#F0FDF4", border: "1px solid " + (isDark ? colors.g3 : "#BBF7D0") }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? colors.gn : "#166534" }}>Nuevo evento</div>
            <button onClick={() => sShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: colors.g4 }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Título *</label><input value={form.titulo} onChange={e => sForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ej: Entrenamiento Primera" style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
            <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Fecha *</label><input type="date" value={form.fecha} onChange={e => sForm(p => ({ ...p, fecha: e.target.value }))} style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
            <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Tipo</label><select value={form.tipo} onChange={e => sForm(p => ({ ...p, tipo: e.target.value }))} style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, marginTop: 2 }}>{Object.entries(CALENDARIO_TIPOS).map(([k, v]) => <option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
            <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Hora</label><input type="time" value={form.hora} onChange={e => sForm(p => ({ ...p, hora: e.target.value }))} style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>División</label><select value={form.division} onChange={e => sForm(p => ({ ...p, division: e.target.value }))} style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, marginTop: 2 }}><option value="">General</option>{HOCKEY_DIV.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Repetir</label><div style={{ display: "flex", flexWrap: "wrap" as const, gap: 3, marginTop: 3 }}>{RECUR_OPTS.map(o => <button key={o.k} onClick={() => sForm(p => ({ ...p, recurrencia: o.k }))} style={{ padding: "3px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, border: form.recurrencia === o.k ? "2px solid " + colors.nv : "1px solid " + colors.g3, background: form.recurrencia === o.k ? colors.nv + "12" : cardBg, color: form.recurrencia === o.k ? colors.nv : colors.g4, cursor: "pointer" }}>{o.l}</button>)}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Color:</label>
            <div style={{ display: "flex", gap: 4 }}>{EVT_COLORS.map(c => <div key={c} onClick={() => sForm(p => ({ ...p, color: c }))} style={{ width: 22, height: 22, borderRadius: 11, background: c, cursor: "pointer", border: form.color === c ? "3px solid " + colors.nv : "2px solid transparent" }} />)}</div>
          </div>
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            <Btn v="g" s="s" onClick={() => sShowAdd(false)}>Cancelar</Btn>
            <Btn v="s" s="s" disabled={!form.titulo || !form.fecha} onClick={createEvt}>Crear</Btn>
          </div>
        </Card>
      )}
      {tab === "mes" && <MonthView />}
      {tab === "sem" && <WeekView />}
      {tab === "hoy" && <TodayView />}
    </div>
  );
}
