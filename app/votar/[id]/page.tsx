"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fn } from "@/lib/constants";

const sb = createClient();

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

export default function VotarPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, sLoading] = useState(true);
  const [user, sUser] = useState<any>(null);
  const [votacion, sVotacion] = useState<any>(null);
  const [votos, sVotos] = useState<any[]>([]);
  const [miVoto, sMiVoto] = useState<string | null>(null);
  const [saving, sSaving] = useState(false);
  const [toast, sToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [notFound, sNotFound] = useState(false);

  const showToast = (msg: string, ok = true) => {
    sToast({ msg, ok });
    setTimeout(() => sToast(null), 3500);
  };

  // Load session + votacion in parallel
  useEffect(() => {
    (async () => {
      const [{ data: { user: u } }, votRes, votosRes] = await Promise.all([
        sb.auth.getUser(),
        sb.from("votaciones").select("*").eq("id", id).single(),
        sb.from("votos").select("*").eq("votacion_id", id),
      ]);

      if (!votRes.data) { sNotFound(true); sLoading(false); return; }
      sVotacion(votRes.data);
      sVotos(votosRes.data || []);

      if (u) {
        // Load profile
        const { data: profile } = await sb.from("profiles").select("*").eq("id", u.id).single();
        sUser(profile || u);
        const mv = (votosRes.data || []).find((v: any) => v.user_id === u.id);
        if (mv) sMiVoto(mv.voto);
      }
      sLoading(false);
    })();
  }, [id]);

  async function votar(voto: string) {
    if (!user) {
      // Redirect to login with redirect param
      router.push(`/?redirect=/votar/${id}`);
      return;
    }
    if (votacion?.estado !== "abierta") { showToast("Esta votación ya está cerrada", false); return; }
    if (miVoto) { showToast("Ya registraste tu voto", false); return; }
    sSaving(true);
    try {
      const { error } = await sb.from("votos").insert({
        votacion_id: Number(id),
        user_id: user.id,
        user_name: fn(user),
        voto,
        created_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      sMiVoto(voto);
      sVotos(prev => [...prev, { votacion_id: Number(id), user_id: user.id, user_name: fn(user), voto }]);
      showToast("✅ Voto registrado: " + voto.toUpperCase());
    } catch (e: any) {
      showToast(e.message || "Error al votar", false);
    } finally {
      sSaving(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>Cargando votación...</div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <div style={{ textAlign: "center", color: "#94a3b8" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗳️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Votación no encontrada</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>El link puede haber expirado o ser incorrecto</div>
      </div>
    </div>
  );

  const si = votos.filter((v: any) => v.voto === "si").length;
  const no = votos.filter((v: any) => v.voto === "no").length;
  const abs = votos.filter((v: any) => v.voto === "abstencion").length;
  const total = votos.length;
  const abierta = votacion?.estado === "abierta";
  const tipoLabel = votacion?.tipo === "cd" ? "🏛️ Comisión Directiva" : "⚡ Secretaría Ejecutiva";

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding: "20px 16px" }}>
      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#10B981" : "#EF4444", color: "#fff", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🗳️</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Los Tordos Rugby Club</div>
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 16 }}>{tipoLabel}</div>
        </div>

        {/* Votacion card */}
        <div style={{ background: "#1e293b", borderRadius: 16, padding: 24, marginBottom: 20, border: "1px solid #334155" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: abierta ? "#10B981" : "#64748b" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: abierta ? "#10B981" : "#64748b" }}>
              {abierta ? "VOTACIÓN ABIERTA" : "VOTACIÓN CERRADA"}
            </span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 8, lineHeight: 1.3 }}>{votacion.titulo}</div>
          {votacion.descripcion && <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, marginBottom: 16 }}>{votacion.descripcion}</div>}

          {/* Results bars */}
          <div style={{ marginBottom: 20 }}>
            {[
              { k: "si", label: "✅ Sí", count: si, color: "#10B981" },
              { k: "no", label: "❌ No", count: no, color: "#EF4444" },
              { k: "abstencion", label: "⚪ Abstención", count: abs, color: "#64748b" },
            ].map(opt => (
              <div key={opt.k} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#cbd5e1", marginBottom: 3 }}>
                  <span style={{ fontWeight: miVoto === opt.k ? 800 : 600, color: miVoto === opt.k ? opt.color : "#cbd5e1" }}>{opt.label} {miVoto === opt.k ? "← tu voto" : ""}</span>
                  <span style={{ fontWeight: 700 }}>{opt.count} ({pct(opt.count, total)}%)</span>
                </div>
                <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: pct(opt.count, total) + "%", background: opt.color, borderRadius: 3, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: "#475569", marginTop: 8, textAlign: "right" }}>{total} voto{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}</div>
          </div>

          {/* Vote buttons */}
          {abierta && !miVoto && (
            <div>
              {!user && (
                <div style={{ background: "#1e3a5f", border: "1px solid #1d4ed8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#93c5fd" }}>
                  🔐 Necesitás iniciar sesión para votar
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { k: "si", icon: "✅", label: "Sí", bg: "#065f46", border: "#10B981", color: "#10B981" },
                  { k: "no", icon: "❌", label: "No", bg: "#7f1d1d", border: "#EF4444", color: "#EF4444" },
                  { k: "abstencion", icon: "⚪", label: "Me abstengo", bg: "#1e293b", border: "#475569", color: "#94a3b8" },
                ].map(opt => (
                  <button key={opt.k} onClick={() => votar(opt.k)} disabled={saving}
                    style={{ padding: "14px 8px", borderRadius: 12, border: "2px solid " + opt.border, background: opt.bg, color: opt.color, fontWeight: 800, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: saving ? 0.6 : 1 }}>
                    <span style={{ fontSize: 22 }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {miVoto && (
            <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>
                {miVoto === "si" ? "✅" : miVoto === "no" ? "❌" : "⚪"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Tu voto fue registrado</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Votaste: <strong style={{ color: miVoto === "si" ? "#10B981" : miVoto === "no" ? "#EF4444" : "#94a3b8" }}>
                  {miVoto === "si" ? "SÍ" : miVoto === "no" ? "NO" : "ABSTENCIÓN"}
                </strong>
              </div>
            </div>
          )}

          {!abierta && !miVoto && (
            <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
              Esta votación ya cerró. No se aceptan más votos.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 10, color: "#334155" }}>
          Los Tordos Rugby Club · Sistema de Votaciones
        </div>

        {/* Login CTA if not logged in */}
        {!user && abierta && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button onClick={() => router.push(`/?redirect=/votar/${id}`)}
              style={{ padding: "10px 24px", borderRadius: 10, background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
              Iniciar sesión para votar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
