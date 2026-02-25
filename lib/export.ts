/**
 * Export utilities for CSV and PDF generation.
 * No external dependencies — uses browser APIs only.
 */

/* ── CSV ── */
export function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? '"' + s.replace(/"/g, '""') + '"'
      : s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename + ".csv");
}

/* ── PDF (simple table layout using browser print) ── */
export function exportPDF(title: string, headers: string[], rows: string[][], options?: { landscape?: boolean }) {
  const esc = (s: string) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: ${options?.landscape ? "landscape" : "portrait"}; margin: 12mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; color: #1a1a1a; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 10px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0A1628; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 700; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e5e5; font-size: 10px; }
  tr:nth-child(even) { background: #f9f9f9; }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .logo img { width: 40px; height: 40px; object-fit: contain; }
</style></head><body>
<div class="logo"><img src="/logo.jpg" alt=""><div><h1>${esc(title)}</h1><div class="meta">Los Tordos Rugby Club · Generado: ${new Date().toLocaleDateString("es-AR")}</div></div></div>
<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

/* ── MINUTA PDF (downloadable file via html2pdf.js) ── */
type MinutaData = {type:string;typeTitle:string;areaName?:string;date:string;horaInicio?:string;horaCierre?:string;lugar?:string;presentes?:string[];ausentes?:string[];sections?:{title:string;content:string}[];tareas?:{desc:string;resp:string;fecha:string}[];status:string};

function buildMinutaHTML(mi: MinutaData): string {
  const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const fmtD = (d: string) => { if (!d) return "–"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#1a1a1a;line-height:1.5;padding:10px;">
<div style="text-align:center;border-bottom:3px solid #0A1628;padding-bottom:12px;margin-bottom:16px;">
  <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;">Los Tordos Rugby Club</div>
  <h1 style="font-size:18px;margin:4px 0 0;color:#0A1628;">Minuta – ${esc(mi.typeTitle)}${mi.areaName ? " · " + esc(mi.areaName) : ""}</h1>
  <div style="display:flex;justify-content:center;gap:16px;margin-top:6px;font-size:11px;color:#555;"><span>📅 ${fmtD(mi.date)}</span>${mi.horaInicio ? `<span>🕐 ${mi.horaInicio} – ${mi.horaCierre || ""}</span>` : ""}${mi.lugar ? `<span>📍 ${esc(mi.lugar)}</span>` : ""}</div>
  <div style="margin-top:6px"><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:10px;font-weight:600;${mi.status === "final" ? "background:#D1FAE5;color:#065F46" : "background:#FEF3C7;color:#92400E"}">${mi.status === "final" ? "✅ Finalizada" : "📝 Borrador"}</span></div>
</div>
${(mi.presentes?.length || mi.ausentes?.length) ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;"><div><div style="font-size:11px;font-weight:700;color:#059669;margin-bottom:4px;text-transform:uppercase;">✅ Presentes</div><ul style="margin:0;padding-left:16px;">${(mi.presentes || []).map(p => `<li style="font-size:11px;">${esc(p)}</li>`).join("")}</ul></div><div><div style="font-size:11px;font-weight:700;color:#DC2626;margin-bottom:4px;text-transform:uppercase;">❌ Ausentes</div><ul style="margin:0;padding-left:16px;">${(mi.ausentes || []).length ? (mi.ausentes || []).map(a => `<li style="font-size:11px;">${esc(a)}</li>`).join("") : "<li style='font-size:11px;'>–</li>"}</ul></div></div>` : ""}
${(mi.sections || []).map((s, i) => `<div style="margin-bottom:14px;"><h3 style="font-size:13px;font-weight:700;color:#0A1628;border-bottom:1px solid #e5e5e5;padding-bottom:4px;margin:0 0 6px;">${i + 1}. ${esc(s.title)}</h3><p style="margin:0;padding-left:8px;font-size:11px;color:#333;white-space:pre-wrap;">${s.content ? esc(s.content) : "–"}</p></div>`).join("")}
${mi.tareas?.length ? `<div style="margin-top:16px;"><h3 style="font-size:13px;font-weight:700;color:#92400E;margin:0 0 8px;">📋 Tareas asignadas (${mi.tareas.length})</h3><table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Tarea</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Responsable</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Fecha</th></tr></thead><tbody>${mi.tareas.map((t, i) => `<tr style="background:${i % 2 ? "#f9f9f9" : "#fff"}"><td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;">${esc(t.desc)}</td><td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;">${esc(t.resp)}</td><td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;">${fmtD(t.fecha)}</td></tr>`).join("")}</tbody></table></div>` : ""}
<div style="margin-top:20px;text-align:center;font-size:9px;color:#999;border-top:1px solid #e5e5e5;padding-top:8px;">Los Tordos Rugby Club · Generado: ${new Date().toLocaleDateString("es-AR")}</div>
</div>`;
}

async function loadHtml2Pdf(): Promise<any> {
  if ((window as any).html2pdf) return (window as any).html2pdf;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js";
    script.onload = () => resolve((window as any).html2pdf);
    script.onerror = () => reject(new Error("No se pudo cargar html2pdf"));
    document.head.appendChild(script);
  });
}

export async function exportMinutaPDF(mi: MinutaData) {
  const html = buildMinutaHTML(mi);
  const el = document.createElement("div");
  el.innerHTML = html;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.width = "210mm";
  document.body.appendChild(el);

  try {
    const html2pdf = await loadHtml2Pdf();
    const fmtD = (d: string) => { if (!d) return ""; const [y, m, dd] = d.split("-"); return `${dd}-${m}-${y}`; };
    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `Minuta_${mi.typeTitle.replace(/\s/g, "_")}_${fmtD(mi.date)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(el).save();
  } finally {
    document.body.removeChild(el);
  }
}

/* ── MINUTA WORD (HTML-based .doc) ── */
export function exportMinutaWord(mi: {type:string;typeTitle:string;areaName?:string;date:string;horaInicio?:string;horaCierre?:string;lugar?:string;presentes?:string[];ausentes?:string[];sections?:{title:string;content:string}[];tareas?:{desc:string;resp:string;fecha:string}[];status:string}) {
  const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const fmtD = (d: string) => { if (!d) return "–"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Minuta</title>
<style>
  body { font-family: Calibri, sans-serif; font-size: 12pt; color: #1a1a1a; line-height: 1.5; }
  h1 { font-size: 18pt; color: #0A1628; text-align: center; margin-bottom: 2pt; }
  h2 { font-size: 14pt; color: #0A1628; border-bottom: 1px solid #ccc; padding-bottom: 4pt; margin-top: 14pt; }
  .center { text-align: center; }
  .meta { text-align: center; color: #666; font-size: 10pt; }
  .section-content { padding-left: 10pt; font-size: 11pt; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; margin-top: 8pt; }
  th { background: #0A1628; color: #fff; padding: 4pt 6pt; text-align: left; font-size: 10pt; }
  td { padding: 4pt 6pt; border: 1px solid #ddd; font-size: 10pt; }
  .footer { margin-top: 20pt; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #ccc; padding-top: 8pt; }
</style></head><body>
<p class="center" style="font-size:9pt;color:#999;text-transform:uppercase;letter-spacing:1pt;">Los Tordos Rugby Club</p>
<h1>Minuta – ${esc(mi.typeTitle)}${mi.areaName ? " · " + esc(mi.areaName) : ""}</h1>
<p class="meta">📅 ${fmtD(mi.date)}${mi.horaInicio ? " · 🕐 " + mi.horaInicio + " – " + (mi.horaCierre || "") : ""}${mi.lugar ? " · 📍 " + esc(mi.lugar) : ""}</p>
<p class="center"><b>${mi.status === "final" ? "✅ Finalizada" : "📝 Borrador"}</b></p>
${mi.presentes?.length ? `<h2>✅ Presentes</h2><p>${(mi.presentes || []).map(p => "• " + esc(p)).join("<br>")}</p>` : ""}
${mi.ausentes?.length ? `<h2>❌ Ausentes</h2><p>${(mi.ausentes || []).map(a => "• " + esc(a)).join("<br>")}</p>` : ""}
${(mi.sections || []).map((s, i) => `<h2>${i + 1}. ${esc(s.title)}</h2><p class="section-content">${s.content ? esc(s.content) : "–"}</p>`).join("")}
${mi.tareas?.length ? `<h2>📋 Tareas asignadas (${mi.tareas.length})</h2><table><tr><th>Tarea</th><th>Responsable</th><th>Fecha</th></tr>${mi.tareas.map(t => `<tr><td>${esc(t.desc)}</td><td>${esc(t.resp)}</td><td>${fmtD(t.fecha)}</td></tr>`).join("")}</table>` : ""}
<div class="footer">Los Tordos Rugby Club · Generado: ${new Date().toLocaleDateString("es-AR")}</div>
</body></html>`;
  const blob = new Blob(["\uFEFF" + html], { type: "application/msword" });
  downloadBlob(blob, `Minuta_${mi.typeTitle.replace(/\s/g, "_")}_${mi.date}.doc`);
}

/* ── Helper ── */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── OD (Orden del Día) types ── */
type ODData = {typeTitle:string;areaName?:string;date:string;presentes?:string[];sections?:{t:string;sub:string[];notes:string;atts?:{type:string;label:string;val:string}[]}[];status:string};

function buildODHTML(od: ODData): string {
  const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const fmtD = (d: string) => { if (!d) return "–"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#1a1a1a;line-height:1.5;padding:10px;">
<div style="text-align:center;border-bottom:3px solid #0A1628;padding-bottom:12px;margin-bottom:16px;">
  <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;">Los Tordos Rugby Club</div>
  <h1 style="font-size:18px;margin:4px 0 0;color:#0A1628;">${esc(od.typeTitle)}</h1>
  <div style="font-size:13px;color:#333;margin-top:2px;">Orden del Día – ${fmtD(od.date)}${od.areaName ? " · " + esc(od.areaName) : ""}</div>
</div>
${od.presentes?.length ? `<div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;color:#059669;margin-bottom:4px;text-transform:uppercase;">✅ Convocados (${od.presentes.length})</div><div style="display:flex;flex-wrap:wrap;gap:4px;">${od.presentes.map(p => `<span style="padding:2px 8px;border-radius:10px;background:#D1FAE5;border:1px solid #6EE7B7;font-size:10px;font-weight:600;color:#065F46;">${esc(p)}</span>`).join("")}</div></div>` : ""}
${(od.sections || []).map((s, i) => `<div style="margin-bottom:10px;padding:8px 10px;background:${i % 2 === 0 ? "#F7F8FA" : "#fff"};border-radius:6px;">
  <div style="font-size:12px;font-weight:700;color:#0A1628;">${i + 1}. ${esc(s.t)}</div>
  ${s.sub?.length ? s.sub.map(sb => `<div style="font-size:10px;color:#5A6577;padding-left:12px;">• ${esc(sb)}</div>`).join("") : ""}
  ${s.notes ? `<div style="font-size:11px;color:#3B82F6;margin-top:3px;padding-left:12px;font-style:italic;">💬 ${esc(s.notes)}</div>` : ""}
</div>`).join("")}
<div style="margin-top:20px;text-align:center;font-size:9px;color:#999;border-top:1px solid #e5e5e5;padding-top:8px;">Los Tordos Rugby Club · Generado: ${new Date().toLocaleDateString("es-AR")}</div>
</div>`;
}

export async function exportODPDF(od: ODData) {
  const html = buildODHTML(od);
  const el = document.createElement("div");
  el.innerHTML = html;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.width = "210mm";
  document.body.appendChild(el);
  try {
    const html2pdf = await loadHtml2Pdf();
    const fmtD = (d: string) => { if (!d) return ""; const [y, m, dd] = d.split("-"); return `${dd}-${m}-${y}`; };
    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `OD_${od.typeTitle.replace(/\s/g, "_")}_${fmtD(od.date)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(el).save();
  } finally {
    document.body.removeChild(el);
  }
}

export function exportODWord(od: ODData) {
  const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const fmtD = (d: string) => { if (!d) return "–"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Orden del Dia</title>
<style>
  body { font-family: Calibri, sans-serif; font-size: 12pt; color: #1a1a1a; line-height: 1.5; }
  h1 { font-size: 18pt; color: #0A1628; text-align: center; margin-bottom: 2pt; }
  h2 { font-size: 14pt; color: #0A1628; border-bottom: 1px solid #ccc; padding-bottom: 4pt; margin-top: 14pt; }
  .center { text-align: center; }
  .meta { text-align: center; color: #666; font-size: 10pt; }
  .footer { margin-top: 20pt; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #ccc; padding-top: 8pt; }
</style></head><body>
<p class="center" style="font-size:9pt;color:#999;text-transform:uppercase;letter-spacing:1pt;">Los Tordos Rugby Club</p>
<h1>${esc(od.typeTitle)}</h1>
<p class="meta">Orden del Dia – ${fmtD(od.date)}${od.areaName ? " · " + esc(od.areaName) : ""}</p>
${od.presentes?.length ? `<h2>Convocados (${od.presentes.length})</h2><p>${od.presentes.map(p => "• " + esc(p)).join("<br>")}</p>` : ""}
${(od.sections || []).map((s, i) => `<h2>${i + 1}. ${esc(s.t)}</h2>${s.sub?.length ? "<p>" + s.sub.map(sb => "• " + esc(sb)).join("<br>") + "</p>" : ""}${s.notes ? `<p style="color:#3B82F6;font-style:italic;">${esc(s.notes)}</p>` : ""}`).join("")}
<div class="footer">Los Tordos Rugby Club · Generado: ${new Date().toLocaleDateString("es-AR")}</div>
</body></html>`;
  const blob = new Blob(["\uFEFF" + html], { type: "application/msword" });
  downloadBlob(blob, `OD_${od.typeTitle.replace(/\s/g, "_")}_${od.date}.doc`);
}

/* ── WhatsApp share helpers ── */
export function shareODWhatsApp(od: ODData) {
  const fmtD = (d: string) => { if (!d) return "–"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
  let text = `*Los Tordos Rugby Club*\n*${od.typeTitle}*\nOrden del Dia – ${fmtD(od.date)}${od.areaName ? " · " + od.areaName : ""}\n`;
  if (od.presentes?.length) text += `\n*Convocados (${od.presentes.length}):*\n${od.presentes.map(p => "• " + p).join("\n")}\n`;
  text += "\n";
  (od.sections || []).forEach((s, i) => {
    text += `*${i + 1}. ${s.t}*\n`;
    if (s.sub?.length) s.sub.forEach(sb => { text += `  • ${sb}\n`; });
    if (s.notes) text += `  _${s.notes}_\n`;
    text += "\n";
  });
  text += `_Generado: ${new Date().toLocaleDateString("es-AR")}_`;
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
}

export function shareMinutaWhatsApp(mi: MinutaData) {
  const fmtD = (d: string) => { if (!d) return "–"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
  let text = `*Los Tordos Rugby Club*\n*Minuta – ${mi.typeTitle}${mi.areaName ? " · " + mi.areaName : ""}*\n`;
  text += `📅 ${fmtD(mi.date)}`;
  if (mi.horaInicio) text += ` · 🕐 ${mi.horaInicio} – ${mi.horaCierre || ""}`;
  if (mi.lugar) text += ` · 📍 ${mi.lugar}`;
  text += `\n${mi.status === "final" ? "✅ Finalizada" : "📝 Borrador"}\n`;
  if (mi.presentes?.length) text += `\n*Presentes:*\n${mi.presentes.map(p => "• " + p).join("\n")}\n`;
  if (mi.ausentes?.length) text += `\n*Ausentes:*\n${mi.ausentes.map(a => "• " + a).join("\n")}\n`;
  text += "\n";
  (mi.sections || []).forEach((s, i) => {
    text += `*${i + 1}. ${s.title}*\n${s.content || "–"}\n\n`;
  });
  if (mi.tareas?.length) {
    text += `*📋 Tareas (${mi.tareas.length}):*\n`;
    mi.tareas.forEach(t => { text += `• ${t.desc} → ${t.resp}${t.fecha ? " (" + fmtD(t.fecha) + ")" : ""}\n`; });
  }
  text += `\n_Generado: ${new Date().toLocaleDateString("es-AR")}_`;
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
}

/* ── REPORT PDF (weekly/monthly summary) ── */
type ReportData = {
  period: string;
  dateRange: string;
  stats: { label: string; value: string; color: string }[];
  tasksByStatus: { status: string; icon: string; count: number; color: string }[];
  completedTasks: { id: number; desc: string; assignee: string; date: string }[];
  pendingTasks: { id: number; desc: string; assignee: string; date: string; overdue: boolean }[];
  budgetSummary: { total: number; approved: number; pending: number; currency: string };
  topAreas: { name: string; total: number; completed: number; pct: number }[];
};

export async function exportReportPDF(data: ReportData) {
  const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fmtN = (n: number) => n.toLocaleString("es-AR");

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#1a1a1a;line-height:1.5;padding:10px;">
<div style="text-align:center;border-bottom:3px solid #0A1628;padding-bottom:12px;margin-bottom:16px;">
  <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;">Los Tordos Rugby Club</div>
  <h1 style="font-size:20px;margin:4px 0 0;color:#0A1628;">Reporte ${esc(data.period)}</h1>
  <div style="font-size:11px;color:#555;margin-top:4px;">${esc(data.dateRange)}</div>
</div>

<!-- KPIs -->
<div style="display:grid;grid-template-columns:repeat(${Math.min(data.stats.length, 4)},1fr);gap:10px;margin-bottom:16px;">
${data.stats.map(s => `<div style="background:${s.color}10;border:1px solid ${s.color}30;border-radius:8px;padding:10px;text-align:center;">
  <div style="font-size:20px;font-weight:800;color:${s.color}">${esc(s.value)}</div>
  <div style="font-size:10px;color:#666;margin-top:2px;">${esc(s.label)}</div>
</div>`).join("")}
</div>

<!-- Status breakdown -->
<h2 style="font-size:14px;color:#0A1628;border-bottom:1px solid #e5e5e5;padding-bottom:4px;margin:14px 0 8px;">Estado de Tareas</h2>
<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
${data.tasksByStatus.map(t => `<div style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;background:${t.color}10;border:1px solid ${t.color}30;">
  <span>${t.icon}</span><span style="font-weight:700;color:${t.color}">${t.count}</span><span style="font-size:10px;color:#666">${esc(t.status)}</span>
</div>`).join("")}
</div>

<!-- Top areas -->
${data.topAreas.length ? `<h2 style="font-size:14px;color:#0A1628;border-bottom:1px solid #e5e5e5;padding-bottom:4px;margin:14px 0 8px;">Avance por Area</h2>
<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
<thead><tr><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Area</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:center;font-size:10px;">Total</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:center;font-size:10px;">Completadas</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Progreso</th></tr></thead>
<tbody>${data.topAreas.map((a, i) => `<tr style="background:${i % 2 ? "#f9f9f9" : "#fff"}">
<td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;font-weight:600;">${esc(a.name)}</td>
<td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;text-align:center;">${a.total}</td>
<td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;text-align:center;">${a.completed}</td>
<td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;"><div style="background:#e5e5e5;border-radius:4px;height:8px;width:100%;"><div style="background:#10B981;border-radius:4px;height:8px;width:${a.pct}%;"></div></div><span style="font-size:9px;color:#666;">${a.pct}%</span></td>
</tr>`).join("")}</tbody></table>` : ""}

<!-- Budget summary -->
${data.budgetSummary.total > 0 ? `<h2 style="font-size:14px;color:#0A1628;border-bottom:1px solid #e5e5e5;padding-bottom:4px;margin:14px 0 8px;">Presupuestos</h2>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
<div style="background:#D1FAE5;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:16px;font-weight:800;color:#065F46">$${fmtN(data.budgetSummary.approved)}</div><div style="font-size:10px;color:#065F46">Aprobados</div></div>
<div style="background:#FEF3C7;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:16px;font-weight:800;color:#92400E">$${fmtN(data.budgetSummary.pending)}</div><div style="font-size:10px;color:#92400E">Pendientes</div></div>
<div style="background:#EFF6FF;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:16px;font-weight:800;color:#1E40AF">$${fmtN(data.budgetSummary.total)}</div><div style="font-size:10px;color:#1E40AF">Total</div></div>
</div>` : ""}

<!-- Completed tasks -->
${data.completedTasks.length ? `<h2 style="font-size:14px;color:#059669;border-bottom:1px solid #e5e5e5;padding-bottom:4px;margin:14px 0 8px;">Tareas Completadas (${data.completedTasks.length})</h2>
<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
<thead><tr><th style="background:#065F46;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">#</th><th style="background:#065F46;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Descripcion</th><th style="background:#065F46;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Asignado</th><th style="background:#065F46;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Fecha</th></tr></thead>
<tbody>${data.completedTasks.slice(0, 20).map((t, i) => `<tr style="background:${i % 2 ? "#f9f9f9" : "#fff"}"><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${t.id}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc(t.desc)}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc(t.assignee)}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc(t.date)}</td></tr>`).join("")}</tbody></table>` : ""}

<!-- Pending/overdue tasks -->
${data.pendingTasks.length ? `<h2 style="font-size:14px;color:#DC2626;border-bottom:1px solid #e5e5e5;padding-bottom:4px;margin:14px 0 8px;">Tareas Pendientes/Vencidas (${data.pendingTasks.length})</h2>
<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
<thead><tr><th style="background:#991B1B;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">#</th><th style="background:#991B1B;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Descripcion</th><th style="background:#991B1B;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Asignado</th><th style="background:#991B1B;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Vence</th></tr></thead>
<tbody>${data.pendingTasks.slice(0, 20).map((t, i) => `<tr style="background:${t.overdue ? "#FEF2F2" : (i % 2 ? "#f9f9f9" : "#fff")}"><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${t.id}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc(t.desc)}${t.overdue ? " <span style='color:#DC2626;font-size:9px;'>VENCIDA</span>" : ""}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc(t.assignee)}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;${t.overdue ? "color:#DC2626;font-weight:700" : ""}">${esc(t.date)}</td></tr>`).join("")}</tbody></table>` : ""}

<div style="margin-top:20px;text-align:center;font-size:9px;color:#999;border-top:1px solid #e5e5e5;padding-top:8px;">Los Tordos Rugby Club · Generado: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
</div>`;

  const el = document.createElement("div");
  el.innerHTML = html;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.width = "210mm";
  document.body.appendChild(el);

  try {
    const html2pdf = await loadHtml2Pdf();
    await html2pdf().set({
      margin: [8, 8, 8, 8],
      filename: `Reporte_${data.period.replace(/\s/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(el).save();
  } finally {
    document.body.removeChild(el);
  }
}

/* ── PROJECT INFORME PDF ── */
type ProjectBudgetOption = { label: string; amount: number; description?: string; currency?: string };
type ProjectBudget = { id: number; provider: string; options: ProjectBudgetOption[]; file_url?: string };
type ProjectTask = { id: number; title: string; status: string; priority: string; assignee_name?: string; due_date?: string };
type ProjectInfo = { name: string; status: string; created_by_name?: string; created_at?: string };

const PJ_ST_LABELS: Record<string,string> = { backlog:"Backlog", todo:"To Do", in_progress:"In Progress", review:"Review", done:"Done", borrador:"Borrador", enviado:"Enviado", aprobado:"Aprobado", rechazado:"Rechazado" };
const PJ_PR_LABELS: Record<string,string> = { critical:"Crítica", high:"Alta", medium:"Media", low:"Baja" };

export async function exportProjectPDF(project: ProjectInfo, formData: any, budgets: ProjectBudget[], tasks: ProjectTask[], progress: { total: number; done: number; pct: number }) {
  const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const fmtN = (n: number) => n.toLocaleString("es-AR");
  const fmtD = (d: string) => { if (!d) return "–"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };

  const sectionField = (label: string, val: string) => val ? `<div style="margin-bottom:6px;"><span style="font-size:10px;font-weight:700;color:#666;text-transform:uppercase;">${esc(label)}</span><div style="font-size:11px;color:#333;margin-top:1px;white-space:pre-wrap;">${esc(val)}</div></div>` : "";

  // Max options count across all budgets
  const maxOpts = budgets.reduce((mx, b) => Math.max(mx, (b.options || []).length), 0);

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#1a1a1a;line-height:1.5;padding:10px;">
<div style="text-align:center;border-bottom:3px solid #0A1628;padding-bottom:12px;margin-bottom:16px;">
  <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;">Los Tordos Rugby Club</div>
  <h1 style="font-size:20px;margin:4px 0 0;color:#0A1628;">INFORME DE PROYECTO: ${esc(project.name)}</h1>
  <div style="font-size:11px;color:#555;margin-top:4px;">Estado: ${esc(PJ_ST_LABELS[project.status] || project.status)} · Fecha: ${fmtD(project.created_at?.slice(0, 10) || "")}</div>
  ${project.created_by_name ? `<div style="font-size:10px;color:#888;margin-top:2px;">Creado por: ${esc(project.created_by_name)}</div>` : ""}
</div>

<!-- PROPUESTA -->
<h2 style="font-size:14px;color:#0A1628;border-bottom:2px solid #0A1628;padding-bottom:4px;margin:16px 0 10px;">PROPUESTA</h2>
${sectionField("Nombre", formData.nombre)}
${sectionField("Responsable", formData.responsable)}
${sectionField("Equipo inicial", formData.equipo)}
${sectionField("¿Qué busca lograr?", formData.obj_lograr)}
${sectionField("Beneficio para el club", formData.obj_beneficio)}
${sectionField("Eje estratégico", formData.eje)}
${sectionField("Alineación con ADN Tordos", formData.adn)}
${sectionField("Descripción", formData.descripcion)}
${sectionField("Duración estimada", formData.duracion)}
${sectionField("Etapas principales", formData.etapas)}
${sectionField("Recursos económicos", formData.rec_eco)}
${sectionField("Recursos humanos", formData.rec_hum)}
${sectionField("Infraestructura / equipamiento", formData.rec_infra)}
${sectionField("¿Qué puede salir mal?", formData.riesgo_mal)}
${sectionField("Clave para que funcione", formData.riesgo_clave)}
${sectionField("Entregables esperados", formData.entregables)}

<!-- PRESUPUESTOS -->
${budgets.length ? `<h2 style="font-size:14px;color:#0A1628;border-bottom:2px solid #0A1628;padding-bottom:4px;margin:16px 0 10px;">PRESUPUESTOS (${budgets.length})</h2>
<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
<thead><tr><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Proveedor</th>${Array.from({ length: maxOpts }, (_, i) => `<th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:right;font-size:10px;">Opción ${i + 1}</th>`).join("")}</tr></thead>
<tbody>${budgets.map((b, bi) => {
    const opts = b.options || [];
    return `<tr style="background:${bi % 2 ? "#f9f9f9" : "#fff"}"><td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;font-weight:600;">${esc(b.provider)}</td>${Array.from({ length: maxOpts }, (_, i) => {
      const opt = opts[i];
      const amt = opt ? opt.amount : 0;
      // Find min for this column
      const colAmts = budgets.map(bb => (bb.options || [])[i]?.amount || 0).filter(a => a > 0);
      const isMin = colAmts.length > 1 && amt > 0 && amt === Math.min(...colAmts);
      const cur = opt?.currency === "USD" ? "US$" : "$";
      return `<td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;text-align:right;${isMin ? "background:#D1FAE5;color:#065F46;font-weight:700;" : ""}">${opt && amt ? cur + fmtN(amt) : "–"}</td>`;
    }).join("")}</tr>`;
  }).join("")}</tbody></table>` : ""}

<!-- TAREAS -->
${tasks.length ? `<h2 style="font-size:14px;color:#0A1628;border-bottom:2px solid #0A1628;padding-bottom:4px;margin:16px 0 10px;">TAREAS (${progress.done}/${progress.total} completadas — ${progress.pct}%)</h2>
<div style="margin-bottom:8px;"><div style="height:8px;border-radius:4px;background:#e5e5e5;overflow:hidden;"><div style="height:100%;width:${progress.pct}%;border-radius:4px;background:${progress.pct === 100 ? "#10B981" : "#3B82F6"};"></div></div></div>
<table style="width:100%;border-collapse:collapse;font-size:11px;">
<thead><tr><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">#</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Título</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Estado</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Prioridad</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Asignado</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Vence</th></tr></thead>
<tbody>${tasks.map((t, i) => `<tr style="background:${i % 2 ? "#f9f9f9" : "#fff"}"><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${i + 1}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc(t.title)}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc(PJ_ST_LABELS[t.status] || t.status)}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc(PJ_PR_LABELS[t.priority] || t.priority)}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc(t.assignee_name || "–")}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${fmtD(t.due_date || "")}</td></tr>`).join("")}</tbody></table>` : ""}

<div style="margin-top:20px;text-align:center;font-size:9px;color:#999;border-top:1px solid #e5e5e5;padding-top:8px;">Los Tordos Rugby Club · Generado: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
</div>`;

  const el = document.createElement("div");
  el.innerHTML = html;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.width = "210mm";
  document.body.appendChild(el);

  try {
    const html2pdf = await loadHtml2Pdf();
    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `Informe_${project.name.replace(/\s/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(el).save();
  } finally {
    document.body.removeChild(el);
  }
}

/* ── Map Image Export (PNG) ── */
export async function exportMapImage(mapEl: HTMLElement, date: string, share: boolean) {
  const html2pdf = await loadHtml2Pdf();
  const html2canvas = (window as any).html2canvas;
  if (!html2canvas) throw new Error("html2canvas not loaded");

  // Format date in Spanish
  const d = new Date(date + "T12:00:00");
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dateStr = `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]} ${d.getFullYear()}`;

  // Create offscreen container
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;background:#fff;padding:0;";
  document.body.appendChild(wrapper);

  // Institutional header
  const header = document.createElement("div");
  header.style.cssText = "background:#D4D4D4;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;";
  header.innerHTML = `
    <div>
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1B2A4A;line-height:1.2;">DISPOSICIÓN CANCHAS</div>
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1B2A4A;line-height:1.2;">RUGBY INFANTIL</div>
      <div style="font-family:-apple-system,sans-serif;font-size:13px;color:#475569;margin-top:6px;font-weight:500;">${dateStr}</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <img src="/logo.jpg" style="width:60px;height:60px;object-fit:contain;border-radius:6px;" crossorigin="anonymous" />
      <div style="text-align:right;">
        <div style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#1B2A4A;line-height:1.2;">LOS TORDOS</div>
        <div style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#1B2A4A;line-height:1.2;">RUGBY CLUB</div>
      </div>
    </div>
  `;
  wrapper.appendChild(header);

  // Clone the map element
  const clone = mapEl.cloneNode(true) as HTMLElement;
  clone.style.cssText = "width:100%;padding:12px;box-sizing:border-box;background:#fff;";
  // Remove any export buttons from the clone
  clone.querySelectorAll("[data-export-btn]").forEach(el => el.remove());
  wrapper.appendChild(clone);

  try {
    const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#fff" });
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b: Blob) => resolve(b), "image/png"));
    const file = new File([blob], `Mapa_Canchas_${date}.png`, { type: "image/png" });

    if (share && navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Disposición Canchas", text: dateStr });
    } else {
      downloadBlob(blob, `Mapa_Canchas_${date}.png`);
    }
  } finally {
    document.body.removeChild(wrapper);
  }
}

/* ── AUDIT PDF (permission matrix) ── */
type AuditUser = { id: string; n: string; a: string; role: string; email?: string };

export async function exportAuditPDF(users: AuditUser[]) {
  const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const ROLES: Record<string,{l:string;lv:number}> = {
    superadmin:{l:"Super Admin",lv:5},admin:{l:"Administrador",lv:4},coordinador:{l:"Coordinador",lv:3},
    embudo:{l:"Compras/Tesorería",lv:3},usuario:{l:"Usuario",lv:2},enlace:{l:"Enlace",lv:1},manager:{l:"Manager",lv:1}
  };

  const SECTIONS: {name:string;roles:string[]}[] = [
    {name:"Plan 2035",roles:["superadmin","admin","coordinador","embudo","usuario","enlace","manager"]},
    {name:"Organigrama",roles:["superadmin","admin","coordinador","embudo","usuario","enlace","manager"]},
    {name:"Perfiles",roles:["superadmin","admin","coordinador","embudo","usuario","enlace","manager"]},
    {name:"Presupuestos",roles:["superadmin","admin","coordinador","embudo"]},
    {name:"Reuniones",roles:["superadmin","admin","coordinador"]},
    {name:"Proyectos",roles:["superadmin","admin","coordinador","embudo"]},
    {name:"Recurrentes",roles:["superadmin","admin","coordinador"]},
    {name:"Comunicar",roles:["superadmin","admin","coordinador"]},
    {name:"Inventario",roles:["superadmin","admin","coordinador"]},
    {name:"Espacios",roles:["superadmin","admin","coordinador","embudo","usuario","enlace","manager"]},
    {name:"Sponsors",roles:["superadmin","admin","coordinador","embudo"]},
  ];

  const ACTIONS: {action:string;roles:string[]}[] = [
    {action:"Crear tarea (pedido)",roles:["superadmin","admin","coordinador","embudo","usuario","enlace","manager"]},
    {action:"Aprobar/rechazar tarea",roles:["superadmin","admin","coordinador"]},
    {action:"Crear presupuesto",roles:["superadmin","admin","coordinador","embudo"]},
    {action:"Aprobar presupuesto",roles:["superadmin","admin"]},
    {action:"Crear proyecto",roles:["superadmin","admin","coordinador","embudo"]},
    {action:"Crear reunión/minuta",roles:["superadmin","admin","coordinador"]},
    {action:"Gestionar sponsors",roles:["superadmin","admin","coordinador","embudo"]},
    {action:"Gestionar inventario",roles:["superadmin","admin","coordinador"]},
    {action:"Gestionar usuarios",roles:["superadmin"]},
    {action:"Ver dashboard global",roles:["superadmin","admin","coordinador","embudo"]},
    {action:"Ver solo sus tareas",roles:["usuario","enlace","manager"]},
  ];

  const allRoles = Object.keys(ROLES);
  const check = "✅";
  const cross = "—";

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#1a1a1a;line-height:1.5;padding:10px;">
<div style="text-align:center;border-bottom:3px solid #0A1628;padding-bottom:12px;margin-bottom:16px;">
  <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;">Los Tordos Rugby Club</div>
  <h1 style="font-size:20px;margin:4px 0 0;color:#0A1628;">AUDITORÍA DE PERMISOS</h1>
  <div style="font-size:11px;color:#555;margin-top:4px;">Matriz completa de roles, vistas y acciones</div>
</div>

<!-- Tabla 1: Roles -->
<h2 style="font-size:14px;color:#0A1628;border-bottom:2px solid #0A1628;padding-bottom:4px;margin:16px 0 8px;">1. Roles del sistema</h2>
<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
<thead><tr><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Rol</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Nombre</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:center;font-size:10px;">Nivel</th></tr></thead>
<tbody>${allRoles.map((r, i) => `<tr style="background:${i % 2 ? "#f9f9f9" : "#fff"}"><td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;font-weight:600;">${esc(r)}</td><td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;">${esc(ROLES[r].l)}</td><td style="padding:5px 8px;border-bottom:1px solid #e5e5e5;text-align:center;">${ROLES[r].lv}</td></tr>`).join("")}</tbody></table>

<!-- Tabla 2: Vistas por rol -->
<h2 style="font-size:14px;color:#0A1628;border-bottom:2px solid #0A1628;padding-bottom:4px;margin:16px 0 8px;">2. Secciones visibles por rol</h2>
<table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px;">
<thead><tr><th style="background:#0A1628;color:#fff;padding:5px 6px;text-align:left;font-size:9px;">Sección</th>${allRoles.map(r => `<th style="background:#0A1628;color:#fff;padding:5px 4px;text-align:center;font-size:8px;writing-mode:vertical-lr;min-width:24px;">${esc(ROLES[r].l)}</th>`).join("")}</tr></thead>
<tbody>${SECTIONS.map((s, i) => `<tr style="background:${i % 2 ? "#f9f9f9" : "#fff"}"><td style="padding:4px 6px;border-bottom:1px solid #e5e5e5;font-weight:600;">${esc(s.name)}</td>${allRoles.map(r => `<td style="padding:4px 4px;border-bottom:1px solid #e5e5e5;text-align:center;${s.roles.includes(r) ? "color:#059669;" : "color:#ccc;"}">${s.roles.includes(r) ? check : cross}</td>`).join("")}</tr>`).join("")}</tbody></table>

<!-- Tabla 3: Acciones por rol -->
<h2 style="font-size:14px;color:#0A1628;border-bottom:2px solid #0A1628;padding-bottom:4px;margin:16px 0 8px;">3. Acciones permitidas por rol</h2>
<table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px;">
<thead><tr><th style="background:#0A1628;color:#fff;padding:5px 6px;text-align:left;font-size:9px;">Acción</th>${allRoles.map(r => `<th style="background:#0A1628;color:#fff;padding:5px 4px;text-align:center;font-size:8px;writing-mode:vertical-lr;min-width:24px;">${esc(ROLES[r].l)}</th>`).join("")}</tr></thead>
<tbody>${ACTIONS.map((a, i) => `<tr style="background:${i % 2 ? "#f9f9f9" : "#fff"}"><td style="padding:4px 6px;border-bottom:1px solid #e5e5e5;font-weight:600;">${esc(a.action)}</td>${allRoles.map(r => `<td style="padding:4px 4px;border-bottom:1px solid #e5e5e5;text-align:center;${a.roles.includes(r) ? "color:#059669;" : "color:#ccc;"}">${a.roles.includes(r) ? check : cross}</td>`).join("")}</tr>`).join("")}</tbody></table>

<!-- Tabla 4: Usuarios actuales -->
<h2 style="font-size:14px;color:#0A1628;border-bottom:2px solid #0A1628;padding-bottom:4px;margin:16px 0 8px;">4. Usuarios registrados (${users.length})</h2>
<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
<thead><tr><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">#</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Nombre</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Rol</th><th style="background:#0A1628;color:#fff;padding:5px 8px;text-align:left;font-size:10px;">Email</th></tr></thead>
<tbody>${[...users].sort((a,b) => (ROLES[b.role]?.lv||0) - (ROLES[a.role]?.lv||0)).map((u, i) => `<tr style="background:${i % 2 ? "#f9f9f9" : "#fff"}"><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${i + 1}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;">${esc((u.n || "") + " " + (u.a || ""))}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;font-weight:600;">${esc(ROLES[u.role]?.l || u.role)}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e5e5;font-size:10px;">${esc(u.email || "–")}</td></tr>`).join("")}</tbody></table>

<div style="margin-top:20px;text-align:center;font-size:9px;color:#999;border-top:1px solid #e5e5e5;padding-top:8px;">Los Tordos Rugby Club · Auditoría de Permisos · Generado: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
</div>`;

  const el = document.createElement("div");
  el.innerHTML = html;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.width = "210mm";
  document.body.appendChild(el);

  try {
    const html2pdf = await loadHtml2Pdf();
    await html2pdf().set({
      margin: [8, 8, 8, 8],
      filename: `Auditoria_Permisos_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
    }).from(el).save();
  } finally {
    document.body.removeChild(el);
  }
}

/* ── iCal ── */
export function exportICal(filename: string, events: {title:string;date:string;description?:string;type?:string}[]) {
  const esc = (s: string) => String(s ?? "").replace(/[\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Los Tordos RC//Panel//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Los Tordos",
  ];
  for (const ev of events) {
    const dtStart = ev.date.replace(/-/g, "");
    const dtEnd = dtStart; // all-day events
    const uid = dtStart + "-" + Math.random().toString(36).slice(2, 8) + "@lostordos";
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTART;VALUE=DATE:" + dtStart,
      "DTEND;VALUE=DATE:" + dtEnd,
      "DTSTAMP:" + now,
      "SUMMARY:" + esc(ev.title),
      ...(ev.description ? ["DESCRIPTION:" + esc(ev.description)] : []),
      ...(ev.type ? ["CATEGORIES:" + esc(ev.type)] : []),
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  downloadBlob(blob, filename + ".ics");
}
