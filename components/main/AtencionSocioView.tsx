"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { AST, ASC } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { Card, Btn } from "@/components/ui";

const TIPO_RES: Record<string, { l: string; i: string; c: string }> = {
  condonacion_total: { l: "Condonacion total", i: "🟢", c: "#10B981" },
  condonacion_parcial: { l: "Condonacion parcial", i: "🟡", c: "#F59E0B" },
  plan_pago: { l: "Plan de pago", i: "🔵", c: "#3B82F6" },
};

const emptyForm = () => ({
  nombre_socio: "",
  dni: "",
  nro_socio: "",
  categoria: "",
  monto_deuda: "",
  meses_adeudados: "",
  ultimo_pago: "",
  contacto: "",
  situacion: "",
  tipo_resolucion: "",
  estado: AST.NUE,
});

export function AtencionSocioView({ user, mob, showT, casos, becasAprobadas, onAddCaso, onUpdCaso, onDelCaso }: any) {
  const { colors, isDark, cardBg } = useC();
  const [tab, sTab] = useState<"deudas" | "becas">("deudas");
  const [fEst, sFEst] = useState("all");
  const [search, sSr] = useState("");
  const [form, sForm] = useState<any>(null);
  const [editId, sEditId] = useState<number | null>(null);
  const [selId, sSelId] = useState<number | null>(null);

  const safeC = (casos || []) as any[];
  const safeB = (becasAprobadas || []) as any[];

  /* ── KPIs ── */
  const kBecas = safeB.length;
  const kTotal = safeC.length;
  const kAprobadas = safeC.filter((c: any) => c.estado === AST.APR || c.estado === AST.EJE).length;
  const kPlanes = safeC.filter((c: any) => c.tipo_resolucion === "plan_pago" && c.estado !== AST.RECH).length;
  const kMontoCond = safeC.filter((c: any) => c.estado === AST.APR || c.estado === AST.EJE).reduce((s: number, c: any) => s + (Number(c.monto_deuda) || 0), 0);
  const kPend = safeC.filter((c: any) => c.estado === AST.NUE || c.estado === AST.ANA || c.estado === AST.PROP || c.estado === AST.DEL).length;

  /* ── Filtered cases ── */
  const visCasos = useMemo(() => {
    let r = [...safeC];
    if (fEst !== "all") r = r.filter((c: any) => c.estado === fEst);
    if (search) { const s = search.toLowerCase(); r = r.filter((c: any) => ((c.nombre_socio || "") + (c.dni || "") + (c.nro_socio || "") + (c.situacion || "")).toLowerCase().includes(s)); }
    return r.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
  }, [safeC, fEst, search]);

  /* ── Selected case ── */
  const selCaso = selId ? safeC.find((c: any) => c.id === selId) : null;

  /* ── Helpers ── */
  const openNew = () => { sEditId(null); sForm(emptyForm()); sSelId(null); };
  const openEdit = (c: any) => {
    sEditId(c.id);
    sForm({
      nombre_socio: c.nombre_socio || "",
      dni: c.dni || "",
      nro_socio: c.nro_socio || "",
      categoria: c.categoria || "",
      monto_deuda: c.monto_deuda || "",
      meses_adeudados: c.meses_adeudados || "",
      ultimo_pago: c.ultimo_pago || "",
      contacto: c.contacto || "",
      situacion: c.situacion || "",
      tipo_resolucion: c.tipo_resolucion || "",
      estado: c.estado || AST.NUE,
    });
  };
  const closeForm = () => { sForm(null); sEditId(null); };
  const save = () => {
    if (!form || !form.nombre_socio.trim() || !form.dni.trim()) return;
    const payload = {
      ...form,
      nombre_socio: form.nombre_socio.trim(),
      dni: form.dni.trim(),
      monto_deuda: Number(form.monto_deuda) || 0,
      meses_adeudados: Number(form.meses_adeudados) || 0,
      ultimo_pago: form.ultimo_pago || null,
    };
    if (editId) { onUpdCaso(editId, payload); }
    else { onAddCaso(payload); }
    closeForm();
  };

  const fmtARS = (n: number) => {
    if (!n && n !== 0) return "$0";
    return "$" + Math.round(n).toLocaleString("es-AR");
  };

  const iS: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, background: cardBg, color: colors.nv };
  const lS: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: colors.g5, marginBottom: 2, display: "block" };
  const tabBtn = (k: string, l: string, active: boolean) => (
    <button key={k} onClick={() => { sTab(k as any); sSelId(null); closeForm(); }} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: active ? colors.nv : "transparent", color: active ? (isDark ? "#0F172A" : "#fff") : colors.g5, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer" }}>{l}</button>
  );

  /* ── Border color for case status ── */
  const borderForSt = (st: string) => ASC[st]?.c || colors.g3;

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap" as const, gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: mob ? 16 : 19, color: colors.nv, fontWeight: 800 }}>Atencion al Socio</h2>
          <p style={{ margin: 0, fontSize: 11, color: colors.g4 }}>Gestion de deudas, condonaciones, planes de pago y becas aprobadas</p>
        </div>
      </div>

      {/* KPI bar */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { l: "Becas activas", v: String(kBecas), i: "🎓", c: "#10B981" },
          { l: "Casos deuda", v: String(kTotal), i: "📊", c: colors.nv },
          { l: "Condonaciones aprobadas", v: String(kAprobadas), i: "✅", c: "#10B981" },
          { l: "Planes pago activos", v: String(kPlanes), i: "📅", c: "#3B82F6" },
          { l: "Monto total condonado", v: fmtARS(kMontoCond), i: "💰", c: "#8B5CF6" },
          { l: "Pendientes resolucion", v: String(kPend), i: "🟡", c: "#F59E0B" },
        ].map((k, i) => (
          <Card key={i} style={{ padding: mob ? 10 : 12, textAlign: "center" as const }}>
            <div style={{ fontSize: 20 }}>{k.i}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 10, color: colors.g4, lineHeight: 1.2 }}>{k.l}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {tabBtn("becas", "🎓 Becas Aprobadas", tab === "becas")}
        {tabBtn("deudas", "📋 Deudas y Condonaciones", tab === "deudas")}
      </div>

      {/* ═══════ TAB: BECAS APROBADAS ═══════ */}
      {tab === "becas" && (
        <div>
          {safeB.length === 0 && (
            <Card style={{ textAlign: "center" as const, padding: 32, color: colors.g4 }}>
              <span style={{ fontSize: 28 }}>🎓</span>
              <div style={{ marginTop: 8, fontSize: 12 }}>No hay becas aprobadas todavia</div>
            </Card>
          )}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
            {safeB.map((b: any) => {
              const impl = b.implementada ? { l: "Implementada", c: "#10B981", bg: "#D1FAE5" } : { l: "Pendiente impl.", c: "#F59E0B", bg: "#FEF3C7" };
              return (
                <Card key={b.id} style={{ padding: "12px 14px", borderLeft: "4px solid #10B981" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{b.nombre_completo || "Sin nombre"}</div>
                      <div style={{ fontSize: 11, color: colors.g5, marginTop: 2 }}>
                        {b.deporte || "Rugby"} {b.categoria ? " - " + b.categoria : ""}
                      </div>
                    </div>
                    <span style={{ padding: "2px 8px", borderRadius: 12, background: impl.bg, color: impl.c, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" as const }}>{impl.l}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" as const }}>
                    {b.porcentaje != null && <span style={{ fontSize: 11, fontWeight: 700, color: "#8B5CF6" }}>{b.porcentaje}% beca</span>}
                    {b.duracion && <span style={{ fontSize: 11, color: colors.g4 }}>{b.duracion}</span>}
                    {b.fecha_aprobacion && <span style={{ fontSize: 10, color: colors.g4 }}>Aprobada: {fmtD(b.fecha_aprobacion)}</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ TAB: DEUDAS Y CONDONACIONES ═══════ */}
      {tab === "deudas" && (
        <div>
          {/* Action bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
            <input value={search} onChange={e => sSr(e.target.value)} placeholder="Buscar por nombre, DNI, socio..." style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 11, width: mob ? "100%" : 180, boxSizing: "border-box" as const }} />
            <select value={fEst} onChange={e => sFEst(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 11 }}>
              <option value="all">Todos los estados</option>
              {Object.keys(ASC).map(k => <option key={k} value={k}>{ASC[k].i} {ASC[k].l}</option>)}
            </select>
            <div style={{ marginLeft: "auto" }}>
              {!form && <Btn v="pu" s="s" onClick={openNew}>+ Nuevo Caso</Btn>}
            </div>
          </div>

          {/* Status pills */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" as const }}>
            {Object.keys(ASC).map(k => {
              const cnt = safeC.filter((c: any) => c.estado === k).length;
              return (
                <span key={k} onClick={() => sFEst(fEst === k ? "all" : k)} style={{ padding: "3px 10px", borderRadius: 14, background: fEst === k ? ASC[k].bg : cardBg, border: "1px solid " + (fEst === k ? ASC[k].c : colors.g3), fontSize: 10, fontWeight: 600, color: ASC[k].c, cursor: "pointer" }}>
                  {ASC[k].i} {cnt}
                </span>
              );
            })}
          </div>

          {/* ── Inline form ── */}
          {form && (
            <Card style={{ marginBottom: 14, background: isDark ? "#1E1B4B" : "#F5F3FF", border: "1px solid " + colors.pr + "33" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.pr }}>{editId ? "Editar caso #" + editId : "Nuevo caso de deuda"}</div>
                <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: colors.g4 }}>x</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
                <div><label style={lS}>Nombre completo *</label><input value={form.nombre_socio} onChange={e => sForm((p: any) => ({ ...p, nombre_socio: e.target.value }))} placeholder="Nombre y apellido" style={iS} /></div>
                <div><label style={lS}>DNI *</label><input value={form.dni} onChange={e => sForm((p: any) => ({ ...p, dni: e.target.value }))} placeholder="Ej: 30.123.456" style={iS} /></div>
                <div><label style={lS}>Nro. de socio</label><input value={form.nro_socio} onChange={e => sForm((p: any) => ({ ...p, nro_socio: e.target.value }))} placeholder="Opcional" style={iS} /></div>
                <div><label style={lS}>Categoria / Division</label><input value={form.categoria} onChange={e => sForm((p: any) => ({ ...p, categoria: e.target.value }))} placeholder="Ej: Plantel Superior, M15" style={iS} /></div>
                <div><label style={lS}>Monto total adeudado ($)</label><input type="number" value={form.monto_deuda} onChange={e => sForm((p: any) => ({ ...p, monto_deuda: e.target.value }))} placeholder="0" style={iS} /></div>
                <div><label style={lS}>Meses adeudados</label><input type="number" value={form.meses_adeudados} onChange={e => sForm((p: any) => ({ ...p, meses_adeudados: e.target.value }))} placeholder="0" style={iS} /></div>
                <div><label style={lS}>Ultimo pago registrado</label><input type="date" value={form.ultimo_pago} onChange={e => sForm((p: any) => ({ ...p, ultimo_pago: e.target.value }))} style={iS} /></div>
                <div><label style={lS}>Contacto telefono/email</label><input value={form.contacto} onChange={e => sForm((p: any) => ({ ...p, contacto: e.target.value }))} placeholder="Tel. o email" style={iS} /></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={lS}>Situacion particular</label>
                <textarea value={form.situacion} onChange={e => sForm((p: any) => ({ ...p, situacion: e.target.value }))} rows={3} placeholder="Describir la situacion del socio..." style={{ ...iS, resize: "vertical" as const }} />
              </div>
              {editId && (
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <div>
                    <label style={lS}>Tipo resolucion</label>
                    <select value={form.tipo_resolucion} onChange={e => sForm((p: any) => ({ ...p, tipo_resolucion: e.target.value }))} style={iS}>
                      {Object.keys(TIPO_RES).map(k => <option key={k} value={k}>{TIPO_RES[k].i} {TIPO_RES[k].l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lS}>Estado</label>
                    <select value={form.estado} onChange={e => sForm((p: any) => ({ ...p, estado: e.target.value }))} style={iS}>
                      {Object.keys(ASC).map(k => <option key={k} value={k}>{ASC[k].i} {ASC[k].l}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 14 }}>
                <Btn v="g" s="s" onClick={closeForm}>Cancelar</Btn>
                <Btn v="pu" s="s" disabled={!form.nombre_socio.trim() || !form.dni.trim()} onClick={save}>{editId ? "Guardar cambios" : "Crear caso"}</Btn>
              </div>
            </Card>
          )}

          {/* ── Detail view ── */}
          {selCaso && !form && (
            <Card style={{ marginBottom: 14, borderLeft: "4px solid " + borderForSt(selCaso.estado) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap" as const, gap: 8 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: colors.nv, marginBottom: 4 }}>{selCaso.nombre_socio}</div>
                  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, background: ASC[selCaso.estado]?.bg || "#F3F4F6", color: ASC[selCaso.estado]?.c || colors.g5, fontSize: 11, fontWeight: 600 }}>
                    {ASC[selCaso.estado]?.i} {ASC[selCaso.estado]?.l || selCaso.estado}
                  </span>
                  {selCaso.tipo_resolucion && selCaso.tipo_resolucion !== "sin_resolucion" && TIPO_RES[selCaso.tipo_resolucion] && (
                    <span style={{ marginLeft: 6, display: "inline-block", padding: "2px 10px", borderRadius: 12, background: TIPO_RES[selCaso.tipo_resolucion].c + "18", color: TIPO_RES[selCaso.tipo_resolucion].c, fontSize: 11, fontWeight: 600 }}>
                      {TIPO_RES[selCaso.tipo_resolucion].i} {TIPO_RES[selCaso.tipo_resolucion].l}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn v="g" s="s" onClick={() => openEdit(selCaso)}>Editar</Btn>
                  <Btn v="g" s="s" onClick={() => { if (confirm("Eliminar caso de " + selCaso.nombre_socio + "?")) { onDelCaso(selCaso.id); sSelId(null); } }}>Eliminar</Btn>
                  <Btn v="g" s="s" onClick={() => sSelId(null)}>Cerrar</Btn>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
                <div style={{ fontSize: 11 }}><span style={{ color: colors.g4 }}>DNI:</span> <strong style={{ color: colors.nv }}>{selCaso.dni || "-"}</strong></div>
                <div style={{ fontSize: 11 }}><span style={{ color: colors.g4 }}>Nro. socio:</span> <strong style={{ color: colors.nv }}>{selCaso.nro_socio || "-"}</strong></div>
                <div style={{ fontSize: 11 }}><span style={{ color: colors.g4 }}>Categoria:</span> <strong style={{ color: colors.nv }}>{selCaso.categoria || "-"}</strong></div>
                <div style={{ fontSize: 11 }}><span style={{ color: colors.g4 }}>Monto adeudado:</span> <strong style={{ color: colors.rd }}>{fmtARS(Number(selCaso.monto_deuda) || 0)}</strong></div>
                <div style={{ fontSize: 11 }}><span style={{ color: colors.g4 }}>Meses adeudados:</span> <strong style={{ color: colors.nv }}>{selCaso.meses_adeudados || 0}</strong></div>
                <div style={{ fontSize: 11 }}><span style={{ color: colors.g4 }}>Ultimo pago:</span> <strong style={{ color: colors.nv }}>{selCaso.ultimo_pago ? fmtD(selCaso.ultimo_pago) : "-"}</strong></div>
                <div style={{ fontSize: 11, gridColumn: mob ? undefined : "1 / -1" }}><span style={{ color: colors.g4 }}>Contacto:</span> <strong style={{ color: colors.nv }}>{selCaso.contacto || "-"}</strong></div>
              </div>
              {selCaso.situacion && (
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: isDark ? colors.g2 : colors.g1, fontSize: 12, color: colors.nv, lineHeight: 1.5 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: colors.g4, marginBottom: 4 }}>Situacion particular</div>
                  {selCaso.situacion}
                </div>
              )}
              {selCaso.created_at && <div style={{ marginTop: 10, fontSize: 10, color: colors.g4 }}>Creado: {fmtD(typeof selCaso.created_at === "string" ? selCaso.created_at.slice(0, 10) : "")}</div>}
            </Card>
          )}

          {/* ── Case list ── */}
          {visCasos.length === 0 && !form && (
            <Card style={{ textAlign: "center" as const, padding: 32, color: colors.g4 }}>
              <span style={{ fontSize: 28 }}>📋</span>
              <div style={{ marginTop: 8, fontSize: 12 }}>No hay casos registrados</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>Presiona "+ Nuevo Caso" para comenzar</div>
            </Card>
          )}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
            {visCasos.map((c: any) => {
              const st = ASC[c.estado] || ASC[AST.NUE];
              const tr = TIPO_RES[c.tipo_resolucion] || TIPO_RES.sin_resolucion;
              const isSel = selId === c.id;
              return (
                <Card key={c.id} onClick={() => sSelId(isSel ? null : c.id)} style={{
                  padding: "12px 14px",
                  borderLeft: "4px solid " + st.c,
                  cursor: "pointer",
                  outline: isSel ? "2px solid " + st.c : "none",
                  outlineOffset: -1,
                  transition: "outline .15s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{c.nombre_socio || "Sin nombre"}</div>
                      <div style={{ fontSize: 11, color: colors.g5 }}>
                        {fmtARS(Number(c.monto_deuda) || 0)}
                        {c.meses_adeudados ? " - " + c.meses_adeudados + " meses" : ""}
                        {c.tipo_resolucion ? " - " + tr.l : ""}
                      </div>
                    </div>
                    <span style={{ padding: "2px 8px", borderRadius: 12, background: st.bg, color: st.c, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" as const, flexShrink: 0, marginLeft: 6 }}>
                      {st.i} {st.l}
                    </span>
                  </div>
                  {c.categoria && <div style={{ fontSize: 10, color: colors.g4, marginTop: 4 }}>{c.categoria}</div>}
                  {c.dni && <div style={{ fontSize: 10, color: colors.g4, marginTop: 2 }}>DNI: {c.dni}{c.nro_socio ? " - Socio #" + c.nro_socio : ""}</div>}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
