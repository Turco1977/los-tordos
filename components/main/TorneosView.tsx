"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import { TN_ST, TN_HITOS_TEMPLATE, TN_CHECKLIST, TN_BUDGET_RUBROS, fn } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";

/* ── helpers ── */
const codeDays = (c: string): number => {
  if (c === "D0") return 0;
  const m = c.replace(/b$/, "").match(/^D([+-]?\d+)$/);
  return m ? -Number(m[1]) : 0;
};
const addDays = (d: string, n: number) => {
  const dt = new Date(d + "T12:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};
const fmtDate = (d: string | null | undefined) => {
  if (!d) return "–";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
};
const countdown = (d: string | null | undefined) => {
  if (!d) return null;
  const diff = Math.round((new Date(d + "T12:00:00").getTime() - Date.now()) / 864e5);
  if (diff < 0) return { label: `Hace ${-diff}d`, color: "#DC2626" };
  if (diff === 0) return { label: "Hoy", color: "#F59E0B" };
  return { label: `En ${diff}d`, color: diff <= 7 ? "#F59E0B" : "#10B981" };
};

const CLUB_ST: Record<string, { l: string; c: string; bg: string; i: string }> = {
  invitado: { l: "Invitado", c: "#6B7280", bg: "#F3F4F6", i: "📩" },
  confirmado: { l: "Confirmado", c: "#10B981", bg: "#D1FAE5", i: "✅" },
  declinado: { l: "Declinado", c: "#DC2626", bg: "#FEE2E2", i: "❌" },
};

/* ── types for props ── */
interface Props {
  user: any;
  mob: boolean;
  onAdd: (d: any) => Promise<any>;
  onUpd: (id: number, d: any) => Promise<void>;
  onDel: (id: number) => Promise<void>;
  onAddHito: (rows: any[]) => Promise<void>;
  onUpdHito: (id: number, d: any) => Promise<void>;
  onAddClub: (d: any) => Promise<void>;
  onUpdClub: (id: number, d: any) => Promise<void>;
  onDelClub: (id: number) => Promise<void>;
}

export function TorneosView({ user, mob, onAdd, onUpd, onDel, onAddHito, onUpdHito, onAddClub, onUpdClub, onDelClub }: Props) {
  const { colors, isDark, cardBg } = useC();
  const torneos = useDataStore(s => s.torneos);
  const torneoHitos = useDataStore(s => s.torneoHitos);
  const torneoClubes = useDataStore(s => s.torneoClubes);
  const users = useDataStore(s => s.users);

  const [mode, sMode] = useState<"list" | "form" | "detail">("list");
  const [selId, sSelId] = useState<number | null>(null);
  const [tab, sTab] = useState("resumen");
  const [form, sForm] = useState<any>({});
  const [clubForm, sClubForm] = useState<any | null>(null);

  const sel = useMemo(() => torneos.find((t: any) => t.id === selId), [torneos, selId]);
  const hitos = useMemo(() => torneoHitos.filter((h: any) => h.torneo_id === selId).sort((a: any, b: any) => {
    const da = codeDays(a.code), db = codeDays(b.code);
    return da - db;
  }), [torneoHitos, selId]);
  const clubes = useMemo(() => torneoClubes.filter((c: any) => c.torneo_id === selId), [torneoClubes, selId]);

  const iS: React.CSSProperties = { width: "100%", padding: mob ? "10px 12px" : "8px 10px", borderRadius: 8, border: "1px solid " + colors.g3, background: cardBg, color: colors.nv, fontSize: mob ? 14 : 12 };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: colors.g5, marginBottom: 3, display: "block" };

  /* ── LIST ── */
  if (mode === "list") {
    return (<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><h2 style={{ margin: 0, fontSize: mob ? 16 : 19, fontWeight: 800, color: colors.nv }}>🏆 Torneos Institucionales</h2>
          <p style={{ margin: 0, fontSize: 11, color: colors.g4 }}>{torneos.length} torneos</p></div>
        <Btn v="p" s="s" onClick={() => { sForm({ name: "", category: "", responsable: "", start_date: "", end_date: "", status: "planificacion", notes: "" }); sMode("form"); }}>+ Torneo</Btn>
      </div>
      {torneos.length === 0 && <Card style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div><div style={{ fontSize: 13, color: colors.g4 }}>No hay torneos creados aún</div></Card>}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
        {torneos.map((t: any) => {
          const st = TN_ST[t.status] || TN_ST.planificacion;
          const cd = countdown(t.start_date);
          const th = torneoHitos.filter((h: any) => h.torneo_id === t.id);
          const done = th.filter((h: any) => h.done).length;
          const tc = torneoClubes.filter((c: any) => c.torneo_id === t.id);
          const conf = tc.filter((c: any) => c.status === "confirmado").length;
          const pct = th.length ? Math.round(done / th.length * 100) : 0;
          return (<Card key={t.id} style={{ cursor: "pointer", padding: mob ? 16 : 14 }} onClick={() => { sSelId(t.id); sTab("resumen"); sMode("detail"); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div><div style={{ fontSize: mob ? 15 : 14, fontWeight: 700, color: colors.nv }}>{t.name}</div>
                {t.category && <div style={{ fontSize: 11, color: colors.g4, marginTop: 2 }}>{t.category}</div>}</div>
              <span style={{ fontSize: 10, fontWeight: 700, color: st.c, background: st.bg, padding: "2px 8px", borderRadius: 10 }}>{st.i} {st.l}</span>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: colors.g5, marginBottom: 8, flexWrap: "wrap" }}>
              {t.start_date && <span>📅 {fmtDate(t.start_date)}</span>}
              {cd && <span style={{ color: cd.color, fontWeight: 700 }}>{cd.label}</span>}
              {t.responsable && <span>👤 {t.responsable}</span>}
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 10, color: colors.g4 }}>
              <span>📊 Hitos: {done}/{th.length} ({pct}%)</span>
              <span>🏉 Clubes: {conf}/{tc.length}</span>
            </div>
            {th.length > 0 && <div style={{ marginTop: 6, height: 4, background: colors.g2, borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: pct + "%", background: "#10B981", borderRadius: 2, transition: "width .3s" }} /></div>}
          </Card>);
        })}
      </div>
    </div>);
  }

  /* ── FORM (create/edit) ── */
  if (mode === "form") {
    const isEdit = !!form.id;
    return (<div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button onClick={() => sMode(isEdit ? "detail" : "list")} style={{ background: "none", border: "none", fontSize: 13, cursor: "pointer", color: colors.g5 }}>← Volver</button>
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 18, fontWeight: 800, color: colors.nv }}>{isEdit ? "Editar" : "Nuevo"} Torneo</h2>
      </div>
      <Card style={{ maxWidth: 560, padding: mob ? 20 : 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={lbl}>Nombre del torneo *</label><input style={iS} value={form.name || ""} onChange={e => sForm({ ...form, name: e.target.value })} placeholder="Ej: Beto Jofré M16 2026" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={lbl}>Categoría</label><select style={iS} value={form.category || ""} onChange={e => sForm({ ...form, category: e.target.value })}><option value="">–</option>{["M13", "M14", "M16", "M19"].map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={lbl}>Estado</label><select style={iS} value={form.status || "planificacion"} onChange={e => sForm({ ...form, status: e.target.value })}>{Object.entries(TN_ST).map(([k, v]) => <option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
          </div>
          <div><label style={lbl}>Responsable</label><select style={iS} value={form.responsable_id || ""} onChange={e => { const u = users.find((u: any) => u.id === e.target.value); sForm({ ...form, responsable_id: e.target.value, responsable: u ? fn(u) : "" }); }}><option value="">–</option>{users.map((u: any) => <option key={u.id} value={u.id}>{fn(u)}</option>)}</select></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={lbl}>Fecha inicio</label><input type="date" style={iS} value={form.start_date || ""} onChange={e => sForm({ ...form, start_date: e.target.value })} /></div>
            <div><label style={lbl}>Fecha fin</label><input type="date" style={iS} value={form.end_date || ""} onChange={e => sForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div><label style={lbl}>Notas</label><textarea style={{ ...iS, minHeight: 60 }} value={form.notes || ""} onChange={e => sForm({ ...form, notes: e.target.value })} /></div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn v="p" onClick={async () => {
              if (!form.name?.trim()) return;
              const row: any = { name: form.name.trim(), category: form.category || null, responsable: form.responsable || null, responsable_id: form.responsable_id || null, start_date: form.start_date || null, end_date: form.end_date || null, status: form.status || "planificacion", notes: form.notes || null };
              if (isEdit) {
                await onUpd(form.id, row);
                sMode("detail");
              } else {
                row.created_by = user.id;
                const res = await onAdd(row);
                if (res?.id && form.start_date) {
                  const hitosRows = TN_HITOS_TEMPLATE.map(h => ({
                    torneo_id: res.id, code: h.code, description: h.desc, responsable: h.resp,
                    due_date: addDays(form.start_date, -codeDays(h.code)),
                  }));
                  await onAddHito(hitosRows);
                }
                if (res?.id) { sSelId(res.id); sTab("resumen"); sMode("detail"); }
                else sMode("list");
              }
            }}>{isEdit ? "Guardar" : "Crear torneo"}</Btn>
            <Btn v="g" onClick={() => sMode(isEdit ? "detail" : "list")}>Cancelar</Btn>
          </div>
        </div>
      </Card>
    </div>);
  }

  /* ── DETAIL ── */
  if (!sel) { sMode("list"); return null; }
  const st = TN_ST[sel.status] || TN_ST.planificacion;
  const cd = countdown(sel.start_date);
  const hitosDone = hitos.filter((h: any) => h.done).length;
  const hitosPct = hitos.length ? Math.round(hitosDone / hitos.length * 100) : 0;
  const clubConf = clubes.filter((c: any) => c.status === "confirmado").length;

  // Checklist stats
  const checklist: Record<string, boolean> = sel.checklist || {};
  const totalCheckItems = TN_CHECKLIST.reduce((s, sec) => s + sec.items.length, 0);
  const checkedItems = Object.values(checklist).filter(Boolean).length;
  const checkPct = totalCheckItems ? Math.round(checkedItems / totalCheckItems * 100) : 0;

  // Budget
  const budget: any[] = Array.isArray(sel.budget) ? sel.budget : [];
  const budgetTotal = budget.reduce((s: number, r: any) => s + Number(r.estimado || 0), 0);
  const budgetReal = budget.reduce((s: number, r: any) => s + Number(r.real || 0), 0);

  const tabs = [
    { k: "resumen", l: "Resumen", i: "📊" },
    { k: "timeline", l: "Timeline", i: "📅" },
    { k: "clubes", l: "Clubes", i: "🏉" },
    { k: "checklist", l: "Checklist D-7", i: "✅" },
    { k: "presupuesto", l: "Presupuesto", i: "💰" },
  ];

  return (<div>
    {/* Header */}
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <button onClick={() => { sMode("list"); sSelId(null); }} style={{ background: "none", border: "none", fontSize: 13, cursor: "pointer", color: colors.g5 }}>← Torneos</button>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 19, fontWeight: 800, color: colors.nv }}>{sel.name}</h2>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: colors.g4, marginTop: 4, flexWrap: "wrap" }}>
          {sel.category && <span>{sel.category}</span>}
          {sel.responsable && <span>👤 {sel.responsable}</span>}
          {sel.start_date && <span>📅 {fmtDate(sel.start_date)}{sel.end_date ? " → " + fmtDate(sel.end_date) : ""}</span>}
          {cd && <span style={{ color: cd.color, fontWeight: 700 }}>{cd.label}</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: st.c, background: st.bg, padding: "2px 8px", borderRadius: 10 }}>{st.i} {st.l}</span>
        <Btn v="g" s="s" onClick={() => { sForm({ ...sel }); sMode("form"); }}>Editar</Btn>
        <Btn v="g" s="s" onClick={async () => { if (confirm("Eliminar torneo?")) { await onDel(sel.id); sMode("list"); sSelId(null); } }}>Eliminar</Btn>
      </div>
    </div>

    {/* Tabs */}
    <div style={{ display: "flex", gap: 2, marginBottom: 14, overflowX: "auto", borderBottom: "2px solid " + colors.g2, paddingBottom: 0 }}>
      {tabs.map(t => <button key={t.k} onClick={() => sTab(t.k)} style={{ padding: mob ? "8px 12px" : "6px 10px", fontSize: mob ? 12 : 11, fontWeight: tab === t.k ? 700 : 500, color: tab === t.k ? colors.nv : colors.g4, background: "none", border: "none", borderBottom: tab === t.k ? "2px solid " + colors.nv : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", marginBottom: -2 }}>{t.i} {t.l}</button>)}
    </div>

    {/* ── TAB: RESUMEN ── */}
    {tab === "resumen" && <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
      <Card style={{ padding: 14, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: colors.nv }}>{hitosPct}%</div><div style={{ fontSize: 10, color: colors.g4 }}>Timeline ({hitosDone}/{hitos.length})</div><div style={{ marginTop: 6, height: 4, background: colors.g2, borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: hitosPct + "%", background: "#10B981", borderRadius: 2 }} /></div></Card>
      <Card style={{ padding: 14, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: colors.nv }}>{clubConf}/{clubes.length}</div><div style={{ fontSize: 10, color: colors.g4 }}>Clubes confirmados</div></Card>
      <Card style={{ padding: 14, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: colors.nv }}>{checkPct}%</div><div style={{ fontSize: 10, color: colors.g4 }}>Checklist D-7 ({checkedItems}/{totalCheckItems})</div><div style={{ marginTop: 6, height: 4, background: colors.g2, borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: checkPct + "%", background: "#3B82F6", borderRadius: 2 }} /></div></Card>
      <Card style={{ padding: 14, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: colors.nv }}>${budgetTotal.toLocaleString()}</div><div style={{ fontSize: 10, color: colors.g4 }}>Presupuesto estimado</div></Card>
    </div>}

    {/* ── TAB: TIMELINE ── */}
    {tab === "timeline" && <Card style={{ padding: mob ? 14 : 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>📅 Timeline de hitos</div>
        <div style={{ fontSize: 11, color: colors.g4 }}>{hitosDone}/{hitos.length} completados</div>
      </div>
      {hitos.length === 0 && <div style={{ fontSize: 12, color: colors.g4, textAlign: "center", padding: 20 }}>No hay hitos. Definí la fecha de inicio y se generarán automáticamente.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {hitos.map((h: any) => {
          const hcd = countdown(h.due_date);
          const isPast = h.due_date && h.due_date < new Date().toISOString().slice(0, 10);
          return (<div key={h.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 8, background: h.done ? (isDark ? "#064e3b22" : "#D1FAE520") : (isPast && !h.done ? (isDark ? "#7f1d1d22" : "#FEE2E220") : "transparent"), border: "1px solid " + (h.done ? "#10B98130" : isPast && !h.done ? "#DC262630" : colors.g2) }}>
            <input type="checkbox" checked={!!h.done} onChange={async () => { await onUpdHito(h.id, { done: !h.done }); }} style={{ marginTop: 2, cursor: "pointer", accentColor: "#10B981" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: h.done ? "#10B981" : colors.nv, textDecoration: h.done ? "line-through" : "none" }}><span style={{ color: colors.g4, fontWeight: 600, marginRight: 6 }}>{h.code}</span>{h.description}</span>
                {hcd && !h.done && <span style={{ fontSize: 10, fontWeight: 700, color: hcd.color, whiteSpace: "nowrap" }}>{hcd.label}</span>}
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 10, color: colors.g4, marginTop: 2 }}>
                {h.due_date && <span>📅 {fmtDate(h.due_date)}</span>}
                {h.responsable && <span>👤 {h.responsable}</span>}
              </div>
            </div>
          </div>);
        })}
      </div>
    </Card>}

    {/* ── TAB: CLUBES ── */}
    {tab === "clubes" && <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>🏉 Clubes participantes ({clubes.length})</div>
        <Btn v="p" s="s" onClick={() => sClubForm({ club_name: "", union_name: "", contact_person: "", contact_phone: "", status: "invitado", accommodation: "", zona: "", coordinator: "", coordinator_phone: "", notes: "" })}>+ Club</Btn>
      </div>
      {/* Club form modal */}
      {clubForm && <Card style={{ padding: mob ? 16 : 20, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>{clubForm.id ? "Editar" : "Agregar"} club</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>
          <div><label style={lbl}>Club *</label><input style={iS} value={clubForm.club_name || ""} onChange={e => sClubForm({ ...clubForm, club_name: e.target.value })} /></div>
          <div><label style={lbl}>Unión</label><input style={iS} value={clubForm.union_name || ""} onChange={e => sClubForm({ ...clubForm, union_name: e.target.value })} /></div>
          <div><label style={lbl}>Contacto</label><input style={iS} value={clubForm.contact_person || ""} onChange={e => sClubForm({ ...clubForm, contact_person: e.target.value })} /></div>
          <div><label style={lbl}>Teléfono</label><input style={iS} value={clubForm.contact_phone || ""} onChange={e => sClubForm({ ...clubForm, contact_phone: e.target.value })} /></div>
          <div><label style={lbl}>Estado</label><select style={iS} value={clubForm.status || "invitado"} onChange={e => sClubForm({ ...clubForm, status: e.target.value })}>{Object.entries(CLUB_ST).map(([k, v]) => <option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
          <div><label style={lbl}>Alojamiento</label><select style={iS} value={clubForm.accommodation || ""} onChange={e => sClubForm({ ...clubForm, accommodation: e.target.value })}><option value="">–</option><option value="hotel">Hotel</option><option value="familia">Familia</option></select></div>
          <div><label style={lbl}>Zona</label><input style={iS} value={clubForm.zona || ""} onChange={e => sClubForm({ ...clubForm, zona: e.target.value })} /></div>
          <div><label style={lbl}>Coordinador LTRC</label><input style={iS} value={clubForm.coordinator || ""} onChange={e => sClubForm({ ...clubForm, coordinator: e.target.value })} /></div>
        </div>
        <div style={{ marginTop: 8 }}><label style={lbl}>Notas</label><textarea style={{ ...iS, minHeight: 40 }} value={clubForm.notes || ""} onChange={e => sClubForm({ ...clubForm, notes: e.target.value })} /></div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <Btn v="p" s="s" onClick={async () => {
            if (!clubForm.club_name?.trim()) return;
            const row = { torneo_id: sel.id, club_name: clubForm.club_name.trim(), union_name: clubForm.union_name || null, contact_person: clubForm.contact_person || null, contact_phone: clubForm.contact_phone || null, status: clubForm.status || "invitado", accommodation: clubForm.accommodation || null, zona: clubForm.zona || null, coordinator: clubForm.coordinator || null, coordinator_phone: clubForm.coordinator_phone || null, notes: clubForm.notes || null };
            if (clubForm.id) await onUpdClub(clubForm.id, row);
            else await onAddClub(row);
            sClubForm(null);
          }}>{clubForm.id ? "Guardar" : "Agregar"}</Btn>
          <Btn v="g" s="s" onClick={() => sClubForm(null)}>Cancelar</Btn>
        </div>
      </Card>}
      {clubes.length === 0 && !clubForm && <Card style={{ textAlign: "center", padding: 30 }}><div style={{ fontSize: 12, color: colors.g4 }}>No hay clubes registrados</div></Card>}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>
        {clubes.map((c: any) => {
          const cst = CLUB_ST[c.status] || CLUB_ST.invitado;
          return (<Card key={c.id} style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{c.club_name}</div>
                {c.union_name && <div style={{ fontSize: 10, color: colors.g4 }}>{c.union_name}</div>}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: cst.c, background: cst.bg, padding: "1px 6px", borderRadius: 8 }}>{cst.i} {cst.l}</span>
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 10, color: colors.g5, marginTop: 6, flexWrap: "wrap" }}>
              {c.contact_person && <span>👤 {c.contact_person}</span>}
              {c.contact_phone && <span>📞 {c.contact_phone}</span>}
              {c.accommodation && <span>🏨 {c.accommodation}</span>}
              {c.zona && <span>📍 {c.zona}</span>}
              {c.coordinator && <span>🎯 {c.coordinator}</span>}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              <button onClick={() => sClubForm({ ...c })} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, border: "1px solid " + colors.g3, background: cardBg, color: colors.g5, cursor: "pointer" }}>Editar</button>
              <button onClick={async () => { if (confirm("Eliminar club?")) await onDelClub(c.id); }} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, border: "1px solid #DC262640", background: "#FEE2E2", color: "#DC2626", cursor: "pointer" }}>Eliminar</button>
              {c.status !== "confirmado" && <button onClick={() => onUpdClub(c.id, { status: "confirmado" })} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, border: "1px solid #10B98140", background: "#D1FAE5", color: "#10B981", cursor: "pointer" }}>Confirmar</button>}
              {c.status !== "declinado" && c.status !== "confirmado" && <button onClick={() => onUpdClub(c.id, { status: "declinado" })} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, border: "1px solid #DC262640", background: "#FEE2E2", color: "#DC2626", cursor: "pointer" }}>Declinó</button>}
            </div>
          </Card>);
        })}
      </div>
    </div>}

    {/* ── TAB: CHECKLIST D-7 ── */}
    {tab === "checklist" && <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>✅ Checklist D-7</div>
        <div style={{ fontSize: 11, color: colors.g4 }}>{checkedItems}/{totalCheckItems} ({checkPct}%)</div>
      </div>
      <div style={{ marginBottom: 12, height: 6, background: colors.g2, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: checkPct + "%", background: "#3B82F6", borderRadius: 3, transition: "width .3s" }} /></div>
      {TN_CHECKLIST.map((sec, si) => {
        const secChecked = sec.items.filter((_, ii) => checklist[si + "-" + ii]).length;
        const secPct = sec.items.length ? Math.round(secChecked / sec.items.length * 100) : 0;
        return (<Card key={si} style={{ padding: mob ? 14 : 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{sec.emoji} {sec.title}</div>
            <span style={{ fontSize: 10, color: colors.g4 }}>{secChecked}/{sec.items.length} ({secPct}%)</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sec.items.map((item, ii) => {
              const key = si + "-" + ii;
              const checked = !!checklist[key];
              return (<label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: checked ? colors.g4 : colors.nv, cursor: "pointer", padding: "3px 0", textDecoration: checked ? "line-through" : "none" }}>
                <input type="checkbox" checked={checked} onChange={async () => {
                  const newCL = { ...checklist, [key]: !checked };
                  await onUpd(sel.id, { checklist: newCL });
                }} style={{ accentColor: "#3B82F6", cursor: "pointer" }} />
                {item}
              </label>);
            })}
          </div>
        </Card>);
      })}
    </div>}

    {/* ── TAB: PRESUPUESTO ── */}
    {tab === "presupuesto" && <Card style={{ padding: mob ? 14 : 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>💰 Presupuesto</div>
        {budget.length === 0 && <Btn v="p" s="s" onClick={async () => {
          const initial = TN_BUDGET_RUBROS.map(r => ({ rubro: r, estimado: 0, real: 0, notas: "" }));
          await onUpd(sel.id, { budget: initial });
        }}>Inicializar rubros</Btn>}
      </div>
      {budget.length === 0 && <div style={{ fontSize: 12, color: colors.g4, textAlign: "center", padding: 20 }}>Presupuesto sin rubros. Hacé clic en "Inicializar rubros" para cargar los rubros predefinidos.</div>}
      {budget.length > 0 && <div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ borderBottom: "2px solid " + colors.g2 }}>
              <th style={{ textAlign: "left", padding: "6px 8px", color: colors.g5, fontSize: 10, fontWeight: 700 }}>Rubro</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: colors.g5, fontSize: 10, fontWeight: 700 }}>Estimado</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: colors.g5, fontSize: 10, fontWeight: 700 }}>Real</th>
              <th style={{ textAlign: "left", padding: "6px 8px", color: colors.g5, fontSize: 10, fontWeight: 700 }}>Notas</th>
            </tr></thead>
            <tbody>
              {budget.map((r: any, i: number) => (<tr key={i} style={{ borderBottom: "1px solid " + colors.g2 }}>
                <td style={{ padding: "6px 8px", fontWeight: 600, color: colors.nv }}>{r.rubro}</td>
                <td style={{ padding: "4px 4px", textAlign: "right" }}>
                  <input type="number" value={r.estimado || ""} placeholder="0" onChange={e => {
                    const nb = [...budget]; nb[i] = { ...nb[i], estimado: Number(e.target.value) || 0 };
                    onUpd(sel.id, { budget: nb });
                  }} style={{ ...iS, width: 90, textAlign: "right", padding: "4px 6px" }} />
                </td>
                <td style={{ padding: "4px 4px", textAlign: "right" }}>
                  <input type="number" value={r.real || ""} placeholder="0" onChange={e => {
                    const nb = [...budget]; nb[i] = { ...nb[i], real: Number(e.target.value) || 0 };
                    onUpd(sel.id, { budget: nb });
                  }} style={{ ...iS, width: 90, textAlign: "right", padding: "4px 6px" }} />
                </td>
                <td style={{ padding: "4px 4px" }}>
                  <input value={r.notas || ""} onChange={e => {
                    const nb = [...budget]; nb[i] = { ...nb[i], notas: e.target.value };
                    onUpd(sel.id, { budget: nb });
                  }} style={{ ...iS, padding: "4px 6px" }} />
                </td>
              </tr>))}
              <tr style={{ fontWeight: 800, borderTop: "2px solid " + colors.g3 }}>
                <td style={{ padding: "8px 8px", color: colors.nv }}>TOTAL</td>
                <td style={{ padding: "8px 8px", textAlign: "right", color: colors.nv }}>${budgetTotal.toLocaleString()}</td>
                <td style={{ padding: "8px 8px", textAlign: "right", color: budgetReal > budgetTotal ? "#DC2626" : "#10B981" }}>${budgetReal.toLocaleString()}</td>
                <td style={{ padding: "8px 8px", fontSize: 10, color: colors.g4 }}>{budgetTotal > 0 ? Math.round(budgetReal / budgetTotal * 100) + "% ejecutado" : ""}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>}
    </Card>}
  </div>);
}
