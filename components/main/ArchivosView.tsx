"use client";
import { useState, useMemo } from "react";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import { uploadFile, getFileIcon, formatFileSize } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { fn } from "@/lib/constants";

const supabase = createClient();
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
  const sArchivos = useDataStore(s => s.sArchivos);
  const users = useDataStore(s => s.users);
  const { colors, isDark, cardBg } = useC();

  const [tab, sTab] = useState<Tab>("todos");
  const [search, sSr] = useState("");
  const [uploading, sUploading] = useState(false);
  const [showUpload, sShowUpload] = useState(false);
  const [facturaForm, sFacturaForm] = useState<any>(null);
  const [detailId, sDetailId] = useState<number | null>(null);
  const [editForm, sEditForm] = useState<any>(null);

  // Filtered list
  const filtered = useMemo(() => {
    let r = [...(archivos || [])];
    if (tab !== "todos") r = r.filter((a: any) => a.category === tab);
    if (search) {
      const s = search.toLowerCase();
      r = r.filter((a: any) =>
        ((a.name || "") + (a.proveedor || "") + (a.nro_factura || "") + (a.notas || "")).toLowerCase().includes(s)
      );
    }
    return r;
  }, [archivos, tab, search]);

  // KPIs
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
    const dt = new Date(d);
    return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  // Upload factura
  const handleUploadFactura = async (file: File) => {
    sUploading(true);
    const res = await uploadFile(file, "facturas");
    if ("error" in res) { showT(res.error, "err"); sUploading(false); return; }
    // Fetch the newly created archivos record
    const { data } = await supabase.from("archivos").select("*").eq("url", res.url).maybeSingle();
    if (data) {
      sArchivos(prev => [data, ...prev]);
      sFacturaForm({ id: data.id, proveedor: "", monto: "", moneda: "ARS", nro_factura: "", fecha_factura: "", notas: "" });
    }
    sUploading(false);
    showT("Archivo subido");
  };

  // Save factura metadata
  const saveFactura = async () => {
    if (!facturaForm) return;
    const upd: any = {};
    if (facturaForm.proveedor) upd.proveedor = facturaForm.proveedor;
    if (facturaForm.monto) upd.monto = Number(facturaForm.monto);
    if (facturaForm.moneda) upd.moneda = facturaForm.moneda;
    if (facturaForm.nro_factura) upd.nro_factura = facturaForm.nro_factura;
    if (facturaForm.fecha_factura) upd.fecha_factura = facturaForm.fecha_factura;
    if (facturaForm.notas) upd.notas = facturaForm.notas;
    if (Object.keys(upd).length > 0) {
      sArchivos(prev => prev.map((a: any) => a.id === facturaForm.id ? { ...a, ...upd } : a));
      await supabase.from("archivos").update(upd).eq("id", facturaForm.id);
    }
    sFacturaForm(null);
    sShowUpload(false);
    showT("Factura guardada");
  };

  // Save edited detail
  const saveDetail = async () => {
    if (!editForm || !detailId) return;
    const upd: any = {};
    if (editForm.proveedor !== undefined) upd.proveedor = editForm.proveedor;
    if (editForm.monto !== undefined) upd.monto = editForm.monto ? Number(editForm.monto) : null;
    if (editForm.moneda) upd.moneda = editForm.moneda;
    if (editForm.nro_factura !== undefined) upd.nro_factura = editForm.nro_factura;
    if (editForm.fecha_factura !== undefined) upd.fecha_factura = editForm.fecha_factura || null;
    if (editForm.notas !== undefined) upd.notas = editForm.notas;
    sArchivos(prev => prev.map((a: any) => a.id === detailId ? { ...a, ...upd } : a));
    await supabase.from("archivos").update(upd).eq("id", detailId);
    sDetailId(null);
    sEditForm(null);
    showT("Actualizado");
  };

  // Open detail
  const openDetail = (a: any) => {
    if (a.category === "factura") {
      sDetailId(a.id);
      sEditForm({ proveedor: a.proveedor || "", monto: a.monto || "", moneda: a.moneda || "ARS", nro_factura: a.nro_factura || "", fecha_factura: a.fecha_factura || "", notas: a.notas || "" });
    } else {
      window.open(a.url, "_blank");
    }
  };

  const inputSt: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid " + colors.g2, fontSize: 13, background: isDark ? colors.g1 : "#fff", color: colors.nv };
  const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: colors.g4, marginBottom: 2, display: "block" };
  const kpiSt: React.CSSProperties = { textAlign: "center", padding: mob ? "8px 12px" : "10px 16px", background: cardBg, borderRadius: 10, border: "1px solid " + colors.g2, minWidth: mob ? 70 : 90 };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: mob ? 16 : 19, fontWeight: 800, color: colors.nv }}>
            {"\u{1F4C2}"} Archivos
          </h2>
          <p style={{ margin: 0, fontSize: 11, color: colors.g4 }}>{total} archivos</p>
        </div>
        <Btn v="p" s="s" onClick={() => { sShowUpload(true); sFacturaForm(null); }}>+ Subir factura</Btn>
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
        <input value={search} onChange={e => sSr(e.target.value)} placeholder="Buscar por nombre, proveedor..." style={{ ...inputSt, maxWidth: 340 }} />
      </div>

      {/* Upload factura panel */}
      {showUpload && (
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: colors.nv }}>Subir factura</div>
          {!facturaForm ? (
            <div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv" disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFactura(f); }}
                style={{ fontSize: 13 }}
              />
              {uploading && <span style={{ fontSize: 12, color: colors.g4, marginLeft: 8 }}>Subiendo...</span>}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
              <div><label style={labelSt}>Proveedor</label><input value={facturaForm.proveedor} onChange={e => sFacturaForm({ ...facturaForm, proveedor: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>Monto</label><input type="number" value={facturaForm.monto} onChange={e => sFacturaForm({ ...facturaForm, monto: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>Moneda</label><select value={facturaForm.moneda} onChange={e => sFacturaForm({ ...facturaForm, moneda: e.target.value })} style={inputSt}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
              <div><label style={labelSt}>Nro Factura</label><input value={facturaForm.nro_factura} onChange={e => sFacturaForm({ ...facturaForm, nro_factura: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>Fecha Factura</label><input type="date" value={facturaForm.fecha_factura} onChange={e => sFacturaForm({ ...facturaForm, fecha_factura: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>Notas</label><input value={facturaForm.notas} onChange={e => sFacturaForm({ ...facturaForm, notas: e.target.value })} style={inputSt} /></div>
              <div style={{ gridColumn: mob ? undefined : "1/-1", display: "flex", gap: 8, marginTop: 4 }}>
                <Btn v="p" s="s" onClick={saveFactura}>Guardar</Btn>
                <Btn v="g" s="s" onClick={() => { sShowUpload(false); sFacturaForm(null); }}>Cancelar</Btn>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Detail panel for factura */}
      {detailId && editForm && (() => {
        const arch = (archivos || []).find((a: any) => a.id === detailId);
        if (!arch) return null;
        return (
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: colors.nv }}>
                {getFileIcon(arch.name)} {arch.name}
              </div>
              <button onClick={() => { sDetailId(null); sEditForm(null); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: colors.g4 }}>{"\u2715"}</button>
            </div>
            {isImage(arch.name) && <img src={arch.url} alt={arch.name} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, marginBottom: 10, objectFit: "contain" }} />}
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
              <div><label style={labelSt}>Proveedor</label><input value={editForm.proveedor} onChange={e => sEditForm({ ...editForm, proveedor: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>Monto</label><input type="number" value={editForm.monto} onChange={e => sEditForm({ ...editForm, monto: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>Moneda</label><select value={editForm.moneda} onChange={e => sEditForm({ ...editForm, moneda: e.target.value })} style={inputSt}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
              <div><label style={labelSt}>Nro Factura</label><input value={editForm.nro_factura} onChange={e => sEditForm({ ...editForm, nro_factura: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>Fecha Factura</label><input type="date" value={editForm.fecha_factura} onChange={e => sEditForm({ ...editForm, fecha_factura: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>Notas</label><input value={editForm.notas} onChange={e => sEditForm({ ...editForm, notas: e.target.value })} style={inputSt} /></div>
              <div style={{ gridColumn: mob ? undefined : "1/-1", display: "flex", gap: 8, marginTop: 4 }}>
                <Btn v="p" s="s" onClick={saveDetail}>Guardar</Btn>
                <Btn v="g" s="s" onClick={() => window.open(arch.url, "_blank")}>Descargar</Btn>
                <Btn v="g" s="s" onClick={() => { sDetailId(null); sEditForm(null); }}>Cerrar</Btn>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.g4, fontSize: 13 }}>
          {search ? "Sin resultados" : "No hay archivos"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {filtered.map((a: any) => (
            <Card key={a.id} onClick={() => openDetail(a)} style={{ padding: 12, cursor: "pointer", position: "relative" }}>
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

              {/* Name */}
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.nv, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.name}>
                {a.name}
              </div>

              {/* Proveedor for facturas */}
              {a.category === "factura" && a.proveedor && (
                <div style={{ fontSize: 10, color: colors.g4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.proveedor}
                  {a.monto ? ` - ${a.moneda || "$"} ${Number(a.monto).toLocaleString("es-AR")}` : ""}
                </div>
              )}

              {/* Date + uploader */}
              <div style={{ fontSize: 10, color: colors.g4, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                <span>{fmtDate(a.created_at)}</span>
                <span>{userName(a.uploaded_by)}</span>
              </div>

              {/* Size */}
              {a.size_bytes && <div style={{ fontSize: 9, color: colors.g4, marginTop: 2 }}>{formatFileSize(a.size_bytes)}</div>}

              {/* Download button */}
              <div style={{ marginTop: 6, textAlign: "center" }}>
                <button onClick={e => { e.stopPropagation(); window.open(a.url, "_blank"); }} style={{
                  background: "none", border: "1px solid " + colors.g2, borderRadius: 6, padding: "4px 10px",
                  fontSize: 11, cursor: "pointer", color: colors.bl,
                }} title="Descargar">
                  {"\u2B07\uFE0F"} Descargar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
