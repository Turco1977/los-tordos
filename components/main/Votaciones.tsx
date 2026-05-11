"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fn, DEPTOS } from "@/lib/constants";
import { useC } from "@/lib/theme-context";
import { Btn } from "@/components/ui";
import { useDataStore } from "@/lib/store";

const TODAY = new Date().toISOString().slice(0, 10);
const NOW = () => new Date().toISOString().slice(0, 16).replace("T", " ");

const TIPOS = [
  { k: "cd", l: "🏛️ Comisión Directiva", desc: "Requiere aprobación de la CD" },
  { k: "se", l: "⚡ Secretaría Ejecutiva", desc: "Aprobación rápida por la SE" },
  { k: "mc", l: "⚖️ Mesa de Convivencia", desc: "Votación interna de la Mesa" },
];

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

export function Votaciones({ user, tabType, mob }: any) {
  const sb = createClient();
  const votaciones = useDataStore((s) => s.votaciones);
  const votos = useDataStore((s) => s.votos);
  const sVotaciones = useDataStore((s) => s.sVotaciones);
  const sVotos = useDataStore((s) => s.sVotos);
  const { colors, isDark, cardBg } = useC();

  const userAreaIds = user?.dId ? DEPTOS.filter((d: any) => d.id === user.dId).map((d: any) => d.aId) : [];
  const isMesaConvivencia = user?.dId === 86;
  const isCdMember = userAreaIds.includes(100);
  const isSeMember = userAreaIds.includes(101);
  const isSA = user?.role === "superadmin" || user?.role === "admin";
  const canCreate = isMesaConvivencia;
  const canVote = isMesaConvivencia;
  const canSeeVotacion = (v: any) => {
    if (isSA || isMesaConvivencia) return true;
    if (isCdMember) return v.tipo === "cd" || v.tipo === "mc";
    if (isSeMember) return v.tipo === "se" || v.tipo === "mc";
    return false;
  };
  const canView = isSA || isMesaConvivencia || isCdMember || isSeMember;
  const [view, sView] = useState<"activas" | "historial">("activas");
  const [showForm, sShowForm] = useState(false);
  const [saving, sSaving] = useState(false);
  const [notifSending, sNotifSending] = useState<number | null>(null);
  const [exporting, sExporting] = useState<number | null>(null);

  // Form state
  const [fTit, sFTit] = useState("");
  const [fDesc, sFDesc] = useState("");
  const [fTipo, sFTipo] = useState("cd");

  // Filter votaciones by visibility and optional tab type
  const fVot = votaciones.filter((v: any) => canSeeVotacion(v) && (!tabType || v.tipo === tabType));
  const activas = fVot.filter((v: any) => v.estado === "abierta");
  const historial = fVot.filter((v: any) => v.estado === "cerrada");

  const resetForm = () => { sFTit(""); sFDesc(""); sFTipo("cd"); sShowForm(false); };

  async function crearVotacion() {
    if (!canCreate) return;
    if (!fTit.trim()) return;
    sSaving(true);
    const { data, error } = await sb.from("votaciones").insert({
      titulo: fTit.trim(),
      descripcion: fDesc.trim(),
      tipo: fTipo,
      estado: "abierta",
      creado_por: user.id,
      creado_por_nombre: `${user.n} ${user.a}`,
      created_at: NOW(),
    }).select().single();
    if (!error && data) {
      sVotaciones((prev: any[]) => [data, ...prev]);
      resetForm();
    }
    sSaving(false);
  }

  async function votar(votacionId: number, voto: "si" | "no" | "abstencion") {
    if (!canVote) return;
    const miVoto = votos.find((v: any) => v.votacion_id === votacionId && v.user_id === user.id);
    const nombre = `${user.n} ${user.a}`;
    const now = NOW();

    if (miVoto) {
      // Update existing vote
      const { data } = await sb.from("votos").update({ voto, created_at: now })
        .eq("id", miVoto.id).select().single();
      if (data) sVotos((prev: any[]) => prev.map((v: any) => v.id === miVoto.id ? data : v));
    } else {
      // New vote
      const { data } = await sb.from("votos").insert({
        votacion_id: votacionId,
        user_id: user.id,
        user_nombre: nombre,
        voto,
        created_at: now,
      }).select().single();
      if (data) sVotos((prev: any[]) => [...prev, data]);
    }
  }

  async function cerrarVotacion(v: any) {
    const vv = votos.filter((vt: any) => vt.votacion_id === v.id);
    const si = vv.filter((vt: any) => vt.voto === "si").length;
    const no = vv.filter((vt: any) => vt.voto === "no").length;
    let resultado = si > no ? "aprobada" : no > si ? "rechazada" : "empate";
    const { data } = await sb.from("votaciones").update({ estado: "cerrada", resultado })
      .eq("id", v.id).select().single();
    if (data) sVotaciones((prev: any[]) => prev.map((vt: any) => vt.id === v.id ? data : vt));
  }

  async function reabrirVotacion(v: any) {
    const { data } = await sb.from("votaciones").update({ estado: "abierta", resultado: null })
      .eq("id", v.id).select().single();
    if (data) sVotaciones((prev: any[]) => prev.map((vt: any) => vt.id === v.id ? data : vt));
  }

  async function eliminarVotacion(id: number) {
    if (!confirm("¿Eliminar esta votación?")) return;
    await sb.from("votaciones").delete().eq("id", id);
    sVotaciones((prev: any[]) => prev.filter((v: any) => v.id !== id));
    sVotos((prev: any[]) => prev.filter((v: any) => v.votacion_id !== id));
  }

  async function notificarMiembros(v: any) {
    sNotifSending(v.id);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🗳️ Nueva votación abierta",
          message: v.titulo,
          link: `/votar/${v.id}`,
          broadcast: true,
        }),
      });
    } finally { sNotifSending(null); }
  }

  function shareWhatsApp(v: any) {
    const vv = votos.filter((vt: any) => vt.votacion_id === v.id);
    const si = vv.filter((vt: any) => vt.voto === "si").length;
    const no = vv.filter((vt: any) => vt.voto === "no").length;
    const abs = vv.filter((vt: any) => vt.voto === "abstencion").length;
    const link = `${window.location.origin}/votar/${v.id}`;
    const tipo = TIPOS.find((t) => t.k === v.tipo)?.l || v.tipo;
    const estado = v.estado === "abierta" ? "🟢 Abierta — ¡Entrá a votar!" : `🔴 Cerrada — ${v.resultado === "aprobada" ? "✅ Aprobada" : v.resultado === "rechazada" ? "❌ Rechazada" : "🤝 Empate"}`;
    const lines = [
      `🗳️ *Votación Los Tordos RC*`,
      ``,
      `*${v.titulo}*`,
      `${tipo}`,
      ``,
      v.descripcion ? `📋 ${v.descripcion}` : "",
      ``,
      estado,
      vv.length > 0 ? `\n✅ Sí: ${si} | ❌ No: ${no} | 🤷 Abstención: ${abs}` : "",
      ``,
      `👉 ${link}`,
    ].filter(Boolean);
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  }

  async function exportarPDF(v: any) {
    sExporting(v.id);
    try {
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const vv = votos.filter((vt: any) => vt.votacion_id === v.id);
      const si = vv.filter((vt: any) => vt.voto === "si");
      const no = vv.filter((vt: any) => vt.voto === "no");
      const abs = vv.filter((vt: any) => vt.voto === "abstencion");
      const tipo = TIPOS.find((t) => t.k === v.tipo)?.l || v.tipo;
      const total = vv.length;

      // Header
      pdf.setFillColor(10, 22, 40);
      pdf.rect(0, 0, 210, 35, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text("LOS TORDOS RUGBY CLUB", 14, 12);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Votación Institucional", 14, 24);

      // Title
      pdf.setTextColor(10, 22, 40);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(v.titulo, 14, 48);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(90, 101, 119);
      pdf.text(`${tipo}  ·  ${v.created_at?.slice(0, 10) || ""}`, 14, 56);

      if (v.descripcion) {
        pdf.setTextColor(10, 22, 40);
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(v.descripcion, 182);
        pdf.text(lines, 14, 66);
      }

      // Result box
      const resultY = v.descripcion ? 80 : 70;
      const resultColor = v.resultado === "aprobada" ? [209, 250, 229] : v.resultado === "rechazada" ? [254, 226, 226] : [241, 245, 249];
      pdf.setFillColor(...(resultColor as [number, number, number]));
      pdf.roundedRect(14, resultY, 182, 22, 4, 4, "F");
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      const resultText = v.estado === "abierta" ? "🟢 Votación Abierta" : v.resultado === "aprobada" ? "✅ APROBADA" : v.resultado === "rechazada" ? "❌ RECHAZADA" : "🤝 EMPATE";
      pdf.setTextColor(10, 22, 40);
      pdf.text(resultText, 105, resultY + 14, { align: "center" });

      // Votes summary
      const votY = resultY + 32;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(90, 101, 119);
      pdf.text("RESULTADOS", 14, votY);

      const cols = [
        { label: "✅ Sí", count: si.length, color: [16, 185, 129] as [number, number, number] },
        { label: "❌ No", count: no.length, color: [200, 16, 46] as [number, number, number] },
        { label: "🤷 Abstención", count: abs.length, color: [148, 163, 184] as [number, number, number] },
      ];
      cols.forEach((col, i) => {
        const x = 14 + i * 62;
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, votY + 4, 58, 20, 3, 3, "F");
        pdf.setTextColor(...col.color);
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text(String(col.count), x + 29, votY + 16, { align: "center" });
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(90, 101, 119);
        pdf.text(col.label, x + 29, votY + 20, { align: "center" });
        // Bar
        if (total > 0) {
          pdf.setFillColor(230, 232, 236);
          pdf.rect(x, votY + 22, 58, 2, "F");
          pdf.setFillColor(...col.color);
          pdf.rect(x, votY + 22, (col.count / total) * 58, 2, "F");
        }
      });

      // Voter list
      if (vv.length > 0) {
        const listY = votY + 32;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(90, 101, 119);
        pdf.text(`DETALLE DE VOTOS (${total})`, 14, listY);
        const emoji = { si: "✓", no: "✗", abstencion: "~" };
        vv.forEach((voto: any, i: number) => {
          const y = listY + 6 + i * 6;
          if (y > 270) return;
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(10, 22, 40);
          pdf.text(`${emoji[voto.voto as keyof typeof emoji] || "?"} ${voto.user_nombre || "Anónimo"}`, 14, y);
          pdf.setTextColor(90, 101, 119);
          pdf.text(voto.voto === "si" ? "Sí" : voto.voto === "no" ? "No" : "Abstención", 100, y);
          pdf.text(voto.created_at?.slice(0, 16) || "", 140, y);
        });
      }

      // Footer
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 280, 210, 17, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Los Tordos Rugby Club — Sistema de Gestión Institucional", 105, 290, { align: "center" });

      pdf.save(`Votacion_${v.titulo.replace(/\s+/g, "_")}.pdf`);
    } finally { sExporting(null); }
  }

  function VotCard({ v }: { v: any }) {
    const vv = votos.filter((vt: any) => vt.votacion_id === v.id);
    const si = vv.filter((vt: any) => vt.voto === "si").length;
    const no = vv.filter((vt: any) => vt.voto === "no").length;
    const abs = vv.filter((vt: any) => vt.voto === "abstencion").length;
    const total = vv.length;
    const miVoto = vv.find((vt: any) => vt.user_id === user.id);
    const abierta = v.estado === "abierta";
    const tipo = TIPOS.find((t) => t.k === v.tipo);

    const resultBg = !abierta ? (v.resultado === "aprobada" ? "#D1FAE5" : v.resultado === "rechazada" ? "#FEE2E2" : "#F1F5F9") : isDark ? "#1E293B" : "#F7F8FA";
    const resultBorder = !abierta ? (v.resultado === "aprobada" ? "#10B981" : v.resultado === "rechazada" ? "#C8102E" : "#94A3B8") : colors.g2;

    return (
      <div style={{ background: cardBg, border: `1px solid ${resultBorder}`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
        {/* Header */}
        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${colors.g2}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: abierta ? "#059669" : colors.g4, background: abierta ? "#D1FAE5" : colors.g1, padding: "2px 7px", borderRadius: 10 }}>
                  {abierta ? "🟢 Abierta" : "🔴 Cerrada"}
                </span>
                <span style={{ fontSize: 10, color: colors.g4, fontWeight: 600 }}>{tipo?.l}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: colors.nv }}>{v.titulo}</h3>
              {v.descripcion && <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.g5 }}>{v.descripcion}</p>}
            </div>
            {/* Result badge */}
            {!abierta && v.resultado && (
              <span style={{ fontSize: 13, fontWeight: 800, color: v.resultado === "aprobada" ? "#059669" : v.resultado === "rechazada" ? "#C8102E" : colors.g4, flexShrink: 0 }}>
                {v.resultado === "aprobada" ? "✅ Aprobada" : v.resultado === "rechazada" ? "❌ Rechazada" : "🤝 Empate"}
              </span>
            )}
          </div>
        </div>

        {/* Votes */}
        <div style={{ padding: "12px 16px" }}>
          {/* Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {[
              { label: "✅ Sí", count: si, color: "#10B981" },
              { label: "❌ No", count: no, color: "#C8102E" },
              { label: "🤷 Abstención", count: abs, color: colors.g3 },
            ].map((opt) => (
              <div key={opt.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: colors.g5 }}>{opt.label}</span>
                  <span style={{ fontWeight: 700, color: colors.nv }}>{opt.count} <span style={{ fontWeight: 400, color: colors.g4 }}>({pct(opt.count, total)}%)</span></span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: colors.g1, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: opt.color, width: `${pct(opt.count, total)}%`, transition: "width .4s" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: colors.g4, marginBottom: 10 }}>{total} {total === 1 ? "voto" : "votos"} · {v.created_at?.slice(0, 10)}</div>

          {/* Vote buttons */}
          {abierta && canVote && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.g4, marginBottom: 6 }}>
                {miVoto ? `Tu voto: ${miVoto.voto === "si" ? "✅ Sí" : miVoto.voto === "no" ? "❌ No" : "🤷 Abstención"} — podés cambiarlo` : "Tu voto:"}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { k: "si", l: "✅ Sí", bg: miVoto?.voto === "si" ? "#10B981" : isDark ? "#1E293B" : "#F0FDF4", color: miVoto?.voto === "si" ? "#fff" : "#059669", border: "#10B981" },
                  { k: "no", l: "❌ No", bg: miVoto?.voto === "no" ? "#C8102E" : isDark ? "#1E293B" : "#FFF5F5", color: miVoto?.voto === "no" ? "#fff" : "#C8102E", border: "#C8102E" },
                  { k: "abstencion", l: "🤷 Me abstengo", bg: miVoto?.voto === "abstencion" ? colors.g4 : colors.g1, color: miVoto?.voto === "abstencion" ? "#fff" : colors.g5, border: colors.g3 },
                ].map((opt) => (
                  <button key={opt.k} onClick={() => votar(v.id, opt.k as any)}
                    style={{ padding: mob ? "10px 14px" : "7px 14px", borderRadius: 20, border: `2px solid ${opt.border}`, background: opt.bg, color: opt.color, fontSize: mob ? 13 : 11, fontWeight: 700, cursor: "pointer", minHeight: mob ? 44 : undefined }}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 8, borderTop: `1px solid ${colors.g2}` }}>
            <button onClick={() => shareWhatsApp(v)}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: "none", background: "#25D366", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              💬 Compartir
            </button>
            <button onClick={() => exportarPDF(v)} disabled={exporting === v.id}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: `1px solid ${colors.g2}`, background: colors.g1, color: colors.g5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              📄 {exporting === v.id ? "..." : "PDF"}
            </button>
            {canCreate && abierta && (
              <button onClick={() => notificarMiembros(v)} disabled={notifSending === v.id}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: `1px solid ${colors.bl}`, background: isDark ? "#1E293B" : "#EFF6FF", color: colors.bl, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                📢 {notifSending === v.id ? "Enviando..." : "Notificar"}
              </button>
            )}
            {canCreate && abierta && (
              <Btn v="s" s="s" onClick={() => cerrarVotacion(v)}>🔒 Cerrar</Btn>
            )}
            {canCreate && !abierta && (
              <Btn v="w" s="s" onClick={() => reabrirVotacion(v)}>🔓 Reabrir</Btn>
            )}
            {canCreate && (
              <Btn v="r" s="s" onClick={() => eliminarVotacion(v.id)}>🗑</Btn>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Group historial by month
  const historialByMonth = historial.reduce((acc: Record<string, any[]>, v: any) => {
    const month = v.created_at?.slice(0, 7) || "—";
    if (!acc[month]) acc[month] = [];
    acc[month].push(v);
    return acc;
  }, {});

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div>
      {!canView && (
        <div style={{ textAlign: "center", padding: "32px 0", color: colors.g4 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>No tenés acceso a votaciones</div>
        </div>
      )}
      {canView && (
        <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["activas", "historial"] as const).map((v) => (
            <button key={v} onClick={() => sView(v)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: view === v ? colors.nv : "transparent", color: view === v ? "#fff" : colors.g5, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {v === "activas" ? `🟢 Activas (${activas.length})` : `📚 Historial (${historial.length})`}
            </button>
          ))}
        </div>
        {canCreate && !showForm && (
          <button onClick={() => sShowForm(true)}
            style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: colors.nv, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Nueva Votación
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: cardBg, border: `1px solid ${colors.g2}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>Nueva Votación</span>
            <button onClick={resetForm} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: colors.g4 }}>✕</button>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5, display: "block", marginBottom: 4 }}>Título *</label>
            <input value={fTit} onChange={(e) => sFTit(e.target.value)} placeholder="Ej: Nuevo horario gimnasio"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${fTit ? colors.gn : colors.g3}`, fontSize: 13, color: colors.nv, background: isDark ? "#1E293B" : "#fff", boxSizing: "border-box" as const }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5, display: "block", marginBottom: 4 }}>Descripción</label>
            <textarea value={fDesc} onChange={(e) => sFDesc(e.target.value)} rows={2} placeholder="Describí la propuesta..."
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.g3}`, fontSize: 12, color: colors.nv, background: isDark ? "#1E293B" : "#fff", resize: "vertical" as const, boxSizing: "border-box" as const }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5, display: "block", marginBottom: 6 }}>Tipo de votación</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {TIPOS.map((t) => (
                <button key={t.k} onClick={() => sFTipo(t.k)}
                  style={{ flex: 1, minWidth: 140, padding: "10px 12px", borderRadius: 10, border: `2px solid ${fTipo === t.k ? colors.nv : colors.g2}`, background: fTipo === t.k ? colors.nv + "15" : (isDark ? "#1E293B" : "#fff"), textAlign: "left" as const, cursor: "pointer" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: fTipo === t.k ? colors.nv : colors.g5 }}>{t.l}</div>
                  <div style={{ fontSize: 10, color: colors.g4, marginTop: 2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn v="g" onClick={resetForm}>Cancelar</Btn>
            <Btn v="p" disabled={!fTit.trim() || saving} onClick={crearVotacion}>
              {saving ? "Guardando..." : "🗳️ Crear Votación"}
            </Btn>
          </div>
        </div>
      )}

      {/* Activas */}
      {view === "activas" && (
        activas.length === 0
          ? <div style={{ textAlign: "center", padding: "32px 0", color: colors.g4 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗳️</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>No hay votaciones activas</div>
              {canCreate && <div style={{ fontSize: 11, marginTop: 4 }}>Creá una nueva votación arriba</div>}
            </div>
          : activas.map((v: any) => <VotCard key={v.id} v={v} />)
      )}

      {/* Historial */}
      {view === "historial" && (
        historial.length === 0
          ? <div style={{ textAlign: "center", padding: "32px 0", color: colors.g4 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Sin historial aún</div>
            </div>
          : Object.entries(historialByMonth).sort(([a], [b]) => b.localeCompare(a)).map(([month, vots]) => (
              <div key={month} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: colors.g4, textTransform: "uppercase" as const, letterSpacing: 1 }}>
                    📅 {monthLabel(month)}
                  </span>
                  <div style={{ flex: 1, height: 1, background: colors.g2 }} />
                </div>
                {(vots as any[]).map((v: any) => <VotCard key={v.id} v={v} />)}
              </div>
            ))
      )}
        </>
      )}
    </div>
  );
}
