"use client";
import { useState, useMemo } from "react";
import { DIV, BOOK_FAC, FIX_LOCAL, FIX_CANCHA_MAP, FIX_ST } from "@/lib/constants";
import { Btn, Card, Ring } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import { shareFixturesWhatsApp } from "@/lib/export";
import * as XLSX from "xlsx";

const TODAY = new Date().toISOString().slice(0, 10);
const FKEYS = Object.keys(BOOK_FAC).filter(k => k.startsWith("cancha"));
const FIX_SKEYS = Object.keys(FIX_ST);
const CANCHA_LABELS = FKEYS.map(k => ({ key: k, label: BOOK_FAC[k].l }));
const DIV_COL: Record<string, string> = {};
["Escuelita", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"].forEach(d => { DIV_COL[d] = "#10B981"; });
["M13", "M14"].forEach(d => { DIV_COL[d] = "#3B82F6"; });
["M15", "M16", "M17", "M18", "M19"].forEach(d => { DIV_COL[d] = "#F59E0B"; });
["Plantel Superior", "Intermedia", "Primera"].forEach(d => { DIV_COL[d] = "#DC2626"; });

const getMonday = (dt: Date) => { const d = new Date(dt); const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); return d; };
const addDays = (dt: Date, n: number) => { const d = new Date(dt); d.setDate(d.getDate() + n); return d; };
const dateISO = (dt: Date) => dt.toISOString().slice(0, 10);
const fmtD = (d: string) => { if (!d) return "–"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
const fmtDShort = (d: string) => { if (!d) return "–"; const [, m, dd] = d.split("-"); return `${dd}/${m}`; };
const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

const emptyForm = () => ({ division: "", rival: "", date: TODAY, time: "", condicion: "", is_local: false, cancha: "", facility_key: "", status: "pendiente", notes: "" });

export function FixturesView({ user, mob, onAdd, onUpd, onDel, onDelWeek, onAddBookings }: any) {
  const fixtures = useDataStore(s => s.fixtures);
  const bookings = useDataStore(s => s.bookings);
  const { colors, isDark, cardBg } = useC();

  const [tab, sTab] = useState<"semana" | "historial" | "stats">("semana");
  const [weekStart, sWeekStart] = useState(() => getMonday(new Date()));
  const [showForm, sShowForm] = useState(false);
  const [editId, sEditId] = useState<number | null>(null);
  const [form, sForm] = useState(emptyForm);
  const [showExcel, sShowExcel] = useState(false);
  const [excelRows, sExcelRows] = useState<any[]>([]);
  const [excelWeekLabel, sExcelWeekLabel] = useState("");
  const [excelFile, sExcelFile] = useState<File | null>(null);
  const [histSearch, sHistSearch] = useState("");
  const [expandedWeek, sExpandedWeek] = useState<string | null>(null);
  const [syncing, sSyncing] = useState(false);

  // Week days
  const weekDays = useMemo(() => {
    const d: string[] = [];
    for (let i = 0; i < 7; i++) d.push(dateISO(addDays(weekStart, i)));
    return d;
  }, [weekStart]);

  const weekEnd = weekDays[6];
  const weekLabel = `${fmtDShort(weekDays[0])} al ${fmtD(weekEnd)}`;

  // Fixtures for current week
  const weekFixtures = useMemo(() =>
    (fixtures || []).filter((f: any) => f.date >= weekDays[0] && f.date <= weekEnd)
      .sort((a: any, b: any) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")),
    [fixtures, weekDays, weekEnd]
  );

  // Grouped weeks for historial
  const weekGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const f of (fixtures || [])) {
      const ws = f.week_start_date || f.date;
      if (!groups[ws]) groups[ws] = [];
      groups[ws].push(f);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([ws, fxs]) => ({ weekStart: ws, label: fxs[0]?.week_label || `Semana del ${fmtD(ws)}`, fixtures: fxs }));
  }, [fixtures]);

  // Stats by division
  const divStats = useMemo(() => {
    const m: Record<string, { total: number; local: number }> = {};
    for (const f of (fixtures || [])) {
      if (!f.division) continue;
      if (!m[f.division]) m[f.division] = { total: 0, local: 0 };
      m[f.division].total++;
      if (f.is_local) m[f.division].local++;
    }
    return Object.entries(m).sort(([a], [b]) => {
      const ai = DIV.indexOf(a), bi = DIV.indexOf(b);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  }, [fixtures]);

  // ── Styles ──
  const lblSt: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: colors.g4, marginBottom: 2, display: "block" };
  const iSt: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid " + colors.g3, background: cardBg, color: colors.nv, fontSize: 13 };
  const thSt: React.CSSProperties = { padding: mob ? "8px 6px" : "6px 8px", fontSize: mob ? 10 : 9, fontWeight: 700, color: "#fff", background: colors.nv, textAlign: "left", whiteSpace: "nowrap" };
  const tdSt: React.CSSProperties = { padding: mob ? "8px 6px" : "5px 8px", fontSize: mob ? 11 : 10, borderBottom: "1px solid " + colors.g2, verticalAlign: "middle" };

  // ── Condicion → is_local ──
  const checkLocal = (cond: string) => FIX_LOCAL.includes((cond || "").trim().toUpperCase());

  // ── Form handlers ──
  const openAdd = () => { sForm(emptyForm()); sEditId(null); sShowForm(true); };
  const openEdit = (f: any) => {
    sForm({ division: f.division, rival: f.rival, date: f.date, time: f.time || "", condicion: f.condicion || "", is_local: f.is_local, cancha: f.cancha || "", facility_key: f.facility_key || "", status: f.status || "pendiente", notes: f.notes || "" });
    sEditId(f.id); sShowForm(true);
  };
  const saveForm = async () => {
    if (!form.division || !form.rival || !form.date) return;
    const row = {
      ...form,
      is_local: checkLocal(form.condicion),
      facility_key: form.cancha ? (FIX_CANCHA_MAP[form.cancha.toUpperCase()] || form.cancha) : "",
      week_start_date: dateISO(getMonday(new Date(form.date + "T12:00:00"))),
      week_label: excelWeekLabel || weekLabel,
    };
    if (editId) await onUpd(editId, row);
    else await onAdd([row]);
    sShowForm(false); sEditId(null);
  };

  // ── Excel import ──
  const handleExcelFile = async (file: File) => {
    sExcelFile(file);
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    // Map columns — flexible matching
    const mapped = json.map((r: any) => {
      const keys = Object.keys(r);
      const find = (patterns: string[]) => keys.find(k => patterns.some(p => k.toUpperCase().includes(p))) || "";
      const division = r[find(["DIVIS", "DIV", "CATEG"])] || "";
      const rival = r[find(["RIVAL", "EQUIPO", "CLUB"])] || "";
      const dia = r[find(["DIA", "FECHA", "DATE"])] || "";
      const hora = r[find(["HORA", "TIME", "HORARIO"])] || "";
      const condicion = r[find(["CONDIC", "COND", "LOC"])] || "";
      const cancha = r[find(["CANCHA", "CAMPO", "FIELD"])] || "";
      // Parse date — handle various formats
      let date = TODAY;
      if (dia) {
        if (typeof dia === "number") {
          // Excel serial date
          const d = new Date((dia - 25569) * 86400 * 1000);
          date = dateISO(d);
        } else if (typeof dia === "string" && dia.includes("-")) {
          date = dia.slice(0, 10);
        } else if (typeof dia === "string" && dia.includes("/")) {
          const parts = dia.split("/");
          if (parts.length === 3) {
            const [dd, mm, yy] = parts;
            date = `${yy.length === 2 ? "20" + yy : yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
          }
        }
      }
      return {
        division: String(division).trim(),
        rival: String(rival).trim(),
        date,
        time: String(hora).trim(),
        condicion: String(condicion).trim(),
        is_local: checkLocal(String(condicion)),
        cancha: String(cancha).trim(),
        facility_key: FIX_CANCHA_MAP[(String(cancha).trim()).toUpperCase()] || "",
        status: "pendiente",
        notes: "",
        _missingCancha: !String(cancha).trim(),
      };
    }).filter((r: any) => r.division || r.rival);
    sExcelRows(mapped);
  };

  const confirmExcel = async () => {
    if (!excelWeekLabel) return;
    const wsDate = dateISO(getMonday(new Date(excelRows[0]?.date + "T12:00:00" || TODAY)));
    const rows = excelRows.map((r: any) => {
      const { _missingCancha, ...rest } = r;
      return { ...rest, week_label: excelWeekLabel, week_start_date: wsDate, created_by: user?.id, created_by_name: (user?.n || "") + " " + (user?.a || "") };
    });
    await onAdd(rows);
    sShowExcel(false); sExcelRows([]); sExcelFile(null); sExcelWeekLabel("");
  };

  // ── Sync Espacios ──
  const syncEspacios = async () => {
    const toSync = weekFixtures.filter((f: any) => f.is_local && !f.booking_id && f.facility_key);
    if (!toSync.length) return;
    sSyncing(true);
    try {
      await onAddBookings(toSync.map((f: any) => ({
        fixtureId: f.id,
        booking: {
          facility: f.facility_key,
          date: f.date,
          time_start: f.time || "10:00",
          time_end: f.time ? (() => { const [h, m] = f.time.split(":"); return `${String(Number(h) + 2).padStart(2, "0")}:${m}`; })() : "12:00",
          title: `${f.division} vs ${f.rival}`,
          division: f.division,
          status: "confirmada",
          created_by: user?.id,
          created_by_name: (user?.n || "") + " " + (user?.a || ""),
        },
      })));
    } finally { sSyncing(false); }
  };

  // ── Render ──
  const canSync = weekFixtures.some((f: any) => f.is_local && !f.booking_id && f.facility_key);
  const missingCancha = weekFixtures.some((f: any) => f.is_local && !f.facility_key);

  return (
    <div style={{ padding: mob ? 10 : 20 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: mob ? 18 : 22, fontWeight: 800, color: colors.nv }}>📅 Fixtures</span>
        <div style={{ flex: 1 }} />
        {/* Tabs */}
        {(["semana", "historial", "stats"] as const).map(t => (
          <button key={t} onClick={() => sTab(t)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: tab === t ? "2px solid " + colors.bl : "1px solid " + colors.g3,
            background: tab === t ? (isDark ? "rgba(59,130,246,.15)" : "#EFF6FF") : cardBg,
            color: tab === t ? colors.bl : colors.g5,
          }}>
            {t === "semana" ? "📋 Semana" : t === "historial" ? "📚 Historial" : "📊 Estadísticas"}
          </button>
        ))}
      </div>

      {/* ═══ TAB SEMANA ═══ */}
      {tab === "semana" && <>
        {/* Week nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <button onClick={() => sWeekStart(addDays(weekStart, -7))} style={{ background: cardBg, border: "1px solid " + colors.g3, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: colors.nv }}>◀</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>Semana del {weekLabel}</span>
          <button onClick={() => sWeekStart(getMonday(new Date()))} style={{ background: colors.bl, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Hoy</button>
          <button onClick={() => sWeekStart(addDays(weekStart, 7))} style={{ background: cardBg, border: "1px solid " + colors.g3, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: colors.nv }}>▶</button>
          <div style={{ flex: 1 }} />
          {/* Action buttons */}
          <Btn v="p" s="s" onClick={openAdd}>+ Manual</Btn>
          <Btn v="s" s="s" onClick={() => sShowExcel(true)}>📤 Excel</Btn>
          <Btn v="w" s="s" onClick={() => shareFixturesWhatsApp(weekFixtures[0]?.week_label || weekLabel, weekFixtures)} disabled={!weekFixtures.length}>📲 WhatsApp</Btn>
          <Btn v="pu" s="s" onClick={syncEspacios} disabled={!canSync || syncing}>
            {syncing ? "⏳..." : "🔄 Sync Espacios"}
          </Btn>
        </div>
        {missingCancha && <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#92400E", marginBottom: 10 }}>
          ⚠️ Hay fixtures locales sin cancha asignada. Completá la cancha para poder sincronizar con Espacios.
        </div>}

        {/* Status summary pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {FIX_SKEYS.map(k => {
            const cnt = weekFixtures.filter((f: any) => f.status === k).length;
            return (<span key={k} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 12, background: FIX_ST[k].bg, border: "1px solid " + FIX_ST[k].c + "40", color: FIX_ST[k].c, fontWeight: 600 }}>{FIX_ST[k].i} {FIX_ST[k].l}: {cnt}</span>);
          })}
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 12, background: isDark ? colors.g2 : "#F3F4F6", color: colors.g5, fontWeight: 600 }}>Total: {weekFixtures.length}</span>
        </div>

        {/* Week table */}
        <Card style={{ overflow: "auto", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mob ? 600 : 800 }}>
            <thead><tr>
              <th style={thSt}>División</th>
              <th style={thSt}>Rival</th>
              <th style={thSt}>Día</th>
              <th style={thSt}>Hora</th>
              <th style={thSt}>Condición</th>
              <th style={thSt}>Cancha</th>
              <th style={thSt}>Estado</th>
              <th style={{ ...thSt, textAlign: "center" }}>Acciones</th>
            </tr></thead>
            <tbody>
              {weekFixtures.length === 0 && <tr><td colSpan={8} style={{ ...tdSt, textAlign: "center", color: colors.g4, padding: 30 }}>Sin fixtures para esta semana</td></tr>}
              {weekFixtures.map((f: any) => {
                const dc = DIV_COL[f.division] || colors.g5;
                const st = FIX_ST[f.status] || FIX_ST.pendiente;
                return (
                  <tr key={f.id} style={{ background: f.is_local ? (isDark ? "rgba(16,185,129,.06)" : "rgba(16,185,129,.04)") : "transparent" }}>
                    <td style={tdSt}><span style={{ color: dc, fontWeight: 700 }}>{f.division}</span></td>
                    <td style={tdSt}>{f.rival}</td>
                    <td style={tdSt}>{(() => { const dow = new Date(f.date + "T12:00:00").getDay(); return DIAS[dow] + " " + fmtDShort(f.date); })()}</td>
                    <td style={tdSt}>{f.time || "–"}</td>
                    <td style={tdSt}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: f.is_local ? "#D1FAE5" : "#DBEAFE", color: f.is_local ? "#065F46" : "#1E40AF", fontWeight: 600 }}>{f.is_local ? "🏠 Local" : "🚗 Visitante"}</span></td>
                    <td style={tdSt}>{f.cancha || "–"}</td>
                    <td style={tdSt}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: st.bg, color: st.c, fontWeight: 600 }}>{st.i} {st.l}</span></td>
                    <td style={{ ...tdSt, textAlign: "center", whiteSpace: "nowrap" }}>
                      <button onClick={() => openEdit(f)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 4 }} title="Editar">✏️</button>
                      <button onClick={() => onDel(f.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 4 }} title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </>}

      {/* ═══ TAB HISTORIAL ═══ */}
      {tab === "historial" && <>
        <div style={{ marginBottom: 12 }}>
          <input value={histSearch} onChange={e => sHistSearch(e.target.value)} placeholder="Buscar rival, división..." style={{ ...iSt, maxWidth: 300 }} />
        </div>
        {weekGroups.filter(g => {
          if (!histSearch) return true;
          const q = histSearch.toLowerCase();
          return g.label.toLowerCase().includes(q) || g.fixtures.some((f: any) => (f.rival || "").toLowerCase().includes(q) || (f.division || "").toLowerCase().includes(q));
        }).map(g => (
          <Card key={g.weekStart} style={{ marginBottom: 8, padding: 0 }}>
            <div onClick={() => sExpandedWeek(expandedWeek === g.weekStart ? null : g.weekStart)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer" }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: colors.nv }}>{g.label}</span>
                <span style={{ marginLeft: 8, fontSize: 10, color: colors.g4 }}>{g.fixtures.length} partidos</span>
              </div>
              <span style={{ fontSize: 14 }}>{expandedWeek === g.weekStart ? "▼" : "▶"}</span>
            </div>
            {expandedWeek === g.weekStart && (
              <div style={{ overflow: "auto", borderTop: "1px solid " + colors.g2 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                  <thead><tr>
                    <th style={thSt}>División</th><th style={thSt}>Rival</th><th style={thSt}>Día</th><th style={thSt}>Hora</th><th style={thSt}>Condición</th><th style={thSt}>Cancha</th><th style={thSt}>Estado</th>
                  </tr></thead>
                  <tbody>
                    {g.fixtures.sort((a: any, b: any) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")).map((f: any) => {
                      const dc = DIV_COL[f.division] || colors.g5;
                      const st = FIX_ST[f.status] || FIX_ST.pendiente;
                      return (
                        <tr key={f.id}>
                          <td style={tdSt}><span style={{ color: dc, fontWeight: 700 }}>{f.division}</span></td>
                          <td style={tdSt}>{f.rival}</td>
                          <td style={tdSt}>{fmtDShort(f.date)}</td>
                          <td style={tdSt}>{f.time || "–"}</td>
                          <td style={tdSt}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: f.is_local ? "#D1FAE5" : "#DBEAFE", color: f.is_local ? "#065F46" : "#1E40AF", fontWeight: 600 }}>{f.is_local ? "🏠" : "🚗"}</span></td>
                          <td style={tdSt}>{f.cancha || "–"}</td>
                          <td style={tdSt}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: st.bg, color: st.c, fontWeight: 600 }}>{st.i} {st.l}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
        {weekGroups.length === 0 && <div style={{ textAlign: "center", color: colors.g4, padding: 40, fontSize: 13 }}>Sin historial de fixtures</div>}
      </>}

      {/* ═══ TAB ESTADÍSTICAS ═══ */}
      {tab === "stats" && <>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
          {divStats.map(([div, s]) => {
            const pct = s.total ? Math.round(s.local / s.total * 100) : 0;
            const dc = DIV_COL[div] || colors.bl;
            return (
              <Card key={div} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 16, gap: 8 }}>
                <Ring pct={pct} color={dc} size={90} icon="🏉" />
                <span style={{ fontWeight: 700, fontSize: 12, color: dc }}>{div}</span>
                <span style={{ fontSize: 10, color: colors.g4, textAlign: "center" }}>
                  {s.total} partidos · {pct}% local · {100 - pct}% visitante
                </span>
              </Card>
            );
          })}
        </div>
        {divStats.length === 0 && <div style={{ textAlign: "center", color: colors.g4, padding: 40, fontSize: 13 }}>Sin datos de fixtures</div>}
      </>}

      {/* ═══ MODAL: FORM (Agregar/Editar) ═══ */}
      {showForm && <>
        <div onClick={() => sShowForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: cardBg, borderRadius: 14, padding: mob ? 16 : 24, width: mob ? "95vw" : 480, maxHeight: "90vh", overflow: "auto", zIndex: 201, boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: colors.nv }}>{editId ? "✏️ Editar Fixture" : "➕ Nuevo Fixture"}</span>
            <button onClick={() => sShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: colors.g4 }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lblSt}>División</label>
              <select value={form.division} onChange={e => sForm(p => ({ ...p, division: e.target.value }))} style={iSt}>
                <option value="">Seleccionar...</option>
                {DIV.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={lblSt}>Rival</label>
              <input value={form.rival} onChange={e => sForm(p => ({ ...p, rival: e.target.value }))} style={iSt} placeholder="Nombre del rival" />
            </div>
            <div>
              <label style={lblSt}>Fecha</label>
              <input type="date" value={form.date} onChange={e => sForm(p => ({ ...p, date: e.target.value }))} style={iSt} />
            </div>
            <div>
              <label style={lblSt}>Hora</label>
              <input type="time" value={form.time} onChange={e => sForm(p => ({ ...p, time: e.target.value }))} style={iSt} />
            </div>
            <div>
              <label style={lblSt}>Condición</label>
              <input value={form.condicion} onChange={e => { const v = e.target.value; sForm(p => ({ ...p, condicion: v, is_local: checkLocal(v) })); }} style={iSt} placeholder="LOCAL, LOS TORDOS, visitante..." />
            </div>
            <div>
              <label style={lblSt}>Cancha</label>
              <select value={form.cancha} onChange={e => sForm(p => ({ ...p, cancha: e.target.value, facility_key: FKEYS.find(k => BOOK_FAC[k].l === e.target.value) || "" }))} style={iSt}>
                <option value="">Sin cancha</option>
                {CANCHA_LABELS.map(c => <option key={c.key} value={c.label}>{c.label}</option>)}
              </select>
            </div>
          </div>
          {/* Estado dropdown — same style as Reservas */}
          <div style={{ marginTop: 10 }}>
            <label style={lblSt}>Estado</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FIX_SKEYS.map(k => {
                const s = FIX_ST[k];
                return (
                  <button key={k} onClick={() => sForm(p => ({ ...p, status: k }))} style={{
                    padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: form.status === k ? "2px solid " + s.c : "1px solid " + colors.g3,
                    background: form.status === k ? s.bg : cardBg, color: s.c,
                  }}>
                    {s.i} {s.l}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={lblSt}>Notas</label>
            <textarea value={form.notes} onChange={e => sForm(p => ({ ...p, notes: e.target.value }))} style={{ ...iSt, minHeight: 60, resize: "vertical" }} placeholder="Notas opcionales..." />
          </div>
          {form.is_local && <div style={{ marginTop: 8, fontSize: 10, color: "#065F46", background: "#D1FAE5", borderRadius: 6, padding: "4px 10px" }}>🏠 Detectado como LOCAL</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Btn v="g" s="s" onClick={() => sShowForm(false)}>Cancelar</Btn>
            <Btn v="p" s="s" onClick={saveForm} disabled={!form.division || !form.rival}>{editId ? "Guardar" : "Agregar"}</Btn>
          </div>
        </div>
      </>}

      {/* ═══ MODAL: EXCEL IMPORT ═══ */}
      {showExcel && <>
        <div onClick={() => { sShowExcel(false); sExcelRows([]); sExcelFile(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: cardBg, borderRadius: 14, padding: mob ? 16 : 24, width: mob ? "95vw" : 700, maxHeight: "90vh", overflow: "auto", zIndex: 201, boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: colors.nv }}>📤 Importar Fixture desde Excel</span>
            <button onClick={() => { sShowExcel(false); sExcelRows([]); sExcelFile(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: colors.g4 }}>✕</button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lblSt}>Etiqueta de semana</label>
            <input value={excelWeekLabel} onChange={e => sExcelWeekLabel(e.target.value)} style={iSt} placeholder="Ej: Viernes 6 y Sábado 7 de Marzo 2026" />
          </div>
          {!excelRows.length && <div style={{ border: "2px dashed " + colors.g3, borderRadius: 12, padding: 30, textAlign: "center" }}>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleExcelFile(f); }} style={{ display: "block", margin: "0 auto" }} />
            <div style={{ fontSize: 11, color: colors.g4, marginTop: 8 }}>Columnas esperadas: DIVISION, RIVAL, DIA, HORA, CONDICION, CANCHA</div>
          </div>}
          {excelRows.length > 0 && <>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Preview ({excelRows.length} filas)</div>
            <div style={{ overflow: "auto", maxHeight: 400 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead><tr>
                  <th style={thSt}>División</th><th style={thSt}>Rival</th><th style={thSt}>Día</th><th style={thSt}>Hora</th><th style={thSt}>Condición</th><th style={thSt}>Cancha</th><th style={thSt}>Estado</th>
                </tr></thead>
                <tbody>
                  {excelRows.map((r: any, i: number) => {
                    const st = FIX_ST[r.status] || FIX_ST.pendiente;
                    return (
                      <tr key={i} style={{ background: r._missingCancha && r.is_local ? "#FEE2E2" : "transparent" }}>
                        <td style={tdSt}><span style={{ color: DIV_COL[r.division] || colors.g5, fontWeight: 700 }}>{r.division}</span></td>
                        <td style={tdSt}>{r.rival}</td>
                        <td style={tdSt}>{fmtDShort(r.date)}</td>
                        <td style={tdSt}>{r.time || "–"}</td>
                        <td style={tdSt}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: r.is_local ? "#D1FAE5" : "#DBEAFE", color: r.is_local ? "#065F46" : "#1E40AF", fontWeight: 600 }}>{r.is_local ? "🏠 Local" : "🚗 Visitante"}</span></td>
                        <td style={tdSt}>
                          <select value={r.cancha} onChange={e => {
                            const val = e.target.value;
                            sExcelRows(prev => prev.map((row, idx) => idx === i ? { ...row, cancha: val, facility_key: FKEYS.find(k => BOOK_FAC[k].l === val) || "", _missingCancha: !val } : row));
                          }} style={{ ...iSt, padding: "4px 6px", fontSize: 10, background: r._missingCancha && r.is_local ? "#FEE2E2" : cardBg }}>
                            <option value="">–</option>
                            {CANCHA_LABELS.map(c => <option key={c.key} value={c.label}>{c.label}</option>)}
                          </select>
                        </td>
                        <td style={tdSt}>
                          <select value={r.status} onChange={e => {
                            const val = e.target.value;
                            sExcelRows(prev => prev.map((row, idx) => idx === i ? { ...row, status: val } : row));
                          }} style={{ ...iSt, padding: "4px 6px", fontSize: 10 }}>
                            {FIX_SKEYS.map(k => <option key={k} value={k}>{FIX_ST[k].i} {FIX_ST[k].l}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {excelRows.some((r: any) => r._missingCancha && r.is_local) && <div style={{ marginTop: 8, fontSize: 11, color: "#DC2626", fontWeight: 600 }}>⚠️ Filas en rojo: fixtures locales sin cancha. Seleccioná una cancha antes de confirmar.</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <Btn v="g" s="s" onClick={() => { sExcelRows([]); sExcelFile(null); }}>Cancelar</Btn>
              <Btn v="p" s="s" onClick={confirmExcel} disabled={!excelWeekLabel}>Confirmar e importar</Btn>
            </div>
          </>}
        </div>
      </>}
    </div>
  );
}
