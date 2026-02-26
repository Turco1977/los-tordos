"use client";
import { useState } from "react";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { uploadFile, getFileIcon } from "@/lib/storage";

export function NewFactura({ user, mob, onSub, onX }: {
  user: any; mob: boolean;
  onSub: (data: { titulo: string; proveedor: string; monto: number; moneda: string; nro_factura: string; fecha_factura: string; notas: string; fileUrl: string; fileName: string; mimeType: string; fileSize: number }) => Promise<void>;
  onX: () => void;
}) {
  const { colors, isDark, cardBg } = useC();

  const [titulo, sTitulo] = useState("");
  const [proveedor, sProveedor] = useState("");
  const [monto, sMonto] = useState("");
  const [moneda, sMoneda] = useState("ARS");
  const [nroFactura, sNroFactura] = useState("");
  const [fechaFactura, sFechaFactura] = useState("");
  const [notas, sNotas] = useState("");
  const [fileUrl, sFileUrl] = useState("");
  const [fileName, sFileName] = useState("");
  const [mimeType, sMimeType] = useState("");
  const [fileSize, sFileSize] = useState(0);
  const [uploading, sUploading] = useState(false);
  const [saving, sSaving] = useState(false);
  const [error, sError] = useState("");

  const handleFile = async (file: File) => {
    sUploading(true);
    sError("");
    const res = await uploadFile(file, "facturas");
    if ("error" in res) {
      sError(res.error);
      sUploading(false);
      return;
    }
    sFileUrl(res.url);
    sFileName(file.name);
    sMimeType(file.type);
    sFileSize(file.size);
    sUploading(false);
  };

  const canSave = titulo.trim() && proveedor.trim() && Number(monto) > 0 && fileUrl;

  const handleSave = async () => {
    if (!canSave) return;
    sSaving(true);
    try {
      await onSub({
        titulo: titulo.trim(),
        proveedor: proveedor.trim(),
        monto: Number(monto),
        moneda,
        nro_factura: nroFactura.trim(),
        fecha_factura: fechaFactura,
        notas: notas.trim(),
        fileUrl,
        fileName,
        mimeType,
        fileSize,
      });
    } catch {
      sError("Error al guardar");
    }
    sSaving(false);
  };

  const inputSt: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid " + colors.g2, fontSize: 13, background: isDark ? colors.g1 : "#fff", color: colors.nv, boxSizing: "border-box" };
  const labelSt: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: colors.nv, marginBottom: 4, display: "block" };
  const reqSt: React.CSSProperties = { color: "#DC2626", marginLeft: 2 };

  return (
    <Card style={{ maxWidth: 520, margin: "0 auto", padding: mob ? 16 : 24 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: mob ? 16 : 18, fontWeight: 800, color: colors.nv }}>
        {"\u{1F9FE}"} Nueva Factura
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: colors.g4 }}>
        Cargá el archivo y completá los datos del proveedor
      </p>

      {/* File upload */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelSt}>Archivo<span style={reqSt}>*</span></label>
        {fileUrl ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: isDark ? colors.g1 : "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0" }}>
            <span style={{ fontSize: 20 }}>{getFileIcon(fileName)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.nv, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
            <button onClick={() => { sFileUrl(""); sFileName(""); }} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: colors.g4 }}>{"\u2715"}</button>
          </div>
        ) : (
          <div>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv" disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              style={{ fontSize: 13 }}
            />
            {uploading && <span style={{ fontSize: 12, color: colors.g4, marginLeft: 8 }}>Subiendo...</span>}
          </div>
        )}
      </div>

      {/* Titulo */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelSt}>Titulo<span style={reqSt}>*</span></label>
        <input value={titulo} onChange={e => sTitulo(e.target.value)} placeholder="Ej: Pelotas de rugby" style={inputSt} />
      </div>

      {/* Proveedor */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelSt}>Proveedor<span style={reqSt}>*</span></label>
        <input value={proveedor} onChange={e => sProveedor(e.target.value)} placeholder="Ej: Gilbert" style={inputSt} />
      </div>

      {/* Monto + Moneda */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={labelSt}>Monto<span style={reqSt}>*</span></label>
          <input type="number" value={monto} onChange={e => sMonto(e.target.value)} placeholder="2222" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Moneda</label>
          <select value={moneda} onChange={e => sMoneda(e.target.value)} style={inputSt}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Nro factura + Fecha */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={labelSt}>Nro Factura</label>
          <input value={nroFactura} onChange={e => sNroFactura(e.target.value)} placeholder="Opcional" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Fecha Factura</label>
          <input type="date" value={fechaFactura} onChange={e => sFechaFactura(e.target.value)} style={inputSt} />
        </div>
      </div>

      {/* Notas */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelSt}>Notas</label>
        <input value={notas} onChange={e => sNotas(e.target.value)} placeholder="Observaciones (opcional)" style={inputSt} />
      </div>

      {error && <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 10 }}>{error}</div>}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn v="p" s="s" onClick={handleSave} disabled={!canSave || saving}>{saving ? "Guardando..." : "Guardar Factura"}</Btn>
        <Btn v="g" s="s" onClick={onX}>Cancelar</Btn>
      </div>
    </Card>
  );
}
