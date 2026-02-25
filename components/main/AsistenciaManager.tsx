"use client";
import { useState, useEffect, useCallback } from "react";
import { T, HOCKEY_DIV, HOCKEY_RAMA, TIPO_ACTIVIDAD, fn } from "@/lib/constants";
import { Btn, Card, Ring } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import QRCode from "qrcode";

const TODAY = new Date().toISOString().slice(0, 10);
const fmtD = (d: string) => { if (!d) return "–"; const p = d.slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };

export function AsistenciaManager({ user, mob, getToken, showT }: any) {
  const { colors, isDark, cardBg } = useC();
  const sesiones = useDataStore(s => s.hkSesiones);
  const sSesiones = useDataStore(s => s.sHkSesiones);
  const registros = useDataStore(s => s.hkRegistros);
  const sRegistros = useDataStore(s => s.sHkRegistros);

  const [view, sView] = useState<"list" | "new" | "detail">("list");
  const [selSesion, sSelSesion] = useState<any>(null);
  const [athletes, sAthletes] = useState<any[]>([]);
  const [qrUrl, sQrUrl] = useState("");
  const [qrTimer, sQrTimer] = useState(0);
  const [fDiv, sFDiv] = useState("");
  const [fRama, sFRama] = useState("");
  const [form, sForm] = useState({ fecha: TODAY, division: HOCKEY_DIV[0], rama: "femenino", tipo_actividad: "entrenamiento", notas: "" });

  // Fetch athletes for the selected division
  const fetchAthletes = useCallback(async (division: string) => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data } = await supabase.from("dep_athletes").select("id,first_name,last_name,dni,division,active").eq("active", true);
    if (data) sAthletes(data);
  }, []);

  useEffect(() => { fetchAthletes(""); }, [fetchAthletes]);

  // Fetch registros when viewing detail
  const fetchRegs = useCallback(async (sesionId: number) => {
    const tok = await getToken();
    const res = await fetch(`/api/hockey/asistencia/registros?sesion_id=${sesionId}`, { headers: { Authorization: `Bearer ${tok}` } });
    const data = await res.json();
    if (Array.isArray(data)) sRegistros(() => data);
  }, [getToken, sRegistros]);

  const openDetail = (s: any) => {
    sSelSesion(s);
    sView("detail");
    fetchRegs(s.id);
    sQrUrl("");
    sQrTimer(0);
  };

  // Create session
  const createSesion = async () => {
    const tok = await getToken();
    const res = await fetch("/api/hockey/asistencia", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) { showT(data.error, "err"); return; }
    sSesiones(p => [data, ...p]);
    showT("Sesión creada");
    openDetail(data);
  };

  // Generate QR
  const genQR = async () => {
    if (!selSesion) return;
    const tok = await getToken();
    const res = await fetch("/api/hockey/asistencia/qr", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ sesion_id: selSesion.id }),
    });
    const data = await res.json();
    if (data.error) { showT(data.error, "err"); return; }
    sSesiones(p => p.map(s => s.id === data.id ? data : s));
    sSelSesion(data);
    const url = `${window.location.origin}/asistencia/${data.qr_token}`;
    const svg = await QRCode.toDataURL(url, { width: 280, margin: 2 });
    sQrUrl(svg);
    sQrTimer(30 * 60);
  };

  // QR countdown
  useEffect(() => {
    if (qrTimer <= 0) return;
    const iv = setInterval(() => sQrTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; }), 1000);
    return () => clearInterval(iv);
  }, [qrTimer > 0]);

  // Toggle presence
  const togglePresente = async (jugadoraId: number, presente: boolean) => {
    if (!selSesion) return;
    const tok = await getToken();
    await fetch("/api/hockey/asistencia/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ sesion_id: selSesion.id, registros: [{ jugadora_id: jugadoraId, presente, metodo: "manual" }] }),
    });
    sRegistros(p => {
      const existing = p.find((r: any) => r.jugadora_id === jugadoraId);
      if (existing) return p.map((r: any) => r.jugadora_id === jugadoraId ? { ...r, presente } : r);
      return [...p, { sesion_id: selSesion.id, jugadora_id: jugadoraId, presente, metodo: "manual" }];
    });
  };

  // Close session
  const closeSesion = async () => {
    if (!selSesion) return;
    const tok = await getToken();
    const res = await fetch("/api/hockey/asistencia", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ id: selSesion.id, estado: "cerrada" }),
    });
    const data = await res.json();
    if (data.error) { showT(data.error, "err"); return; }
    sSesiones(p => p.map(s => s.id === data.id ? data : s));
    sSelSesion(data);
    showT("Sesión cerrada");
  };

  // Filter sesiones
  const filtered = sesiones.filter((s: any) => {
    if (fDiv && s.division !== fDiv) return false;
    if (fRama && s.rama !== fRama) return false;
    return true;
  });

  // Athletes for current session's division
  const sesionAthletes = selSesion ? athletes.filter((a: any) => !selSesion.division || a.division === selSesion.division) : [];

  const presentes = registros.filter((r: any) => r.sesion_id === selSesion?.id && r.presente);
  const total = sesionAthletes.length || 1;
  const pct = Math.round((presentes.length / total) * 100);

  /* ── LIST VIEW ── */
  if (view === "list") return (
    <div style={{ maxWidth: mob ? undefined : 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: mob ? 16 : 19, color: colors.nv, fontWeight: 800 }}>Asistencia Hockey</h2>
          <p style={{ color: colors.g4, fontSize: 12, margin: "2px 0 0" }}>Control de presentes por sesión</p>
        </div>
        <Btn v="s" s="s" onClick={() => sView("new")}>+ Sesión</Btn>
      </div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" as const }}>
        <select value={fDiv} onChange={e => sFDiv(e.target.value)} style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 11 }}>
          <option value="">Todas las divisiones</option>
          {HOCKEY_DIV.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={fRama} onChange={e => sFRama(e.target.value)} style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 11 }}>
          <option value="">Todas las ramas</option>
          {Object.entries(HOCKEY_RAMA).map(([k, v]) => <option key={k} value={k}>{v.i} {v.l}</option>)}
        </select>
      </div>
      {/* Cards with Ring (same aesthetic as screenshot) */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
        {filtered.length === 0 && <Card style={{ gridColumn: "1/-1", textAlign: "center" as const, padding: 30, color: colors.g4 }}>Sin sesiones. Creá una nueva.</Card>}
        {filtered.map((s: any) => {
          const sRegs = registros.filter((r: any) => r.sesion_id === s.id && r.presente);
          const sTotal = athletes.filter(a => !s.division || a.division === s.division).length || 1;
          const sPct = Math.round((sRegs.length / sTotal) * 100);
          const ta = TIPO_ACTIVIDAD[s.tipo_actividad] || TIPO_ACTIVIDAD.otro;
          const isOpen = s.estado === "abierta";
          return (
            <Card key={s.id} style={{ cursor: "pointer", textAlign: "center" as const, padding: mob ? 14 : 18 }} onClick={() => openDetail(s)}>
              <Ring pct={sPct} color={isOpen ? ta.c : colors.g4} size={mob ? 80 : 100} icon={ta.i} />
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginTop: 8 }}>{s.division}</div>
              <div style={{ fontSize: 11, color: colors.g4 }}>{fmtD(s.fecha)} — {ta.l}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 6, fontSize: 11 }}>
                <span style={{ color: isOpen ? T.gn : T.rd, fontWeight: 600 }}>{isOpen ? "Abierta" : "Cerrada"}</span>
                <span style={{ color: colors.g4 }}>{sRegs.length} presentes</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  /* ── NEW SESSION FORM ── */
  if (view === "new") return (
    <div style={{ maxWidth: 500 }}>
      <button onClick={() => sView("list")} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: "1px solid " + colors.g3, background: colors.g1, color: colors.nv, fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← Volver</button>
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: colors.nv }}>Nueva Sesión de Asistencia</h3>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Fecha</label>
            <input type="date" value={form.fecha} onChange={e => sForm(p => ({ ...p, fecha: e.target.value }))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>División</label>
            <select value={form.division} onChange={e => sForm(p => ({ ...p, division: e.target.value }))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, marginTop: 2 }}>
              {HOCKEY_DIV.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Rama</label>
            <select value={form.rama} onChange={e => sForm(p => ({ ...p, rama: e.target.value }))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, marginTop: 2 }}>
              {Object.entries(HOCKEY_RAMA).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Tipo de actividad</label>
            <select value={form.tipo_actividad} onChange={e => sForm(p => ({ ...p, tipo_actividad: e.target.value }))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, marginTop: 2 }}>
              {Object.entries(TIPO_ACTIVIDAD).map(([k, v]) => <option key={k} value={k}>{v.i} {v.l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Notas</label>
          <input value={form.notas} onChange={e => sForm(p => ({ ...p, notas: e.target.value }))} placeholder="Opcional..." style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} />
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 14 }}>
          <Btn v="g" s="s" onClick={() => sView("list")}>Cancelar</Btn>
          <Btn v="s" s="s" onClick={createSesion}>Crear Sesión</Btn>
        </div>
      </Card>
    </div>
  );

  /* ── DETAIL VIEW (mobile-first cancha screen) ── */
  return (
    <div style={{ maxWidth: mob ? undefined : 700 }}>
      <button onClick={() => { sView("list"); sSelSesion(null); sQrUrl(""); }} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: "1px solid " + colors.g3, background: colors.g1, color: colors.nv, fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← Volver</button>
      {selSesion && (
        <>
          {/* Header */}
          <Card style={{ marginBottom: 12, borderLeft: "4px solid " + (TIPO_ACTIVIDAD[selSesion.tipo_actividad]?.c || colors.bl) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: colors.nv }}>{selSesion.division} — {TIPO_ACTIVIDAD[selSesion.tipo_actividad]?.l || selSesion.tipo_actividad}</div>
                <div style={{ fontSize: 12, color: colors.g4 }}>{fmtD(selSesion.fecha)} · {HOCKEY_RAMA[selSesion.rama]?.l || selSesion.rama}</div>
              </div>
              <div style={{ textAlign: "center" as const }}>
                <Ring pct={pct} color={selSesion.estado === "abierta" ? T.gn : colors.g4} size={60} />
                <div style={{ fontSize: 10, fontWeight: 600, color: colors.g4, marginTop: 2 }}>{presentes.length}/{sesionAthletes.length}</div>
              </div>
            </div>
          </Card>

          {/* QR Section */}
          {selSesion.estado === "abierta" && (
            <Card style={{ marginBottom: 12, textAlign: "center" as const }}>
              {!qrUrl ? (
                <Btn v="s" s="m" onClick={genQR}>Generar QR (30 min)</Btn>
              ) : (
                <div>
                  <img src={qrUrl} alt="QR" style={{ width: 200, height: 200, margin: "0 auto 8px", display: "block" }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: qrTimer > 300 ? T.gn : T.rd }}>
                    {Math.floor(qrTimer / 60)}:{String(qrTimer % 60).padStart(2, "0")} restante
                  </div>
                  <div style={{ fontSize: 10, color: colors.g4, marginTop: 2 }}>Las jugadoras escanean el QR e ingresan su DNI</div>
                </div>
              )}
            </Card>
          )}

          {/* Athletes checklist */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>Plantel ({sesionAthletes.length})</div>
              {selSesion.estado === "abierta" && (
                <button onClick={closeSesion} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: T.rd, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  Cerrar Asistencia
                </button>
              )}
            </div>
            {sesionAthletes.length === 0 && <div style={{ fontSize: 12, color: colors.g4, textAlign: "center" as const, padding: 16 }}>No hay jugadoras en esta división</div>}
            {sesionAthletes.map((a: any) => {
              const reg = registros.find((r: any) => r.sesion_id === selSesion.id && r.jugadora_id === a.id);
              const isPresente = reg?.presente === true;
              const isQR = reg?.metodo === "qr";
              const isOpen = selSesion.estado === "abierta";
              return (
                <div key={a.id} onClick={() => isOpen && togglePresente(a.id, !isPresente)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: mob ? "12px 10px" : "10px 12px",
                  borderRadius: 10, background: isPresente ? (isDark ? "#064E3B20" : "#ECFDF5") : "transparent",
                  border: "1px solid " + (isPresente ? T.gn + "40" : colors.g2),
                  marginBottom: 4, cursor: isOpen ? "pointer" : "default", transition: "all .15s"
                }}>
                  <div style={{
                    width: mob ? 36 : 28, height: mob ? 36 : 28, borderRadius: "50%",
                    border: "2px solid " + (isPresente ? T.gn : colors.g3),
                    background: isPresente ? T.gn : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: mob ? 16 : 14, fontWeight: 700, flexShrink: 0
                  }}>
                    {isPresente && "✓"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: mob ? 14 : 12, fontWeight: 600, color: colors.nv }}>{a.first_name} {a.last_name}</div>
                    <div style={{ fontSize: 10, color: colors.g4 }}>DNI: {a.dni}</div>
                  </div>
                  {isQR && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: colors.bl + "20", color: colors.bl, fontWeight: 700 }}>QR</span>}
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
}
