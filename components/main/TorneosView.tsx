"use client";
import { useState, useMemo, useRef, useCallback, useEffect, Fragment } from "react";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import { TN_ST, TN_HITOS_TEMPLATE, TN_CHECKLIST, TN_BUDGET_RUBROS, newBudgetRubro, newBudgetItem, PST, PSC, ST, SC, MONEDAS, fn } from "@/lib/constants";
import { exportBudgetXLSX, parseBudgetXLSX } from "@/lib/export";
import { Btn, Card, PBadge, FileField } from "@/components/ui";
import { MentionInput } from "@/components/MentionInput";

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
  const provs = useDataStore(s => s.provs);

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
  const [expandedRubros, sExpandedRubros] = useState<Set<number>>(new Set());
  const [newItemName, sNewItemName] = useState<Record<number, string>>({});
  const [newSubText, sNewSubText] = useState<string>("");
  const [newSubTarget, sNewSubTarget] = useState<{ ri: number; ii: number } | null>(null);
  const [budImport, sBudImport] = useState<{ budget: any[]; warnings: string[] } | null>(null);
  const budFileRef = useRef<HTMLInputElement>(null);
  const toggleRubro = (i: number) => sExpandedRubros(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const rubroEst = (r: any): number => r.items?.length ? r.items.reduce((s: number, it: any) => s + Number(it.estimado || 0), 0) : Number(r.estimado || 0);
  const rubroReal = (r: any): number => r.items?.length ? r.items.reduce((s: number, it: any) => s + Number(it.real || 0), 0) : Number(r.real || 0);
  const [presuForm, sPresuForm] = useState<any | null>(null);
  const [provSearch, sProvSearch] = useState("");
  const [commForm, sCommForm] = useState<any | null>(null);
  const [budgetLocal, sBudgetLocal] = useState<any[] | null>(null);
  const budDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveBudget = useCallback((id: number, nb: any[]) => {
    sBudgetLocal(nb);
    if (budDebounce.current) clearTimeout(budDebounce.current);
    budDebounce.current = setTimeout(() => { onUpd(id, { budget: nb }); }, 600);
  }, [onUpd]);

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
          return (<Card key={t.id} style={{ cursor: "pointer", padding: mob ? 16 : 14 }} onClick={() => { sSelId(t.id); sTab("resumen"); sMode("detail"); sBudgetLocal(null); }}>
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
          <div><label style={lbl}>Notas</label><MentionInput users={users} style={{ ...iS, minHeight: 60 }} value={form.notes || ""} onChange={v => sForm({ ...form, notes: v })} /></div>
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

  const saveChecklist = (sections: typeof clSections) => {
    onUpd(sel.id, { checklist: { sections } });
  };

  // Budget (JSON planning estimates)
  const budget: any[] = budgetLocal ?? (Array.isArray(sel.budget) ? sel.budget : []);
  const budgetTotal = budget.reduce((s: number, r: any) => s + rubroEst(r), 0);
  const budgetReal = budget.reduce((s: number, r: any) => s + rubroReal(r), 0);

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
        <div style={{ marginTop: 8 }}><label style={lbl}>Notas</label><MentionInput users={users} style={{ ...iS, minHeight: 40 }} value={clubForm.notes || ""} onChange={v => sClubForm({ ...clubForm, notes: v })} /></div>
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
      {/* Summary badges — same as PresView */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {Object.keys(PSC).map(k => { const cnt = torneoPresu.filter((pr: any) => pr.status === k).length; return <span key={k} style={{ padding: "3px 10px", borderRadius: 14, background: cardBg, border: "1px solid " + colors.g3, fontSize: 10, fontWeight: 600, color: PSC[k].c }}>{PSC[k].i} {cnt}</span>; })}
      </div>

      {/* Header + button — same v="pu" as PresView */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>💰 Presupuestos</div>
        <Btn v="pu" s="s" onClick={() => { sPresuForm({ prov_id: "", prov_nombre: "", prov_contacto: "", descripcion: "", monto: "", moneda: "ARS", archivo_url: "", notas: "" }); sProvSearch(""); }}>+ Nuevo Presupuesto</Btn>
      </div>

      {/* Form — replicates PresView form exactly */}
      {presuForm && <Card style={{ marginBottom: 14, background: "#F5F3FF", border: "1px solid " + colors.pr + "33" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div style={{ fontSize: 12, fontWeight: 700, color: colors.pr }}>➕ Nuevo presupuesto</div><button onClick={() => sPresuForm(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: colors.g4 }}>✕</button></div>
        <div style={{ marginBottom: 8 }}><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Proveedor *</label>
          <input value={provSearch} onChange={e => { sProvSearch(e.target.value); sPresuForm({ ...presuForm, prov_nombre: e.target.value, prov_id: "" }); }} placeholder="Buscar o escribir proveedor..." style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} />
          {provSearch && provs.filter((pv: any) => pv.nombre.toLowerCase().includes(provSearch.toLowerCase())).length > 0 && <div style={{ border: "1px solid " + colors.g3, borderRadius: 8, marginTop: 2, maxHeight: 100, overflowY: "auto" as const, background: cardBg }}>
            {provs.filter((pv: any) => pv.nombre.toLowerCase().includes(provSearch.toLowerCase())).map((pv: any) => <div key={pv.id} onClick={() => { sPresuForm({ ...presuForm, prov_id: String(pv.id), prov_nombre: pv.nombre, prov_contacto: pv.contacto || pv.telefono || pv.email }); sProvSearch(pv.nombre); }} style={{ padding: "6px 10px", fontSize: 11, cursor: "pointer", borderBottom: "1px solid " + colors.g1 }}>{pv.nombre} <span style={{ color: colors.g4 }}>({pv.rubro})</span></div>)}
          </div>}
        </div>
        <div style={{ marginBottom: 8 }}><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Contacto proveedor</label><input value={presuForm.prov_contacto || ""} onChange={e => sPresuForm({ ...presuForm, prov_contacto: e.target.value })} style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
        <div style={{ marginBottom: 8 }}><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Descripción</label><MentionInput users={users} value={presuForm.descripcion || ""} onChange={v => sPresuForm({ ...presuForm, descripcion: v })} rows={2} style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, resize: "vertical" as const, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8, marginBottom: 8 }}>
          <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Monto ($) *</label><input type="number" value={presuForm.monto || ""} onChange={e => sPresuForm({ ...presuForm, monto: e.target.value })} style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
          <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Moneda</label><select value={presuForm.moneda || "ARS"} onChange={e => sPresuForm({ ...presuForm, moneda: e.target.value })} style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, marginTop: 2 }}>{MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
        </div>
        <div style={{ marginBottom: 8 }}><FileField value={presuForm.archivo_url || ""} onChange={(url: string) => sPresuForm({ ...presuForm, archivo_url: url })} folder="presupuestos" /></div>
        <div style={{ marginBottom: 8 }}><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Notas</label><input value={presuForm.notas || ""} onChange={e => sPresuForm({ ...presuForm, notas: e.target.value })} style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}><Btn v="g" s="s" onClick={() => sPresuForm(null)}>Cancelar</Btn><Btn v="pu" s="s" disabled={!presuForm.prov_nombre || !presuForm.monto} onClick={async () => {
          await onAddPresu({ proveedor_id: presuForm.prov_id ? Number(presuForm.prov_id) : null, proveedor_nombre: presuForm.prov_nombre, proveedor_contacto: presuForm.prov_contacto || "", descripcion: presuForm.descripcion || "", monto: Number(presuForm.monto), moneda: presuForm.moneda || "ARS", archivo_url: presuForm.archivo_url || "", notas: presuForm.notas || "", torneo_id: sel.id, status: PST.SOL, solicitado_por: fn(user), solicitado_at: TODAY });
          sPresuForm(null); sProvSearch("");
        }}>💰 Cargar presupuesto</Btn></div>
      </Card>}

      {/* List — same Card+borderLeft+PBadge layout as PresView */}
      {torneoPresu.length === 0 && !presuForm && <Card style={{ textAlign: "center" as const, padding: 24, color: colors.g4 }}><span style={{ fontSize: 24 }}>📭</span><div style={{ marginTop: 6, fontSize: 12 }}>Sin presupuestos para este torneo</div></Card>}
      {torneoPresu.map((pr: any) => (
        <Card key={pr.id} style={{ padding: "10px 14px", marginBottom: 6, borderLeft: "3px solid " + (PSC[pr.status]?.c || colors.g3) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>{pr.proveedor_nombre || "Sin proveedor"}</div><div style={{ fontSize: 10, color: colors.g4 }}>{pr.descripcion}</div></div>
            <div style={{ textAlign: "right" as const }}><div style={{ fontSize: 14, fontWeight: 800, color: pr.status === PST.APR ? colors.gn : colors.nv }}>${Number(pr.monto).toLocaleString()}</div><PBadge s={pr.status} sm /></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 10, color: colors.g5 }}>{pr.solicitado_at && <span>📤 {fmtDate(pr.solicitado_at)}</span>}{pr.archivo_url && <span style={{ color: colors.bl }}>📎</span>}{pr.moneda !== "ARS" && <span>{pr.moneda}</span>}</div>
        </Card>
      ))}

      {/* Budget planning (JSON estimates) */}
      <Card style={{ padding: mob ? 14 : 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>📋 Planificación estimativa</div>
          <div style={{ display: "flex", gap: 6 }}>
            {budget.length === 0 && <Btn v="p" s="s" onClick={async () => {
              const initial = TN_BUDGET_RUBROS.map(r => newBudgetRubro(r));
              await onUpd(sel.id, { budget: initial });
            }}>Cargar template</Btn>}
            {budget.length > 0 && <Btn v="g" s="s" onClick={() => exportBudgetXLSX(sel.name || "Torneo", budget)}>📥 Excel</Btn>}
            <Btn v="g" s="s" onClick={() => budFileRef.current?.click()}>📤 Importar</Btn>
            <input ref={budFileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
              try { const res = await parseBudgetXLSX(f); sBudImport(res); } catch (err: any) { alert("Error: " + err.message); }
            }} />
            {budget.length > 0 && <Btn v="g" s="s" onClick={() => sBudEdit(!budEdit)}>{budEdit ? "Listo" : "Editar"}</Btn>}
          </div>
        </div>
        {/* Import preview modal */}
        {budImport && <Card style={{ padding: 16, marginBottom: 12, border: "2px solid #3B82F630" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6", marginBottom: 8 }}>📤 Preview de importación ({budImport.budget.length} rubros)</div>
          {budImport.warnings.length > 0 && <div style={{ fontSize: 11, color: "#F59E0B", marginBottom: 8, padding: "6px 8px", background: "#FEF3C7", borderRadius: 6 }}>⚠️ {budImport.warnings.join(" · ")}</div>}
          <div style={{ overflowX: "auto", maxHeight: 300, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ borderBottom: "2px solid " + colors.g2 }}>
                <th style={{ textAlign: "left", padding: "4px 6px", fontSize: 10, color: colors.g5 }}>Rubro</th>
                <th style={{ textAlign: "left", padding: "4px 6px", fontSize: 10, color: colors.g5 }}>Item</th>
                <th style={{ textAlign: "right", padding: "4px 6px", fontSize: 10, color: colors.g5 }}>Estimado</th>
                <th style={{ textAlign: "right", padding: "4px 6px", fontSize: 10, color: colors.g5 }}>Real</th>
              </tr></thead>
              <tbody>{budImport.budget.map((r: any, i: number) => (
                <Fragment key={i}>
                  <tr style={{ borderBottom: "1px solid " + colors.g2, background: isDark ? "#1a2236" : "#F8FAFC" }}>
                    <td style={{ padding: "4px 6px", fontWeight: 700 }}>{r.rubro}</td>
                    <td></td>
                    <td style={{ padding: "4px 6px", textAlign: "right" }}>${(r.items?.length ? r.items.reduce((s: number, it: any) => s + Number(it.estimado || 0), 0) : Number(r.estimado || 0)).toLocaleString()}</td>
                    <td style={{ padding: "4px 6px", textAlign: "right" }}>${(r.items?.length ? r.items.reduce((s: number, it: any) => s + Number(it.real || 0), 0) : Number(r.real || 0)).toLocaleString()}</td>
                  </tr>
                  {(r.items || []).map((it: any, j: number) => (
                    <tr key={`${i}-${j}`} style={{ borderBottom: "1px solid " + colors.g2 }}>
                      <td></td>
                      <td style={{ padding: "3px 6px 3px 16px", color: colors.g5 }}>{it.nombre}{it.subs?.length ? ` (${it.subs.length} sub)` : ""}</td>
                      <td style={{ padding: "3px 6px", textAlign: "right" }}>${Number(it.estimado || 0).toLocaleString()}</td>
                      <td style={{ padding: "3px 6px", textAlign: "right" }}>${Number(it.real || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
            <Btn v="g" s="s" onClick={() => sBudImport(null)}>Cancelar</Btn>
            {budget.length > 0 && <Btn v="w" s="s" onClick={async () => { await onUpd(sel.id, { budget: budImport.budget }); sBudgetLocal(null); sBudImport(null); }}>Reemplazar todo</Btn>}
            <Btn v="p" s="s" onClick={async () => {
              const merged = budget.length > 0
                ? [...budget, ...budImport.budget.filter((nr: any) => !budget.some((er: any) => er.rubro === nr.rubro))]
                : budImport.budget;
              await onUpd(sel.id, { budget: merged }); sBudgetLocal(null); sBudImport(null);
            }}>{budget.length > 0 ? "Agregar nuevos rubros" : "Importar"}</Btn>
          </div>
        </Card>}
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
                {budget.map((r: any, i: number) => {
                  const exp = expandedRubros.has(i);
                  const hasItems = r.items?.length > 0;
                  const rEst = rubroEst(r);
                  const rReal = rubroReal(r);
                  return (<Fragment key={i}>
                    {/* ── RUBRO ROW ── */}
                    <tr style={{ borderBottom: "1px solid " + colors.g2, background: hasItems && exp ? (isDark ? "#1a2236" : "#F8FAFC") : undefined }}>
                      {budEdit && <td style={{ padding: "4px 4px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {i > 0 && <button onClick={async () => { const nb = [...budget]; [nb[i - 1], nb[i]] = [nb[i], nb[i - 1]]; await onUpd(sel.id, { budget: nb }); }} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 3, cursor: "pointer", fontSize: 9, padding: "0px 4px", color: colors.g5, lineHeight: "14px" }}>▲</button>}
                          {i < budget.length - 1 && <button onClick={async () => { const nb = [...budget]; [nb[i], nb[i + 1]] = [nb[i + 1], nb[i]]; await onUpd(sel.id, { budget: nb }); }} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 3, cursor: "pointer", fontSize: 9, padding: "0px 4px", color: colors.g5, lineHeight: "14px" }}>▼</button>}
                        </div>
                      </td>}
                      <td style={{ padding: "6px 8px", fontWeight: 600, color: colors.nv }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button onClick={() => toggleRubro(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: colors.g5, padding: 0, lineHeight: 1 }}>{exp ? "▼" : "▶"}</button>
                          {budEdit
                            ? <input value={r.rubro || ""} onChange={e => { const nb = [...budget]; nb[i] = { ...nb[i], rubro: e.target.value }; saveBudget(sel.id, nb); }} style={{ ...iS, padding: "4px 6px", fontWeight: 600 }} />
                            : r.rubro}
                        </div>
                      </td>
                      <td style={{ padding: "4px 4px", textAlign: "right" }}>
                        {hasItems
                          ? <span style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>${rEst.toLocaleString()}</span>
                          : <input type="number" value={r.estimado || ""} placeholder="0" onChange={e => { const nb = [...budget]; nb[i] = { ...nb[i], estimado: Number(e.target.value) || 0 }; saveBudget(sel.id, nb); }} style={{ ...iS, width: 90, textAlign: "right", padding: "4px 6px" }} />}
                      </td>
                      <td style={{ padding: "4px 4px", textAlign: "right" }}>
                        {hasItems
                          ? <span style={{ fontSize: 11, fontWeight: 600, color: rReal > rEst ? "#DC2626" : "#10B981" }}>${rReal.toLocaleString()}</span>
                          : <input type="number" value={r.real || ""} placeholder="0" onChange={e => { const nb = [...budget]; nb[i] = { ...nb[i], real: Number(e.target.value) || 0 }; saveBudget(sel.id, nb); }} style={{ ...iS, width: 90, textAlign: "right", padding: "4px 6px" }} />}
                      </td>
                      <td style={{ padding: "4px 4px" }}>
                        <input value={r.notas || ""} onChange={e => { const nb = [...budget]; nb[i] = { ...nb[i], notas: e.target.value }; saveBudget(sel.id, nb); }} style={{ ...iS, padding: "4px 6px" }} />
                      </td>
                      {budEdit && <td style={{ padding: "4px 2px" }}><button onClick={async () => { const nb = budget.filter((_: any, ii: number) => ii !== i); await onUpd(sel.id, { budget: nb }); }} style={{ background: "#FEE2E2", border: "1px solid #DC262640", borderRadius: 4, cursor: "pointer", fontSize: 10, padding: "1px 5px", color: "#DC2626" }}>✕</button></td>}
                    </tr>

                    {/* ── ITEM ROWS (expanded) ── */}
                    {exp && (r.items || []).map((it: any, j: number) => (
                      <Fragment key={`${i}-${j}`}>
                        <tr style={{ borderBottom: "1px solid " + colors.g2, background: isDark ? "#111827" : "#FAFBFD" }}>
                          {budEdit && <td></td>}
                          <td style={{ padding: "4px 8px 4px 32px", color: colors.g5, fontSize: 11 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              {it.subs?.length > 0 && <span style={{ fontSize: 8, color: colors.g4 }}>●</span>}
                              {budEdit
                                ? <input value={it.nombre || ""} onChange={e => { const nb = [...budget]; const items = [...(nb[i].items || [])]; items[j] = { ...items[j], nombre: e.target.value }; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); }} style={{ ...iS, padding: "3px 5px", fontSize: 11 }} />
                                : it.nombre}
                            </div>
                          </td>
                          <td style={{ padding: "3px 4px", textAlign: "right" }}>
                            <input type="number" value={it.estimado || ""} placeholder="0" onChange={e => { const nb = [...budget]; const items = [...(nb[i].items || [])]; items[j] = { ...items[j], estimado: Number(e.target.value) || 0 }; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); }} style={{ ...iS, width: 80, textAlign: "right", padding: "3px 5px", fontSize: 11 }} />
                          </td>
                          <td style={{ padding: "3px 4px", textAlign: "right" }}>
                            <input type="number" value={it.real || ""} placeholder="0" onChange={e => { const nb = [...budget]; const items = [...(nb[i].items || [])]; items[j] = { ...items[j], real: Number(e.target.value) || 0 }; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); }} style={{ ...iS, width: 80, textAlign: "right", padding: "3px 5px", fontSize: 11 }} />
                          </td>
                          <td style={{ padding: "3px 4px" }}>
                            <input value={it.notas || ""} onChange={e => { const nb = [...budget]; const items = [...(nb[i].items || [])]; items[j] = { ...items[j], notas: e.target.value }; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); }} style={{ ...iS, padding: "3px 5px", fontSize: 11 }} />
                          </td>
                          {budEdit && <td style={{ padding: "3px 2px" }}><button onClick={() => { const nb = [...budget]; const items = (nb[i].items || []).filter((_: any, jj: number) => jj !== j); nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); }} style={{ background: "#FEE2E2", border: "1px solid #DC262640", borderRadius: 4, cursor: "pointer", fontSize: 9, padding: "0px 4px", color: "#DC2626" }}>✕</button></td>}
                        </tr>

                        {/* ── SUBITEM ROWS ── */}
                        {(it.subs || []).map((sub: string, k: number) => (
                          <tr key={`${i}-${j}-${k}`} style={{ borderBottom: "1px dotted " + colors.g2 }}>
                            {budEdit && <td></td>}
                            <td colSpan={4} style={{ padding: "2px 8px 2px 52px", fontSize: 10, color: colors.g4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span>•</span>
                                {budEdit
                                  ? <><input value={sub} onChange={e => { const nb = [...budget]; const items = [...(nb[i].items || [])]; const subs = [...(items[j].subs || [])]; subs[k] = e.target.value; items[j] = { ...items[j], subs }; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); }} style={{ ...iS, padding: "2px 4px", fontSize: 10, flex: 1 }} />
                                    <button onClick={() => { const nb = [...budget]; const items = [...(nb[i].items || [])]; const subs = (items[j].subs || []).filter((_: any, kk: number) => kk !== k); items[j] = { ...items[j], subs }; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, color: "#DC2626", padding: 0 }}>✕</button></>
                                  : sub}
                              </div>
                            </td>
                            {budEdit && <td></td>}
                          </tr>
                        ))}

                        {/* Add subitem inline */}
                        {budEdit && newSubTarget?.ri === i && newSubTarget?.ii === j && (
                          <tr>
                            <td></td>
                            <td colSpan={4} style={{ padding: "2px 8px 2px 52px" }}>
                              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                <span style={{ fontSize: 10, color: colors.g4 }}>•</span>
                                <input autoFocus value={newSubText} onChange={e => sNewSubText(e.target.value)} onKeyDown={e => {
                                  if (e.key === "Enter" && newSubText.trim()) { const nb = [...budget]; const items = [...(nb[i].items || [])]; const subs = [...(items[j].subs || []), newSubText.trim()]; items[j] = { ...items[j], subs }; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); sNewSubText(""); }
                                  if (e.key === "Escape") { sNewSubTarget(null); sNewSubText(""); }
                                }} placeholder="Detalle..." style={{ ...iS, padding: "2px 4px", fontSize: 10, flex: 1 }} />
                                <button onClick={() => { if (!newSubText.trim()) return; const nb = [...budget]; const items = [...(nb[i].items || [])]; const subs = [...(items[j].subs || []), newSubText.trim()]; items[j] = { ...items[j], subs }; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); sNewSubText(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: colors.bl, fontWeight: 700 }}>✓</button>
                                <button onClick={() => { sNewSubTarget(null); sNewSubText(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: colors.g4 }}>✕</button>
                              </div>
                            </td>
                            <td></td>
                          </tr>
                        )}

                        {/* + Subitem button */}
                        {budEdit && !(newSubTarget?.ri === i && newSubTarget?.ii === j) && (
                          <tr>
                            <td></td>
                            <td colSpan={4} style={{ padding: "1px 8px 1px 52px" }}>
                              <button onClick={() => { sNewSubTarget({ ri: i, ii: j }); sNewSubText(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, color: colors.bl, padding: 0, fontWeight: 600 }}>+ subitem</button>
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </Fragment>
                    ))}

                    {/* ── ADD ITEM ROW (expanded + editing) ── */}
                    {exp && budEdit && (
                      <tr style={{ borderBottom: "1px solid " + colors.g2 }}>
                        <td></td>
                        <td colSpan={4} style={{ padding: "4px 8px 4px 32px" }}>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <input value={newItemName[i] || ""} onChange={e => sNewItemName(p => ({ ...p, [i]: e.target.value }))} onKeyDown={e => {
                              if (e.key === "Enter" && (newItemName[i] || "").trim()) {
                                const nb = [...budget]; const items = [...(nb[i].items || []), newBudgetItem((newItemName[i] || "").trim())]; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); sNewItemName(p => ({ ...p, [i]: "" }));
                              }
                            }} placeholder="Nombre del item..." style={{ ...iS, padding: "3px 5px", fontSize: 11, flex: 1 }} />
                            <button onClick={() => { if (!(newItemName[i] || "").trim()) return; const nb = [...budget]; const items = [...(nb[i].items || []), newBudgetItem((newItemName[i] || "").trim())]; nb[i] = { ...nb[i], items }; saveBudget(sel.id, nb); sNewItemName(p => ({ ...p, [i]: "" })); }} style={{ background: "none", border: "1px solid " + colors.bl, borderRadius: 4, cursor: "pointer", fontSize: 10, padding: "2px 8px", color: colors.bl, fontWeight: 700 }}>+ Item</button>
                          </div>
                        </td>
                        <td></td>
                      </tr>
                    )}

                    {/* Show item count when collapsed */}
                    {!exp && hasItems && (
                      <tr>
                        {budEdit && <td></td>}
                        <td colSpan={budEdit ? 4 : 4} style={{ padding: "0 8px 4px 32px" }}>
                          <span style={{ fontSize: 9, color: colors.g4 }}>{r.items.length} item{r.items.length > 1 ? "s" : ""}</span>
                        </td>
                        {budEdit && <td></td>}
                      </tr>
                    )}
                  </Fragment>);
                })}
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
                const nb = [...budget, newBudgetRubro(newRubro.trim())];
                await onUpd(sel.id, { budget: nb }); sNewRubro("");
              }
            }} />
            <Btn v="p" s="s" onClick={async () => {
              if (!newRubro.trim()) return;
              const nb = [...budget, newBudgetRubro(newRubro.trim())];
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
        <div style={{ marginTop: 8 }}><label style={lbl}>Descripción *</label><MentionInput users={users} style={{ ...iS, minHeight: 60 }} value={commForm.descripcion || ""} onChange={v => sCommForm({ ...commForm, descripcion: v })} placeholder="Detalle lo que necesitás: contenido, estilo, referencias..." /></div>
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
