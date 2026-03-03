"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import { TN_ST, TN_HITOS_TEMPLATE, TN_CHECKLIST, TN_BUDGET_RUBROS, PST, PSC, ST, SC, fn } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";

const TODAY = new Date().toISOString().slice(0, 10);

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
  onAddPresu: (d: any) => Promise<void>;
  onAddComm: (d: any) => Promise<void>;
}

export function TorneosView({ user, mob, onAdd, onUpd, onDel, onAddHito, onUpdHito, onAddClub, onUpdClub, onDelClub, onAddPresu, onAddComm }: Props) {
  const { colors, isDark, cardBg } = useC();
  const torneos = useDataStore(s => s.torneos);
  const torneoHitos = useDataStore(s => s.torneoHitos);
  const torneoClubes = useDataStore(s => s.torneoClubes);
  const users = useDataStore(s => s.users);
  const presu = useDataStore(s => s.presu);
  const peds = useDataStore(s => s.peds);

  const [mode, sMode] = useState<"list" | "form" | "detail">("list");
  const [selId, sSelId] = useState<number | null>(null);
  const [tab, sTab] = useState("resumen");
  const [form, sForm] = useState<any>({});
  const [clubForm, sClubForm] = useState<any | null>(null);
  const [clEdit, sClEdit] = useState(false);
  const [newSec, sNewSec] = useState<{ title: string; emoji: string } | null>(null);
  const [newItemIdx, sNewItemIdx] = useState<number | null>(null);
  const [newItemText, sNewItemText] = useState("");
  const [budEdit, sBudEdit] = useState(false);
  const [newRubro, sNewRubro] = useState("");
  const [presuForm, sPresuForm] = useState<any | null>(null);
  const [commForm, sCommForm] = useState<any | null>(null);

  const sel = useMemo(() => torneos.find((t: any) => t.id === selId), [torneos, selId]);
  const hitos = useMemo(() => torneoHitos.filter((h: any) => h.torneo_id === selId).sort((a: any, b: any) => {
    const da = codeDays(a.code), db = codeDays(b.code);
    return da - db;
  }), [torneoHitos, selId]);
  const clubes = useMemo(() => torneoClubes.filter((c: any) => c.torneo_id === selId), [torneoClubes, selId]);

  // Hooks that MUST be before early returns (Rules of Hooks)
  const clSections: { title: string; emoji: string; items: { text: string; done: boolean }[] }[] = useMemo(() => {
    const raw = sel?.checklist;
    if (!raw) return [];
    if (Array.isArray(raw?.sections)) return raw.sections;
    if (typeof raw === "object" && !raw.sections) {
      return TN_CHECKLIST.map((sec, si) => ({
        title: sec.title, emoji: sec.emoji,
        items: sec.items.map((text, ii) => ({ text, done: !!raw[si + "-" + ii] })),
      }));
    }
    return [];
  }, [sel?.checklist]);
  const torneoPresu = useMemo(() => presu.filter((p: any) => p.torneo_id === selId), [presu, selId]);
  const torneoComm = useMemo(() => peds.filter((p: any) => p.torneo_id === selId && p.tipo === "Comunicación"), [peds, selId]);

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

  const totalCheckItems = clSections.reduce((s, sec) => s + sec.items.length, 0);
  const checkedItems = clSections.reduce((s, sec) => s + sec.items.filter(i => i.done).length, 0);
  const checkPct = totalCheckItems ? Math.round(checkedItems / totalCheckItems * 100) : 0;

  const saveChecklist = async (sections: typeof clSections) => {
    await onUpd(sel.id, { checklist: { sections } });
  };

  // Budget (JSON planning estimates)
  const budget: any[] = Array.isArray(sel.budget) ? sel.budget : [];
  const budgetTotal = budget.reduce((s: number, r: any) => s + Number(r.estimado || 0), 0);
  const budgetReal = budget.reduce((s: number, r: any) => s + Number(r.real || 0), 0);

  const presuSol = torneoPresu.filter((p: any) => p.status === PST.SOL || p.status === PST.REC);
  const presuApr = torneoPresu.filter((p: any) => p.status === PST.APR);
  const presuRech = torneoPresu.filter((p: any) => p.status === PST.RECH);
  const presuTotalSol = torneoPresu.reduce((s: number, p: any) => s + Number(p.monto || 0), 0);
  const presuTotalApr = presuApr.reduce((s: number, p: any) => s + Number(p.monto || 0), 0);

  const tabs = [
    { k: "resumen", l: "Resumen", i: "📊" },
    { k: "timeline", l: "Timeline", i: "📅" },
    { k: "clubes", l: "Clubes", i: "🏉" },
    { k: "checklist", l: "Checklist D-7", i: "✅" },
    { k: "presupuesto", l: "Presupuesto", i: "💰" },
    { k: "comunicacion", l: "Comunicación", i: "📣" },
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
      <Card style={{ padding: 14, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: colors.nv }}>${presuTotalApr.toLocaleString()}</div><div style={{ fontSize: 10, color: colors.g4 }}>Aprobado ({presuApr.length})</div>{presuSol.length > 0 && <div style={{ fontSize: 10, color: "#F59E0B", marginTop: 2 }}>${presuTotalSol.toLocaleString()} solicitado</div>}</Card>
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>✅ Checklist D-7</div>
          <span style={{ fontSize: 11, color: colors.g4 }}>{checkedItems}/{totalCheckItems} ({checkPct}%)</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {clSections.length === 0 && <Btn v="p" s="s" onClick={async () => {
            const initial = TN_CHECKLIST.map(sec => ({ title: sec.title, emoji: sec.emoji, items: sec.items.map(t => ({ text: t, done: false })) }));
            await saveChecklist(initial);
          }}>Cargar template PRD</Btn>}
          <Btn v="g" s="s" onClick={() => sClEdit(!clEdit)}>{clEdit ? "Listo" : "Editar"}</Btn>
        </div>
      </div>
      {clSections.length > 0 && <div style={{ marginBottom: 12, height: 6, background: colors.g2, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: checkPct + "%", background: "#3B82F6", borderRadius: 3, transition: "width .3s" }} /></div>}
      {clSections.length === 0 && <Card style={{ textAlign: "center", padding: 30 }}><div style={{ fontSize: 12, color: colors.g4 }}>Checklist vacío. Cargá el template del PRD o agregá secciones manualmente.</div></Card>}

      {clSections.map((sec, si) => {
        const secChecked = sec.items.filter(i => i.done).length;
        const secPct = sec.items.length ? Math.round(secChecked / sec.items.length * 100) : 0;
        return (<Card key={si} style={{ padding: mob ? 14 : 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{sec.emoji} {sec.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: colors.g4 }}>{secChecked}/{sec.items.length} ({secPct}%)</span>
              {clEdit && <>
                {si > 0 && <button onClick={async () => { const ns = [...clSections]; [ns[si - 1], ns[si]] = [ns[si], ns[si - 1]]; await saveChecklist(ns); }} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 4, cursor: "pointer", fontSize: 11, padding: "1px 5px", color: colors.g5 }} title="Subir">▲</button>}
                {si < clSections.length - 1 && <button onClick={async () => { const ns = [...clSections]; [ns[si], ns[si + 1]] = [ns[si + 1], ns[si]]; await saveChecklist(ns); }} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 4, cursor: "pointer", fontSize: 11, padding: "1px 5px", color: colors.g5 }} title="Bajar">▼</button>}
                <button onClick={async () => { if (confirm("Eliminar sección \"" + sec.title + "\"?")) { const ns = clSections.filter((_, i) => i !== si); await saveChecklist(ns); } }} style={{ background: "#FEE2E2", border: "1px solid #DC262640", borderRadius: 4, cursor: "pointer", fontSize: 10, padding: "1px 5px", color: "#DC2626" }}>✕</button>
              </>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sec.items.map((item, ii) => (
              <div key={ii} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                <input type="checkbox" checked={item.done} onChange={async () => {
                  const ns = clSections.map((s, ssi) => ssi !== si ? s : { ...s, items: s.items.map((it, iii) => iii !== ii ? it : { ...it, done: !it.done }) });
                  await saveChecklist(ns);
                }} style={{ accentColor: "#3B82F6", cursor: "pointer" }} />
                <span style={{ flex: 1, fontSize: 12, color: item.done ? colors.g4 : colors.nv, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
                {clEdit && <button onClick={async () => { if (confirm("Eliminar item?")) { const ns = clSections.map((s, ssi) => ssi !== si ? s : { ...s, items: s.items.filter((_, iii) => iii !== ii) }); await saveChecklist(ns); } }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#DC2626", padding: "0 2px" }}>✕</button>}
              </div>
            ))}
          </div>
          {/* Add item inline */}
          {clEdit && newItemIdx === si && <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input style={{ ...iS, flex: 1, padding: "5px 8px" }} placeholder="Nuevo item..." value={newItemText} onChange={e => sNewItemText(e.target.value)} onKeyDown={async e => {
              if (e.key === "Enter" && newItemText.trim()) {
                const ns = clSections.map((s, ssi) => ssi !== si ? s : { ...s, items: [...s.items, { text: newItemText.trim(), done: false }] });
                await saveChecklist(ns); sNewItemText(""); sNewItemIdx(null);
              }
            }} autoFocus />
            <Btn v="p" s="s" onClick={async () => {
              if (!newItemText.trim()) return;
              const ns = clSections.map((s, ssi) => ssi !== si ? s : { ...s, items: [...s.items, { text: newItemText.trim(), done: false }] });
              await saveChecklist(ns); sNewItemText(""); sNewItemIdx(null);
            }}>+</Btn>
            <Btn v="g" s="s" onClick={() => { sNewItemIdx(null); sNewItemText(""); }}>✕</Btn>
          </div>}
          {clEdit && newItemIdx !== si && <button onClick={() => { sNewItemIdx(si); sNewItemText(""); }} style={{ marginTop: 6, background: "none", border: "1px dashed " + colors.g3, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: colors.g4, cursor: "pointer", width: "100%" }}>+ Agregar item</button>}
        </Card>);
      })}

      {/* Add section form */}
      {clEdit && !newSec && <button onClick={() => sNewSec({ title: "", emoji: "" })} style={{ background: "none", border: "2px dashed " + colors.g3, borderRadius: 10, padding: "14px 10px", fontSize: 12, color: colors.g4, cursor: "pointer", width: "100%", fontWeight: 600 }}>+ Agregar sección</button>}
      {clEdit && newSec && <Card style={{ padding: mob ? 14 : 16, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Nueva sección</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 60 }}><label style={lbl}>Emoji</label><input style={{ ...iS, textAlign: "center" }} value={newSec.emoji} onChange={e => sNewSec({ ...newSec, emoji: e.target.value })} placeholder="🔧" maxLength={4} /></div>
          <div style={{ flex: 1 }}><label style={lbl}>Título *</label><input style={iS} value={newSec.title} onChange={e => sNewSec({ ...newSec, title: e.target.value })} placeholder="Nombre de la sección" /></div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn v="p" s="s" onClick={async () => {
            if (!newSec.title.trim()) return;
            const ns = [...clSections, { title: newSec.title.trim(), emoji: newSec.emoji || "📌", items: [] }];
            await saveChecklist(ns); sNewSec(null);
          }}>Agregar</Btn>
          <Btn v="g" s="s" onClick={() => sNewSec(null)}>Cancelar</Btn>
        </div>
      </Card>}
    </div>}

    {/* ── TAB: PRESUPUESTO ── */}
    {tab === "presupuesto" && <div>
      {/* Stats badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: "#FEF3C7", fontSize: 11, fontWeight: 700, color: "#B45309" }}>📤 Pendientes: {presuSol.length} (${presuSol.reduce((s: number, p: any) => s + Number(p.monto || 0), 0).toLocaleString()})</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: "#D1FAE5", fontSize: 11, fontWeight: 700, color: "#065F46" }}>✅ Aprobados: {presuApr.length} (${presuTotalApr.toLocaleString()})</div>
        {presuRech.length > 0 && <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: "#FEE2E2", fontSize: 11, fontWeight: 700, color: "#991B1B" }}>❌ Rechazados: {presuRech.length}</div>}
      </div>

      {/* Real presupuestos list */}
      <Card style={{ padding: mob ? 14 : 18, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>💰 Presupuestos reales</div>
          <Btn v="p" s="s" onClick={() => sPresuForm({ proveedor_nombre: "", descripcion: "", monto: "", moneda: "ARS", notas: "" })}>+ Nuevo Presupuesto</Btn>
        </div>

        {/* Inline form */}
        {presuForm && <Card style={{ padding: mob ? 14 : 16, marginBottom: 12, border: "2px solid " + colors.nv + "30" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Nuevo presupuesto para {sel.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>
            <div><label style={lbl}>Proveedor *</label><input style={iS} value={presuForm.proveedor_nombre || ""} onChange={e => sPresuForm({ ...presuForm, proveedor_nombre: e.target.value })} placeholder="Nombre del proveedor" /></div>
            <div><label style={lbl}>Descripción *</label><input style={iS} value={presuForm.descripcion || ""} onChange={e => sPresuForm({ ...presuForm, descripcion: e.target.value })} placeholder="Qué se presupuesta" /></div>
            <div><label style={lbl}>Monto *</label><input type="number" style={iS} value={presuForm.monto || ""} onChange={e => sPresuForm({ ...presuForm, monto: e.target.value })} placeholder="0" /></div>
            <div><label style={lbl}>Moneda</label><select style={iS} value={presuForm.moneda || "ARS"} onChange={e => sPresuForm({ ...presuForm, moneda: e.target.value })}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
          </div>
          <div style={{ marginTop: 8 }}><label style={lbl}>Notas</label><input style={iS} value={presuForm.notas || ""} onChange={e => sPresuForm({ ...presuForm, notas: e.target.value })} placeholder="Notas adicionales" /></div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <Btn v="p" s="s" onClick={async () => {
              if (!presuForm.proveedor_nombre?.trim() || !presuForm.monto) return;
              await onAddPresu({ ...presuForm, monto: Number(presuForm.monto), torneo_id: sel.id, status: PST.SOL, solicitado_por: fn(user), solicitado_at: TODAY });
              sPresuForm(null);
            }}>Solicitar</Btn>
            <Btn v="g" s="s" onClick={() => sPresuForm(null)}>Cancelar</Btn>
          </div>
        </Card>}

        {torneoPresu.length === 0 && !presuForm && <div style={{ fontSize: 12, color: colors.g4, textAlign: "center", padding: 20 }}>No hay presupuestos vinculados a este torneo. Creá uno para iniciar el flujo de aprobación.</div>}
        {torneoPresu.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {torneoPresu.map((p: any) => {
            const ps = PSC[p.status] || PSC[PST.SOL];
            return (<div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, border: "1px solid " + colors.g2, background: cardBg }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>{p.proveedor_nombre}</div>
                <div style={{ fontSize: 11, color: colors.g5, marginTop: 1 }}>{p.descripcion}</div>
                {p.notas && <div style={{ fontSize: 10, color: colors.g4, marginTop: 1 }}>{p.notas}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: colors.nv }}>${Number(p.monto || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: colors.g4 }}>{p.moneda}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: ps.c, background: ps.bg, padding: "2px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>{ps.i} {ps.l}</span>
              </div>
            </div>);
          })}
        </div>}
      </Card>

      {/* Budget planning (JSON estimates) */}
      <Card style={{ padding: mob ? 14 : 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>📋 Planificación estimativa</div>
          <div style={{ display: "flex", gap: 6 }}>
            {budget.length === 0 && <Btn v="p" s="s" onClick={async () => {
              const initial = TN_BUDGET_RUBROS.map(r => ({ rubro: r, estimado: 0, real: 0, notas: "" }));
              await onUpd(sel.id, { budget: initial });
            }}>Cargar template</Btn>}
            {budget.length > 0 && <Btn v="g" s="s" onClick={() => sBudEdit(!budEdit)}>{budEdit ? "Listo" : "Editar"}</Btn>}
          </div>
        </div>
        {budget.length === 0 && <div style={{ fontSize: 12, color: colors.g4, textAlign: "center", padding: 20 }}>Rubros estimativos sin cargar. Usá el template o editá manualmente.</div>}
        {budget.length > 0 && <div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ borderBottom: "2px solid " + colors.g2 }}>
                {budEdit && <th style={{ width: 60, padding: "6px 4px", color: colors.g5, fontSize: 10, fontWeight: 700 }}></th>}
                <th style={{ textAlign: "left", padding: "6px 8px", color: colors.g5, fontSize: 10, fontWeight: 700 }}>Rubro</th>
                <th style={{ textAlign: "right", padding: "6px 8px", color: colors.g5, fontSize: 10, fontWeight: 700 }}>Estimado</th>
                <th style={{ textAlign: "right", padding: "6px 8px", color: colors.g5, fontSize: 10, fontWeight: 700 }}>Real</th>
                <th style={{ textAlign: "left", padding: "6px 8px", color: colors.g5, fontSize: 10, fontWeight: 700 }}>Notas</th>
                {budEdit && <th style={{ width: 30, padding: "6px 4px" }}></th>}
              </tr></thead>
              <tbody>
                {budget.map((r: any, i: number) => (<tr key={i} style={{ borderBottom: "1px solid " + colors.g2 }}>
                  {budEdit && <td style={{ padding: "4px 4px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {i > 0 && <button onClick={async () => { const nb = [...budget]; [nb[i - 1], nb[i]] = [nb[i], nb[i - 1]]; await onUpd(sel.id, { budget: nb }); }} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 3, cursor: "pointer", fontSize: 9, padding: "0px 4px", color: colors.g5, lineHeight: "14px" }}>▲</button>}
                      {i < budget.length - 1 && <button onClick={async () => { const nb = [...budget]; [nb[i], nb[i + 1]] = [nb[i + 1], nb[i]]; await onUpd(sel.id, { budget: nb }); }} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 3, cursor: "pointer", fontSize: 9, padding: "0px 4px", color: colors.g5, lineHeight: "14px" }}>▼</button>}
                    </div>
                  </td>}
                  <td style={{ padding: "6px 8px", fontWeight: 600, color: colors.nv }}>{budEdit
                    ? <input value={r.rubro || ""} onChange={e => { const nb = [...budget]; nb[i] = { ...nb[i], rubro: e.target.value }; onUpd(sel.id, { budget: nb }); }} style={{ ...iS, padding: "4px 6px", fontWeight: 600 }} />
                    : r.rubro}</td>
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
                  {budEdit && <td style={{ padding: "4px 2px" }}><button onClick={async () => { const nb = budget.filter((_: any, ii: number) => ii !== i); await onUpd(sel.id, { budget: nb }); }} style={{ background: "#FEE2E2", border: "1px solid #DC262640", borderRadius: 4, cursor: "pointer", fontSize: 10, padding: "1px 5px", color: "#DC2626" }}>✕</button></td>}
                </tr>))}
                <tr style={{ fontWeight: 800, borderTop: "2px solid " + colors.g3 }}>
                  {budEdit && <td></td>}
                  <td style={{ padding: "8px 8px", color: colors.nv }}>TOTAL</td>
                  <td style={{ padding: "8px 8px", textAlign: "right", color: colors.nv }}>${budgetTotal.toLocaleString()}</td>
                  <td style={{ padding: "8px 8px", textAlign: "right", color: budgetReal > budgetTotal ? "#DC2626" : "#10B981" }}>${budgetReal.toLocaleString()}</td>
                  <td style={{ padding: "8px 8px", fontSize: 10, color: colors.g4 }}>{budgetTotal > 0 ? Math.round(budgetReal / budgetTotal * 100) + "% ejecutado" : ""}</td>
                  {budEdit && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>
          {budEdit && <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <input style={{ ...iS, flex: 1, padding: "6px 10px" }} placeholder="Nombre del rubro..." value={newRubro} onChange={e => sNewRubro(e.target.value)} onKeyDown={async e => {
              if (e.key === "Enter" && newRubro.trim()) {
                const nb = [...budget, { rubro: newRubro.trim(), estimado: 0, real: 0, notas: "" }];
                await onUpd(sel.id, { budget: nb }); sNewRubro("");
              }
            }} />
            <Btn v="p" s="s" onClick={async () => {
              if (!newRubro.trim()) return;
              const nb = [...budget, { rubro: newRubro.trim(), estimado: 0, real: 0, notas: "" }];
              await onUpd(sel.id, { budget: nb }); sNewRubro("");
            }}>+ Rubro</Btn>
          </div>}
        </div>}
      </Card>
    </div>}

    {/* ── TAB: COMUNICACIÓN ── */}
    {tab === "comunicacion" && <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>📣 Pedidos de Comunicación ({torneoComm.length})</div>
        <Btn v="p" s="s" onClick={() => sCommForm({ descripcion: "", piezas: "", fecha_pub: "" })}>+ Pedido Comunicación</Btn>
      </div>

      {/* Inline form */}
      {commForm && <Card style={{ padding: mob ? 14 : 16, marginBottom: 12, border: "2px solid #8B5CF630" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6", marginBottom: 8 }}>Nuevo pedido de comunicación</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>
          <div><label style={lbl}>Piezas *</label><input style={iS} value={commForm.piezas || ""} onChange={e => sCommForm({ ...commForm, piezas: e.target.value })} placeholder="Ej: Flyer + Post Instagram" /></div>
          <div><label style={lbl}>Fecha publicación</label><input type="date" style={iS} value={commForm.fecha_pub || ""} onChange={e => sCommForm({ ...commForm, fecha_pub: e.target.value })} /></div>
        </div>
        <div style={{ marginTop: 8 }}><label style={lbl}>Descripción *</label><textarea style={{ ...iS, minHeight: 60 }} value={commForm.descripcion || ""} onChange={e => sCommForm({ ...commForm, descripcion: e.target.value })} placeholder="Detalle lo que necesitás: contenido, estilo, referencias..." /></div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <Btn v="p" s="s" onClick={async () => {
            if (!commForm.piezas?.trim() || !commForm.descripcion?.trim()) return;
            const leo = users.find((u: any) => (u.a || "").toLowerCase() === "sturniolo" && (u.n || "").toLowerCase().startsWith("lea"));
            const asTo = leo?.id || null;
            const ts = TODAY + " " + new Date().toTimeString().slice(0, 5);
            await onAddComm({
              div: "", cId: user.id, cN: fn(user), dId: 3, tipo: "Comunicación",
              tit: "Pedido Comunicación: " + commForm.piezas.trim(),
              desc: "Torneo: " + sel.name + "\nPiezas: " + commForm.piezas.trim() + "\n\n" + commForm.descripcion.trim(),
              fReq: commForm.fecha_pub || "", urg: "Normal",
              st: asTo ? ST.C : ST.P, asTo, rG: false, eOk: null, resp: "", cAt: TODAY, monto: null,
              torneo_id: sel.id,
              log: [
                { dt: ts, uid: user.id, by: fn(user), act: "Creó pedido de comunicación desde torneo " + sel.name, t: "sys" },
                ...(asTo ? [{ dt: ts, uid: user.id, by: fn(user), act: "Asignó a " + fn(leo), t: "sys" }] : []),
              ],
            });
            sCommForm(null);
          }}>Crear pedido</Btn>
          <Btn v="g" s="s" onClick={() => sCommForm(null)}>Cancelar</Btn>
        </div>
      </Card>}

      {torneoComm.length === 0 && !commForm && <Card style={{ textAlign: "center", padding: 30 }}><div style={{ fontSize: 12, color: colors.g4 }}>No hay pedidos de comunicación para este torneo</div></Card>}
      {torneoComm.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {torneoComm.map((t: any) => {
          const tSt = SC[t.st] || SC[ST.P];
          const assignee = t.asTo ? users.find((u: any) => u.id === t.asTo) : null;
          return (<Card key={t.id} style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{t.tit || t.desc}</div>
                {t.desc && t.tit && <div style={{ fontSize: 11, color: colors.g5, marginTop: 2, whiteSpace: "pre-line" }}>{t.desc.slice(0, 120)}{t.desc.length > 120 ? "…" : ""}</div>}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: tSt.c, background: tSt.bg, padding: "2px 8px", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0 }}>{tSt.i} {tSt.l}</span>
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 10, color: colors.g4, marginTop: 6, flexWrap: "wrap" }}>
              {assignee && <span>👤 {fn(assignee)}</span>}
              {t.fReq && <span>📅 {fmtDate(t.fReq)}</span>}
              <span>#{t.id}</span>
            </div>
          </Card>);
        })}
      </div>}
    </div>}
  </div>);
}
