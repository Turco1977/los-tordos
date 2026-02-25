"use client";
import { useState, useEffect, useCallback } from "react";
import { T, HOCKEY_DIV, HOCKEY_RAMA, COMPETENCIA_TIPOS, EVENTO_TIPOS, RESULTADO_COLORS, fn } from "@/lib/constants";
import { Btn, Card, Ring } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";

const fmtD = (d: string) => { if (!d) return "–"; const p = d.slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };

export function PartidosManager({ user, mob, getToken, showT }: any) {
  const { colors, isDark, cardBg } = useC();
  const partidos = useDataStore(s => s.hkPartidos);
  const sPartidos = useDataStore(s => s.sHkPartidos);
  const convocadas = useDataStore(s => s.hkConvocadas);
  const sConvocadas = useDataStore(s => s.sHkConvocadas);
  const eventos = useDataStore(s => s.hkEventos);
  const sEventos = useDataStore(s => s.sHkEventos);

  const [view, sView] = useState<"list" | "new" | "detail">("list");
  const [selPart, sSelPart] = useState<any>(null);
  const [athletes, sAthletes] = useState<any[]>([]);
  const [fDiv, sFDiv] = useState("");
  const [evtPanel, sEvtPanel] = useState(false);
  const [evtForm, sEvtForm] = useState({ jugadora_id: 0, tipo: "gol", minuto: "" });
  const [form, sForm] = useState({ fecha: new Date().toISOString().slice(0, 10), hora: "", division: HOCKEY_DIV[0], rama: "femenino", rival: "", sede: "local", competencia: "amistoso", notas: "" });

  // Fetch athletes
  useEffect(() => {
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.from("dep_athletes").select("id,first_name,last_name,dni,division,active").eq("active", true);
      if (data) sAthletes(data);
    })();
  }, []);

  const fetchPartidoData = useCallback(async (partidoId: number) => {
    const tok = await getToken();
    const [cRes, eRes] = await Promise.all([
      fetch(`/api/hockey/partidos/convocadas?partido_id=${partidoId}`, { headers: { Authorization: `Bearer ${tok}` } }),
      fetch(`/api/hockey/partidos/eventos?partido_id=${partidoId}`, { headers: { Authorization: `Bearer ${tok}` } }),
    ]);
    const [cData, eData] = await Promise.all([cRes.json(), eRes.json()]);
    if (Array.isArray(cData)) sConvocadas(() => cData);
    if (Array.isArray(eData)) sEventos(() => eData);
  }, [getToken, sConvocadas, sEventos]);

  const openDetail = (p: any) => { sSelPart(p); sView("detail"); fetchPartidoData(p.id); sEvtPanel(false); };

  // Create
  const createPartido = async () => {
    if (!form.rival.trim()) { showT("Rival requerido", "err"); return; }
    const tok = await getToken();
    const res = await fetch("/api/hockey/partidos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ ...form, hora: form.hora || null }),
    });
    const data = await res.json();
    if (data.error) { showT(data.error, "err"); return; }
    sPartidos(p => [data, ...p]);
    showT("Partido creado");
    openDetail(data);
  };

  // Update score
  const updScore = async (field: "goles_favor" | "goles_contra", delta: number) => {
    if (!selPart) return;
    const newVal = Math.max(0, (selPart[field] || 0) + delta);
    const tok = await getToken();
    const res = await fetch("/api/hockey/partidos", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ id: selPart.id, [field]: newVal }),
    });
    const data = await res.json();
    if (data.error) { showT(data.error, "err"); return; }
    sPartidos(p => p.map(x => x.id === data.id ? data : x));
    sSelPart(data);
  };

  // Toggle convocada
  const toggleConv = async (jugadoraId: number) => {
    if (!selPart) return;
    const existing = convocadas.find((c: any) => c.partido_id === selPart.id && c.jugadora_id === jugadoraId);
    const tok = await getToken();
    if (existing) {
      await fetch(`/api/hockey/partidos/convocadas?id=${existing.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${tok}` } });
      sConvocadas(p => p.filter((c: any) => c.id !== existing.id));
    } else {
      const res = await fetch("/api/hockey/partidos/convocadas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ partido_id: selPart.id, jugadoras: [{ jugadora_id: jugadoraId, titular: false }] }),
      });
      const data = await res.json();
      if (Array.isArray(data)) sConvocadas(p => [...p, ...data]);
    }
  };

  // Add event
  const addEvento = async () => {
    if (!selPart || !evtForm.jugadora_id || !evtForm.tipo) return;
    const tok = await getToken();
    const res = await fetch("/api/hockey/partidos/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ partido_id: selPart.id, jugadora_id: evtForm.jugadora_id, tipo: evtForm.tipo, minuto: evtForm.minuto ? Number(evtForm.minuto) : null }),
    });
    const data = await res.json();
    if (data.error) { showT(data.error, "err"); return; }
    sEventos(p => [...p, data]);
    if (data.tipo === "gol") {
      sSelPart((prev: any) => prev ? { ...prev, goles_favor: (prev.goles_favor || 0) + 1 } : prev);
      sPartidos(p => p.map(x => x.id === selPart.id ? { ...x, goles_favor: (x.goles_favor || 0) + 1 } : x));
    }
    sEvtForm({ jugadora_id: 0, tipo: "gol", minuto: "" });
    showT("Evento registrado");
  };

  // Delete event
  const delEvento = async (id: number) => {
    const tok = await getToken();
    const evt = eventos.find((e: any) => e.id === id);
    await fetch(`/api/hockey/partidos/eventos?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${tok}` } });
    sEventos(p => p.filter((e: any) => e.id !== id));
    if (evt?.tipo === "gol" && selPart) {
      sSelPart((prev: any) => prev ? { ...prev, goles_favor: Math.max(0, (prev.goles_favor || 0) - 1) } : prev);
      sPartidos(p => p.map(x => x.id === selPart.id ? { ...x, goles_favor: Math.max(0, (x.goles_favor || 0) - 1) } : x));
    }
  };

  const filtered = partidos.filter((p: any) => !fDiv || p.division === fDiv);
  const partConv = selPart ? convocadas.filter((c: any) => c.partido_id === selPart.id) : [];
  const partEvts = selPart ? eventos.filter((e: any) => e.partido_id === selPart.id) : [];
  const partAthletes = selPart ? athletes.filter((a: any) => !selPart.division || a.division === selPart.division) : [];

  /* ── LIST ── */
  if (view === "list") return (
    <div style={{ maxWidth: mob ? undefined : 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: mob ? 16 : 19, color: colors.nv, fontWeight: 800 }}>Partidos Hockey</h2>
          <p style={{ color: colors.g4, fontSize: 12, margin: "2px 0 0" }}>Resultados y estadísticas</p>
        </div>
        <Btn v="s" s="s" onClick={() => sView("new")}>+ Partido</Btn>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <select value={fDiv} onChange={e => sFDiv(e.target.value)} style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 11 }}>
          <option value="">Todas las divisiones</option>
          {HOCKEY_DIV.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
        {filtered.length === 0 && <Card style={{ gridColumn: "1/-1", textAlign: "center" as const, padding: 30, color: colors.g4 }}>Sin partidos registrados.</Card>}
        {filtered.map((p: any) => {
          const res = RESULTADO_COLORS[p.resultado] || RESULTADO_COLORS.E;
          const comp = COMPETENCIA_TIPOS[p.competencia] || COMPETENCIA_TIPOS.amistoso;
          return (
            <Card key={p.id} style={{ cursor: "pointer", padding: mob ? 14 : 18 }} onClick={() => openDetail(p)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: comp.c + "20", color: comp.c, fontWeight: 600 }}>{comp.i} {comp.l}</span>
                <span style={{ fontSize: 10, color: colors.g4 }}>{fmtD(p.fecha)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "10px 0" }}>
                <div style={{ textAlign: "center" as const }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: colors.nv }}>Los Tordos</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: colors.nv }}>{p.goles_favor}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: res.bg, color: res.c }}>{res.l}</div>
                <div style={{ textAlign: "center" as const }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>{p.rival}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: colors.g5 }}>{p.goles_contra}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: colors.g4, textAlign: "center" as const }}>{p.division} · {p.sede === "local" ? "Local" : p.sede === "visitante" ? "Visitante" : "Neutral"}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  /* ── NEW FORM ── */
  if (view === "new") return (
    <div style={{ maxWidth: 500 }}>
      <button onClick={() => sView("list")} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: "1px solid " + colors.g3, background: colors.g1, color: colors.nv, fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← Volver</button>
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: colors.nv }}>Nuevo Partido</h3>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
          <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Fecha *</label><input type="date" value={form.fecha} onChange={e => sForm(p => ({ ...p, fecha: e.target.value }))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
          <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Hora</label><input type="time" value={form.hora} onChange={e => sForm(p => ({ ...p, hora: e.target.value }))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
          <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Rival *</label><input value={form.rival} onChange={e => sForm(p => ({ ...p, rival: e.target.value }))} placeholder="Nombre rival" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" as const, marginTop: 2 }} /></div>
          <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>División</label><select value={form.division} onChange={e => sForm(p => ({ ...p, division: e.target.value }))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, marginTop: 2 }}>{HOCKEY_DIV.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Sede</label><select value={form.sede} onChange={e => sForm(p => ({ ...p, sede: e.target.value }))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, marginTop: 2 }}><option value="local">Local</option><option value="visitante">Visitante</option><option value="neutral">Neutral</option></select></div>
          <div><label style={{ fontSize: 10, fontWeight: 600, color: colors.g5 }}>Competencia</label><select value={form.competencia} onChange={e => sForm(p => ({ ...p, competencia: e.target.value }))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, marginTop: 2 }}>{Object.entries(COMPETENCIA_TIPOS).map(([k, v]) => <option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 14 }}>
          <Btn v="g" s="s" onClick={() => sView("list")}>Cancelar</Btn>
          <Btn v="s" s="s" onClick={createPartido}>Crear Partido</Btn>
        </div>
      </Card>
    </div>
  );

  /* ── DETAIL ── */
  return (
    <div style={{ maxWidth: mob ? undefined : 700 }}>
      <button onClick={() => { sView("list"); sSelPart(null); }} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: "1px solid " + colors.g3, background: colors.g1, color: colors.nv, fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← Volver</button>
      {selPart && (
        <>
          {/* Scoreboard */}
          <Card style={{ marginBottom: 12, textAlign: "center" as const, borderLeft: "4px solid " + (RESULTADO_COLORS[selPart.resultado]?.c || colors.g4) }}>
            <div style={{ fontSize: 11, color: colors.g4, marginBottom: 4 }}>{fmtD(selPart.fecha)} · {selPart.division} · {(COMPETENCIA_TIPOS[selPart.competencia] || COMPETENCIA_TIPOS.amistoso).l}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "12px 0" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.nv }}>Los Tordos</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => updScore("goles_favor", -1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid " + colors.g3, background: cardBg, cursor: "pointer", fontSize: 14 }}>−</button>
                  <span style={{ fontSize: 36, fontWeight: 800, color: colors.nv, minWidth: 40, display: "inline-block", textAlign: "center" as const }}>{selPart.goles_favor}</span>
                  <button onClick={() => updScore("goles_favor", 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid " + colors.g3, background: cardBg, cursor: "pointer", fontSize: 14 }}>+</button>
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.g4 }}>vs</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.g5 }}>{selPart.rival}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => updScore("goles_contra", -1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid " + colors.g3, background: cardBg, cursor: "pointer", fontSize: 14 }}>−</button>
                  <span style={{ fontSize: 36, fontWeight: 800, color: colors.g5, minWidth: 40, display: "inline-block", textAlign: "center" as const }}>{selPart.goles_contra}</span>
                  <button onClick={() => updScore("goles_contra", 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid " + colors.g3, background: cardBg, cursor: "pointer", fontSize: 14 }}>+</button>
                </div>
              </div>
            </div>
          </Card>

          {/* Convocadas */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Plantel Convocado ({partConv.length})</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
              {partAthletes.map((a: any) => {
                const isConv = partConv.some((c: any) => c.jugadora_id === a.id);
                return (
                  <button key={a.id} onClick={() => toggleConv(a.id)} style={{
                    padding: "4px 10px", borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: isConv ? "2px solid " + colors.nv : "1px solid " + colors.g3,
                    background: isConv ? colors.nv + "12" : cardBg,
                    color: isConv ? colors.nv : colors.g4,
                  }}>
                    {a.first_name} {a.last_name}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Events */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>Eventos del partido</div>
              <button onClick={() => sEvtPanel(!evtPanel)} style={{ padding: "4px 10px", borderRadius: 8, border: "none", background: colors.nv, color: isDark ? "#0F172A" : "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Evento</button>
            </div>
            {evtPanel && (
              <div style={{ background: isDark ? colors.g2 : "#F8FAFC", borderRadius: 10, padding: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 8 }}>
                  {Object.entries(EVENTO_TIPOS).map(([k, v]) => (
                    <button key={k} onClick={() => sEvtForm(p => ({ ...p, tipo: k }))} style={{
                      padding: "4px 10px", borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      border: evtForm.tipo === k ? "2px solid " + v.c : "1px solid " + colors.g3,
                      background: evtForm.tipo === k ? v.c + "20" : cardBg, color: v.c,
                    }}>{v.i} {v.l}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select value={evtForm.jugadora_id} onChange={e => sEvtForm(p => ({ ...p, jugadora_id: Number(e.target.value) }))} style={{ flex: 1, padding: 7, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 11 }}>
                    <option value={0}>Jugadora...</option>
                    {partConv.length > 0
                      ? partConv.map((c: any) => { const a = athletes.find(x => x.id === c.jugadora_id); return a ? <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option> : null; })
                      : partAthletes.map((a: any) => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)
                    }
                  </select>
                  <input value={evtForm.minuto} onChange={e => sEvtForm(p => ({ ...p, minuto: e.target.value }))} placeholder="Min" type="number" style={{ width: 55, padding: 7, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 11 }} />
                  <Btn v="s" s="s" disabled={!evtForm.jugadora_id} onClick={addEvento}>OK</Btn>
                </div>
              </div>
            )}
            {partEvts.length === 0 && <div style={{ fontSize: 12, color: colors.g4, textAlign: "center" as const, padding: 10 }}>Sin eventos registrados</div>}
            {partEvts.map((e: any) => {
              const et = EVENTO_TIPOS[e.tipo] || EVENTO_TIPOS.gol;
              const a = athletes.find((x: any) => x.id === e.jugadora_id);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, background: et.c + "10", marginBottom: 3 }}>
                  <span style={{ fontSize: 14 }}>{et.i}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: et.c, flex: 1 }}>{a ? a.first_name + " " + a.last_name : "?"}</span>
                  {e.minuto && <span style={{ fontSize: 10, color: colors.g4 }}>{e.minuto}&apos;</span>}
                  <button onClick={() => delEvento(e.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: colors.g4 }}>✕</button>
                </div>
              );
            })}
            {/* Stats summary */}
            {partEvts.length > 0 && (
              <div style={{ display: "flex", gap: 12, marginTop: 10, padding: "8px 0", borderTop: "1px solid " + colors.g2 }}>
                {Object.entries(EVENTO_TIPOS).map(([k, v]) => {
                  const count = partEvts.filter((e: any) => e.tipo === k).length;
                  if (!count) return null;
                  return <span key={k} style={{ fontSize: 11, fontWeight: 600, color: v.c }}>{v.i} {count}</span>;
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
