"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import { getFileIcon, formatFileSize } from "@/lib/storage";
import { fn } from "@/lib/constants";

type Tab = "todos" | "tarea" | "factura" | "presupuesto";
const TABS: { k: Tab; l: string }[] = [
  { k: "todos", l: "Todos" },
  { k: "tarea", l: "Tareas" },
  { k: "factura", l: "Facturas" },
  { k: "presupuesto", l: "Presupuestos" },
];

const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

export function ArchivosView({ user, mob, showT }: any) {
  const archivos = useDataStore(s => s.archivos);
  const users = useDataStore(s => s.users);
  const { colors, isDark, cardBg } = useC();

  const [tab, sTab] = useState<Tab>("todos");
  const [search, sSr] = useState("");

  const filtered = useMemo(() => {
    let r = [...(archivos || [])];
    if (tab !== "todos") r = r.filter((a: any) => a.category === tab);
    if (search) {
      const s = search.toLowerCase();
      r = r.filter((a: any) =>
        ((a.titulo || "") + (a.name || "") + (a.proveedor || "") + (a.nro_factura || "") + (a.notas || "")).toLowerCase().includes(s)
      );
    }
    return r;
  }, [archivos, tab, search]);

  const total = (archivos || []).length;
  const nFacturas = (archivos || []).filter((a: any) => a.category === "factura").length;
  const nTareas = (archivos || []).filter((a: any) => a.category === "tarea").length;
  const nPresu = (archivos || []).filter((a: any) => a.category === "presupuesto").length;

  const userName = (uid: string) => {
    const u = (users || []).find((u: any) => u.id === uid);
    return u ? fn(u) : "";
  };

  const fmtDate = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const inputSt: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid " + colors.g2, fontSize: 13, background: isDark ? colors.g1 : "#fff", color: colors.nv };
  const kpiSt: React.CSSProperties = { textAlign: "center", padding: mob ? "8px 12px" : "10px 16px", background: cardBg, borderRadius: 10, border: "1px solid " + colors.g2, minWidth: mob ? 70 : 90 };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 19, fontWeight: 800, color: colors.nv }}>
          {"\u{1F4C2}"} Archivos
        </h2>
        <p style={{ margin: 0, fontSize: 11, color: colors.g4 }}>{total} archivos</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <div style={kpiSt}><div style={{ fontSize: 18, fontWeight: 800, color: colors.nv }}>{total}</div><div style={{ fontSize: 10, color: colors.g4 }}>Total</div></div>
        <div style={kpiSt}><div style={{ fontSize: 18, fontWeight: 800, color: "#EF4444" }}>{nFacturas}</div><div style={{ fontSize: 10, color: colors.g4 }}>Facturas</div></div>
        <div style={kpiSt}><div style={{ fontSize: 18, fontWeight: 800, color: colors.bl }}>{nTareas}</div><div style={{ fontSize: 10, color: colors.g4 }}>Tareas</div></div>
        <div style={kpiSt}><div style={{ fontSize: 18, fontWeight: 800, color: colors.gn }}>{nPresu}</div><div style={{ fontSize: 10, color: colors.g4 }}>Presupuestos</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => sTab(t.k)} style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid " + (tab === t.k ? colors.bl : colors.g2),
            background: tab === t.k ? colors.bl : "transparent", color: tab === t.k ? "#fff" : colors.g4,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{t.l}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => sSr(e.target.value)} placeholder="Buscar por titulo, nombre, proveedor..." style={{ ...inputSt, maxWidth: 340 }} />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.g4, fontSize: 13 }}>
          {search ? "Sin resultados" : "No hay archivos"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {filtered.map((a: any) => (
            <Card key={a.id} onClick={() => window.open(a.url, "_blank")} style={{ padding: 12, cursor: "pointer", position: "relative" }}>
              {/* Category badge */}
              <div style={{
                position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                background: a.category === "factura" ? "#FEE2E2" : a.category === "tarea" ? "#DBEAFE" : a.category === "presupuesto" ? "#D1FAE5" : colors.g2,
                color: a.category === "factura" ? "#DC2626" : a.category === "tarea" ? "#2563EB" : a.category === "presupuesto" ? "#059669" : colors.g4,
              }}>
                {a.category === "factura" ? "Factura" : a.category === "tarea" ? "Tarea" : a.category === "presupuesto" ? "Presu" : "Otro"}
              </div>

              {/* Thumbnail or icon */}
              <div style={{ textAlign: "center", marginBottom: 8, marginTop: 4 }}>
                {isImage(a.name) ? (
                  <img src={a.url} alt={a.name} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6 }} />
                ) : (
                  <div style={{ fontSize: 36, lineHeight: 1 }}>{getFileIcon(a.name)}</div>
                )}
              </div>

              {/* Titulo (primary) or filename */}
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.titulo || a.name}>
                {a.titulo || a.name}
              </div>

              {/* Proveedor + monto for facturas */}
              {a.category === "factura" && a.proveedor && (
                <div style={{ fontSize: 10, color: colors.g4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.proveedor}
                  {a.monto ? ` - ${a.moneda || "$"} ${Number(a.monto).toLocaleString("es-AR")}` : ""}
                </div>
              )}

              {/* Filename (if titulo is different) */}
              {a.titulo && <div style={{ fontSize: 9, color: colors.g4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>}

              {/* Date + uploader */}
              <div style={{ fontSize: 10, color: colors.g4, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                <span>{fmtDate(a.created_at)}</span>
                <span>{userName(a.uploaded_by)}</span>
              </div>

              {/* Size */}
              {a.size_bytes && <div style={{ fontSize: 9, color: colors.g4, marginTop: 2 }}>{formatFileSize(a.size_bytes)}</div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
