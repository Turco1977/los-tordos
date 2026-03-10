"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { BST, BSC, DEPTOS } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { Card, Btn } from "@/components/ui";

const TODAY = new Date().toISOString().slice(0, 10);
const DEPORTES = ["Hockey", "Rugby"];
const INGRESOS = ["Menos de $200.000", "$200.000 - $400.000", "$400.000 - $600.000", "Mas de $600.000"];
const SIN_BECA_OPTS = ["Continuaria practicando", "Abandonaria el deporte"];
const STATUS_KEYS = Object.keys(BSC) as string[];

const emptyForm = () => ({
  nombre_completo: "", email: "", fecha_nac: "", edad: "", dni: "",
  direccion: "", tutor: "", ocupacion_tutor: "", integrantes_hogar: "",
  ingreso_mensual: "", telefono: "", institucion_educativa: "", grado_anio: "", deporte: "Hockey",
  categoria: "", anios_practicando: "", entrenador: "",
  motivacion: "", sin_beca: "", estado: BST.NUE,
});

export function BecasView({ user, mob, showT, becas, onAdd, onUpd, onDel, onVote, users }: any) {
  const { colors, isDark, cardBg } = useC();
  const [showForm, sShowForm] = useState(false);
  const [form, sForm] = useState<any>(emptyForm());
  const [editId, sEditId] = useState<number | null>(null);
  const [selId, sSelId] = useState<number | null>(null);
  const [fEstado, sFEstado] = useState("all");
  const [fDeporte, sFDeporte] = useState("all");
  const [confirmDel, sConfirmDel] = useState<number | null>(null);

  const list = becas || [];

  /* ── canVote check: CD+SE members can vote on becas, quorum 3 ── */
  const isSA = user.role === "superadmin" || user.role === "admin";
  const userAreaIds = user.dId ? DEPTOS.filter((d: any) => d.id === user.dId).map((d: any) => d.aId) : [];
  const canVoteSe = isSA || userAreaIds.includes(100) || userAreaIds.includes(101);
  const pendingVotes = list.filter((b: any) => b.estado === BST.DEL && canVoteSe && !(b.votos || []).some((v: any) => v.userId === user.id));

  /* ── KPIs ── */
  const kTotal = list.length;
  const kAprobadas = list.filter((b: any) => b.estado === BST.APR).length;
  const kPendientes = list.filter((b: any) => b.estado === BST.NUE || b.estado === BST.EVA).length;
  const kDelib = list.filter((b: any) => b.estado === BST.DEL || b.estado === BST.PROP).length;

  /* ── Filtered list ── */
  const vis = useMemo(() => {
    let r = [...list];
    if (fEstado !== "all") r = r.filter((b: any) => b.estado === fEstado);
    if (fDeporte !== "all") r = r.filter((b: any) => b.deporte === fDeporte);
    return r.sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));
  }, [list, fEstado, fDeporte]);

  const sel = selId ? list.find((b: any) => b.id === selId) : null;

  /* ── Form helpers ── */
  const openAdd = () => { sEditId(null); sForm(emptyForm()); sShowForm(true); sSelId(null); };
  const openEdit = (b: any) => {
    sEditId(b.id); sSelId(null);
    sForm({
      nombre_completo: b.nombre_completo || "", email: b.email || "",
      fecha_nac: b.fecha_nac || "", edad: b.edad || "",
      dni: b.dni || "", direccion: b.direccion || "",
      tutor: b.tutor || "", ocupacion_tutor: b.ocupacion_tutor || "",
      integrantes_hogar: b.integrantes_hogar || "", ingreso_mensual: b.ingreso_mensual || "",
      telefono: b.telefono || "", institucion_educativa: b.institucion_educativa || "", grado_anio: b.grado_anio || "",
      deporte: b.deporte || "Hockey", categoria: b.categoria || "",
      anios_practicando: b.anios_practicando || "", entrenador: b.entrenador || "",
      motivacion: b.motivacion || "", sin_beca: b.sin_beca || "",
      estado: b.estado || BST.NUE,
    });
    sShowForm(true);
  };
  const closeForm = () => { sShowForm(false); sEditId(null); sForm(emptyForm()); };
  const save = () => {
    if (!form.nombre_completo.trim()) return;
    const payload = {
      ...form,
      nombre_completo: form.nombre_completo.trim(),
      fecha_nac: form.fecha_nac || null,
      edad: form.edad ? Number(form.edad) : null,
      integrantes_hogar: form.integrantes_hogar ? Number(form.integrantes_hogar) : null,
      anios_practicando: form.anios_practicando ? Number(form.anios_practicando) : null,
    };
    if (editId) onUpd(editId, payload); else onAdd(payload);
    closeForm();
  };

  /* ── Styles ── */
  const iS: any = { width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, background: cardBg, color: colors.nv };
  const lS: any = { fontSize: 10, fontWeight: 600, color: colors.g5, marginBottom: 3, display: "block" };
  const selS: any = { ...iS, appearance: "none" as const, WebkitAppearance: "none" as const, cursor: "pointer", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238B95A5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28 };

  const borderColorFor = (estado: string) => BSC[estado]?.c || colors.g3;

  /* ── KPI bar ── */
  const kpis = [
    { l: "Total solicitudes", v: kTotal, i: "\uD83D\uDCCA", c: colors.nv },
    { l: "Aprobadas", v: kAprobadas, i: "\u2705", c: "#10B981" },
    { l: "Pendientes evaluacion", v: kPendientes, i: "\uD83D\uDFE3", c: "#8B5CF6" },
    { l: "En deliberacion CD", v: kDelib, i: "\uD83D\uDD35", c: "#3B82F6" },
  ];

  /* ── Detail view ── */
  const renderDetail = () => {
    if (!sel) return null;
    const st = BSC[sel.estado] || BSC[BST.NUE];
    const riesgo = (sel.sin_beca || "").toLowerCase().includes("abandonar");
    return (
      <div>
        <button onClick={() => sSelId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.bl, fontWeight: 600, marginBottom: 10, padding: 0 }}>{"\u2190"} Volver al listado</button>
        <Card style={{ padding: mob ? 14 : 20, borderLeft: "4px solid " + st.c }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap" as const, gap: 10 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ margin: 0, fontSize: mob ? 16 : 19, fontWeight: 800, color: colors.nv }}>{sel.nombre_completo}</h3>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 6 }}>
                <span style={{ background: st.bg, color: st.c, padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{st.i} {st.l}</span>
                {riesgo && <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{"\u26A0\uFE0F"} Riesgo abandono</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <Btn v="g" s="s" onClick={() => openEdit(sel)}>{"\u270F\uFE0F"} Editar</Btn>
              <Btn v="g" s="s" onClick={() => sConfirmDel(sel.id)}>{"\uD83D\uDDD1"}</Btn>
            </div>
          </div>

          {/* Status changer */}
          <div style={{ marginTop: 14 }}>
            <label style={lS}>Cambiar estado</label>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
              {STATUS_KEYS.map(k => {
                const sc = BSC[k];
                const active = sel.estado === k;
                return <button key={k} onClick={() => { onUpd(sel.id, { estado: k }); }} style={{ padding: "4px 10px", borderRadius: 10, border: active ? "2px solid " + sc.c : "1px solid " + colors.g3, background: active ? sc.bg : "transparent", color: active ? sc.c : colors.g5, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{sc.i} {sc.l}</button>;
              })}
            </div>
          </div>

          {/* Voting panel — visible when estado = deliberacion */}
          {(() => {
            const QUORUM = 3;
            const votos = sel.votos || [];
            if (sel.estado !== BST.DEL && sel.estado !== BST.APR) return null;
            const canVote = canVoteSe && !votos.some((v: any) => v.userId === user.id) && sel.estado === BST.DEL;
            const alreadyVoted = votos.some((v: any) => v.userId === user.id);
            return <div style={{ marginTop: 14, padding: 12, borderRadius: 10, border: "1px solid " + (sel.estado === BST.APR ? "#6EE7B7" : "#FDE68A"), background: sel.estado === BST.APR ? "#ECFDF5" : "#FFFBEB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: sel.estado === BST.APR ? "#065F46" : "#92400E" }}>
                  {sel.estado === BST.APR ? "\u2705 Beca Aprobada por CD" : "\uD83D\uDDF3\uFE0F Votacion CD"}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: sel.estado === BST.APR ? "#065F46" : "#92400E" }}>{votos.length}/{QUORUM}</span>
              </div>
              <div style={{ height: 6, background: sel.estado === BST.APR ? "#A7F3D0" : "#FDE68A", borderRadius: 3, marginBottom: 8 }}>
                <div style={{ height: "100%", background: sel.estado === BST.APR ? "#10B981" : "#F59E0B", borderRadius: 3, width: Math.min(100, votos.length / QUORUM * 100) + "%", transition: "width 0.3s" }} />
              </div>
              {votos.length > 0 && <div style={{ marginBottom: 8 }}>
                {votos.map((v: any, i: number) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 11 }}>
                  <span style={{ color: "#10B981" }}>{"\u2705"}</span>
                  <span style={{ fontWeight: 600, color: colors.nv }}>{v.userName}</span>
                  <span style={{ color: colors.g4, fontSize: 10 }}>{fmtD(v.date)}</span>
                </div>)}
              </div>}
              {canVote && <Btn v="p" s="s" onClick={() => onVote(sel.id)} style={{ background: "#F59E0B", border: "none", color: "#fff" }}>{"\u2705"} Aprobar beca</Btn>}
              {alreadyVoted && sel.estado !== BST.APR && <div style={{ fontSize: 11, color: "#065F46", fontWeight: 600 }}>{"\u2705"} Ya registraste tu voto</div>}
            </div>;
          })()}

          {/* Data grid */}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginTop: 16, fontSize: 12 }}>
            {[
              { l: "Email", v: sel.email },
              { l: "DNI", v: sel.dni },
              { l: "Fecha nacimiento", v: sel.fecha_nac },
              { l: "Edad", v: sel.edad },
              { l: "Direccion", v: sel.direccion },
              { l: "Telefono", v: sel.telefono },
              { l: "Tutor", v: sel.tutor },
              { l: "Ocupacion tutor", v: sel.ocupacion_tutor },
              { l: "Personas en hogar", v: sel.integrantes_hogar },
              { l: "Ingreso mensual", v: sel.ingreso_mensual },
              { l: "Colegio/Instituto", v: sel.institucion_educativa },
              { l: "Grado/Ano", v: sel.grado_anio },
              { l: "Deporte", v: sel.deporte },
              { l: "Categoria", v: sel.categoria },
              { l: "Anos practicando", v: sel.anios_practicando },
              { l: "Entrenador", v: sel.entrenador },
              { l: "Si no obtiene beca", v: sel.sin_beca },
            ].map((f, i) => f.v ? (
              <div key={i}>
                <div style={{ fontSize: 10, fontWeight: 600, color: colors.g4 }}>{f.l}</div>
                <div style={{ color: colors.nv, fontWeight: 500 }}>{f.v}</div>
              </div>
            ) : null)}
          </div>

          {sel.motivacion && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: colors.g4, marginBottom: 4 }}>Que significa para vos practicar este deporte</div>
              <div style={{ fontSize: 12, color: colors.nv, background: isDark ? "rgba(255,255,255,.05)" : colors.g1, padding: 12, borderRadius: 8, lineHeight: 1.5, whiteSpace: "pre-wrap" as const }}>{sel.motivacion}</div>
            </div>
          )}
        </Card>

        {/* Delete confirm */}
        {confirmDel === sel.id && (
          <Card style={{ padding: 14, marginTop: 10, border: "1px solid #DC2626" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#DC2626", marginBottom: 8 }}>{"\u26A0\uFE0F"} Confirmar eliminacion de "{sel.nombre_completo}"?</div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn v="r" s="s" onClick={() => { onDel(sel.id); sSelId(null); sConfirmDel(null); }}>Eliminar</Btn>
              <Btn v="g" s="s" onClick={() => sConfirmDel(null)}>Cancelar</Btn>
            </div>
          </Card>
        )}
      </div>
    );
  };

  /* ── Form ── */
  const renderForm = () => (
    <Card style={{ padding: mob ? 14 : 18, marginBottom: 14, borderLeft: "4px solid " + colors.pr }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.nv }}>{editId ? "\u270F\uFE0F Editar Solicitud" : "\uD83C\uDF93 Nueva Solicitud de Beca"}</h3>
        <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: colors.g4 }}>{"\u2715"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 8 : 12 }}>
        {/* Nombre Completo */}
        <div style={{ gridColumn: mob ? undefined : "1 / -1" }}>
          <label style={lS}>Nombre Completo *</label>
          <input value={form.nombre_completo} onChange={e => sForm({ ...form, nombre_completo: e.target.value })} style={iS} placeholder="Nombre y apellido" />
        </div>

        <div>
          <label style={lS}>Email</label>
          <input value={form.email} onChange={e => sForm({ ...form, email: e.target.value })} style={iS} placeholder="email@ejemplo.com" type="email" />
        </div>
        <div>
          <label style={lS}>Telefono contacto</label>
          <input value={form.telefono} onChange={e => sForm({ ...form, telefono: e.target.value })} style={iS} placeholder="Ej: 261 555 1234" />
        </div>

        <div>
          <label style={lS}>Fecha de nacimiento</label>
          <input type="date" value={form.fecha_nac} onChange={e => sForm({ ...form, fecha_nac: e.target.value })} style={iS} />
        </div>
        <div>
          <label style={lS}>Edad</label>
          <input type="number" value={form.edad} onChange={e => sForm({ ...form, edad: e.target.value })} style={iS} placeholder="Ej: 15" min={0} />
        </div>

        <div>
          <label style={lS}>DNI</label>
          <input value={form.dni} onChange={e => sForm({ ...form, dni: e.target.value })} style={iS} placeholder="Ej: 45.123.456" />
        </div>
        <div>
          <label style={lS}>Direccion / Localidad</label>
          <input value={form.direccion} onChange={e => sForm({ ...form, direccion: e.target.value })} style={iS} placeholder="Calle, ciudad" />
        </div>

        <div>
          <label style={lS}>Nombre padre/madre/tutor</label>
          <input value={form.tutor} onChange={e => sForm({ ...form, tutor: e.target.value })} style={iS} placeholder="Nombre del tutor" />
        </div>
        <div>
          <label style={lS}>Ocupacion padre/madre/tutor</label>
          <input value={form.ocupacion_tutor} onChange={e => sForm({ ...form, ocupacion_tutor: e.target.value })} style={iS} placeholder="Ej: Docente" />
        </div>

        <div>
          <label style={lS}>Cant. personas en el hogar</label>
          <input type="number" value={form.integrantes_hogar} onChange={e => sForm({ ...form, integrantes_hogar: e.target.value })} style={iS} placeholder="Ej: 4" min={1} />
        </div>
        <div>
          <label style={lS}>Ingreso mensual del hogar</label>
          <select value={form.ingreso_mensual} onChange={e => sForm({ ...form, ingreso_mensual: e.target.value })} style={selS}>
            <option value="">Seleccionar...</option>
            {INGRESOS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label style={lS}>Colegio / Instituto / Universidad</label>
          <input value={form.institucion_educativa} onChange={e => sForm({ ...form, institucion_educativa: e.target.value })} style={iS} placeholder="Nombre de institucion" />
        </div>
        <div>
          <label style={lS}>Grado / Ano</label>
          <input value={form.grado_anio} onChange={e => sForm({ ...form, grado_anio: e.target.value })} style={iS} placeholder="Ej: 3er ano" />
        </div>

        <div>
          <label style={lS}>Deporte</label>
          <select value={form.deporte} onChange={e => sForm({ ...form, deporte: e.target.value })} style={selS}>
            {DEPORTES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={lS}>Categoria</label>
          <input value={form.categoria} onChange={e => sForm({ ...form, categoria: e.target.value })} style={iS} placeholder="Ej: M15, Primera" />
        </div>

        <div>
          <label style={lS}>Anos practicando</label>
          <input type="number" value={form.anios_practicando} onChange={e => sForm({ ...form, anios_practicando: e.target.value })} style={iS} placeholder="Ej: 3" min={0} />
        </div>
        <div>
          <label style={lS}>Nombre del entrenador</label>
          <input value={form.entrenador} onChange={e => sForm({ ...form, entrenador: e.target.value })} style={iS} placeholder="Nombre completo" />
        </div>

        <div style={{ gridColumn: mob ? undefined : "1 / -1" }}>
          <label style={lS}>Que significa para vos practicar este deporte</label>
          <textarea value={form.motivacion} onChange={e => sForm({ ...form, motivacion: e.target.value })} style={{ ...iS, minHeight: 70, resize: "vertical" as const }} placeholder="Contanos con tus palabras..." />
        </div>

        <div>
          <label style={lS}>Si no obtiene la beca</label>
          <select value={form.sin_beca} onChange={e => sForm({ ...form, sin_beca: e.target.value })} style={selS}>
            <option value="">Seleccionar...</option>
            {SIN_BECA_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {editId && (
          <div>
            <label style={lS}>Estado</label>
            <select value={form.estado} onChange={e => sForm({ ...form, estado: e.target.value })} style={selS}>
              {STATUS_KEYS.map(k => <option key={k} value={k}>{BSC[k].i} {BSC[k].l}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
        <Btn v="p" s="s" onClick={save} disabled={!form.nombre_completo.trim()}>{editId ? "Guardar cambios" : "\uD83C\uDF93 Crear solicitud"}</Btn>
        <Btn v="g" s="s" onClick={closeForm}>Cancelar</Btn>
      </div>
    </Card>
  );

  /* ── Card list ── */
  const renderList = () => (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
      {vis.length === 0 && (
        <Card style={{ padding: 24, textAlign: "center" as const }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{"\uD83C\uDF93"}</div>
          <div style={{ fontSize: 13, color: colors.g4, fontWeight: 500 }}>No hay solicitudes{fEstado !== "all" || fDeporte !== "all" ? " con estos filtros" : ""}</div>
        </Card>
      )}
      {vis.map((b: any) => {
        const st = BSC[b.estado] || BSC[BST.NUE];
        const riesgo = (b.sin_beca || "").toLowerCase().includes("abandonar");
        return (
          <Card key={b.id} onClick={() => sSelId(b.id)} style={{ padding: mob ? 12 : 14, cursor: "pointer", borderLeft: "4px solid " + st.c, transition: "box-shadow .15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{b.nombre_completo}</div>
                <div style={{ fontSize: 11, color: colors.g5 }}>
                  {b.deporte}{b.categoria ? " \u00B7 " + b.categoria : ""}{b.created_at ? " \u00B7 " + b.created_at.slice(0, 10) : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span style={{ background: st.bg, color: st.c, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" as const }}>{st.i} {st.l}</span>
                {riesgo && <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" as const }}>{"\u26A0\uFE0F"} Riesgo abandono</span>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  /* ── Main render ── */
  if (sel) return renderDetail();

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap" as const, gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: mob ? 16 : 19, color: colors.nv, fontWeight: 800 }}>{"\uD83C\uDF93"} Becas Deportivas</h2>
          <p style={{ margin: 0, fontSize: 11, color: colors.g4 }}>Gestion de becas deportivas del club</p>
        </div>
        <Btn v="p" s="s" onClick={openAdd}>+ Nueva Solicitud</Btn>
      </div>

      {/* KPI bar */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: mob ? 12 : 14, textAlign: "center" as const }}>
            <div style={{ fontSize: 22 }}>{k.i}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 10, color: colors.g4 }}>{k.l}</div>
          </Card>
        ))}
      </div>

      {/* Pending approvals card — same as minutas */}
      {pendingVotes.length > 0 && <Card style={{ marginBottom: 14, borderLeft: "4px solid #F59E0B", padding: "12px 16px", background: "#FFFBEB" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 8 }}>{"\uD83D\uDCCB"} Becas pendientes de tu aprobaci{"\u00F3"}n</div>
        {pendingVotes.map((b: any) => { const q = 3; const votos = b.votos || []; return <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #FDE68A" }}>
          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => sSelId(b.id)}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.nv }}>{"\uD83C\uDF93"} {b.nombre_completo} {"\u2013"} {b.deporte}{b.categoria ? " " + b.categoria : ""}</div>
            <div style={{ fontSize: 10, color: colors.g4 }}>Progreso: {votos.length}/{q} aprobaciones</div>
            <div style={{ height: 4, background: "#FDE68A", borderRadius: 2, marginTop: 3, width: 120 }}><div style={{ height: "100%", background: "#F59E0B", borderRadius: 2, width: Math.min(100, votos.length / q * 100) + "%" }} /></div>
          </div>
          <Btn v="w" s="s" onClick={() => onVote(b.id)} style={{ background: "#F59E0B", color: "#fff", border: "none" }}>{"\u2705"} Aprobar</Btn>
        </div>; })}
      </Card>}

      {/* New / Edit form */}
      {showForm && renderForm()}

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
        <select value={fEstado} onChange={e => sFEstado(e.target.value)} style={{ ...selS, width: "auto", minWidth: 140, fontSize: 11 }}>
          <option value="all">Todos los estados</option>
          {STATUS_KEYS.map(k => <option key={k} value={k}>{BSC[k].i} {BSC[k].l}</option>)}
        </select>
        <select value={fDeporte} onChange={e => sFDeporte(e.target.value)} style={{ ...selS, width: "auto", minWidth: 120, fontSize: 11 }}>
          <option value="all">Todos los deportes</option>
          {DEPORTES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{ fontSize: 11, color: colors.g4, marginLeft: "auto" }}>{vis.length} solicitud{vis.length !== 1 ? "es" : ""}</div>
      </div>

      {/* Card list */}
      {renderList()}
    </div>
  );
}
