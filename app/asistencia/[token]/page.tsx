"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const T = { nv: "#0A1628", rd: "#C8102E", g1: "#F7F8FA", g2: "#E8ECF1", g3: "#CBD2DC", g4: "#8B95A5", gn: "#10B981" };

export default function AsistenciaQR() {
  const params = useParams();
  const token = params.token as string;
  const [sesion, setSesion] = useState<any>(null);
  const [dni, setDni] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error" | "closed">("loading");
  const [msg, setMsg] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/hockey/asistencia/qr?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus("closed"); setMsg(d.error); }
        else { setSesion(d); setStatus("ready"); }
      })
      .catch(() => { setStatus("error"); setMsg("Error de conexión"); });
  }, [token]);

  const submit = async () => {
    if (!dni.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/hockey/asistencia/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, dni: dni.trim() }),
      });
      const d = await res.json();
      if (d.error) { setStatus("error"); setMsg(d.error); }
      else { setStatus("success"); setNombre(d.nombre); }
    } catch {
      setStatus("error"); setMsg("Error de conexión");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${T.nv}, ${T.rd})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <img src="/logo.jpg" alt="Los Tordos" style={{ width: 80, height: 80, objectFit: "contain", margin: "0 auto 16px", display: "block" }} />
        <h1 style={{ color: "#fff", fontSize: 22, margin: "0 0 4px", fontWeight: 800 }}>Asistencia Hockey</h1>

        {status === "loading" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, marginTop: 20, boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
            <div style={{ fontSize: 14, color: T.g4 }}>Cargando...</div>
          </div>
        )}

        {status === "closed" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, marginTop: 20, boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.nv, marginBottom: 4 }}>Sesión no disponible</div>
            <div style={{ fontSize: 13, color: T.g4 }}>{msg}</div>
          </div>
        )}

        {status === "ready" && sesion && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, marginTop: 20, boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
            <div style={{ fontSize: 13, color: T.g4, marginBottom: 4 }}>{sesion.tipo_actividad} — {sesion.division}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.nv, marginBottom: 20 }}>{sesion.fecha}</div>
            <div style={{ marginBottom: 8, textAlign: "left" as const }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.g4 }}>Tu DNI</label>
            </div>
            <input
              value={dni} onChange={e => setDni(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submit(); }}
              placeholder="Ej: 42123456"
              inputMode="numeric"
              autoFocus
              style={{ width: "100%", padding: 14, borderRadius: 10, border: "2px solid " + T.g3, fontSize: 18, textAlign: "center", fontWeight: 700, boxSizing: "border-box", letterSpacing: 2 }}
            />
            <button onClick={submit} disabled={!dni.trim()} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.rd, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 12, opacity: dni.trim() ? 1 : 0.5 }}>
              Presente
            </button>
          </div>
        )}

        {status === "success" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, marginTop: 20, boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.gn, marginBottom: 4 }}>Presente!</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.nv }}>{nombre}</div>
            <div style={{ fontSize: 12, color: T.g4, marginTop: 8 }}>Tu asistencia fue registrada</div>
          </div>
        )}

        {status === "error" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, marginTop: 20, boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.rd, marginBottom: 4 }}>Error</div>
            <div style={{ fontSize: 13, color: T.g4, marginBottom: 16 }}>{msg}</div>
            <button onClick={() => { setStatus("ready"); setMsg(""); setDni(""); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: T.nv, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
