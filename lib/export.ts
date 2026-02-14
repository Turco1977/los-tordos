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

/* ── MINUTA PDF (rich document via print) ── */
export function exportMinutaPDF(mi: {type:string;typeTitle:string;areaName?:string;date:string;horaInicio?:string;horaCierre?:string;lugar?:string;presentes?:string[];ausentes?:string[];sections?:{title:string;content:string}[];tareas?:{desc:string;resp:string;fecha:string}[];status:string}) {
  const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const fmtD = (d: string) => { if (!d) return "–"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Minuta ${mi.typeTitle} ${fmtD(mi.date)}</title>
<style>
  @page { size: portrait; margin: 15mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #1a1a1a; line-height: 1.5; }
  .header { text-align: center; border-bottom: 3px solid #0A1628; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 18px; margin: 0; color: #0A1628; }
  .header .sub { font-size: 11px; color: #666; margin-top: 4px; }
  .header .club { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
  .badge-final { background: #D1FAE5; color: #065F46; }
  .badge-borrador { background: #FEF3C7; color: #92400E; }
  .meta { display: flex; justify-content: center; gap: 16px; margin-top: 6px; font-size: 11px; color: #555; }
  .attendance { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .attendance h3 { font-size: 11px; margin: 0 0 4px; text-transform: uppercase; }
  .attendance .present h3 { color: #059669; }
  .attendance .absent h3 { color: #DC2626; }
  .attendance li { font-size: 11px; margin-left: 16px; }
  .section { margin-bottom: 14px; }
  .section h3 { font-size: 13px; font-weight: 700; color: #0A1628; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; margin: 0 0 6px; }
  .section p { margin: 0; padding-left: 8px; font-size: 11px; color: #333; white-space: pre-wrap; }
  .tasks { margin-top: 16px; }
  .tasks h3 { font-size: 13px; font-weight: 700; color: #92400E; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #0A1628; color: #fff; padding: 5px 8px; text-align: left; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e5e5; }
  tr:nth-child(even) { background: #f9f9f9; }
  .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #e5e5e5; padding-top: 8px; }
</style></head><body>
<div class="header">
  <div class="club">Los Tordos Rugby Club</div>
  <h1>Minuta – ${esc(mi.typeTitle)}${mi.areaName ? " · " + esc(mi.areaName) : ""}</h1>
  <div class="meta"><span>📅 ${fmtD(mi.date)}</span>${mi.horaInicio ? `<span>🕐 ${mi.horaInicio} – ${mi.horaCierre || ""}</span>` : ""}${mi.lugar ? `<span>📍 ${esc(mi.lugar)}</span>` : ""}</div>
  <div style="margin-top:6px"><span class="badge ${mi.status === "final" ? "badge-final" : "badge-borrador"}">${mi.status === "final" ? "✅ Finalizada" : "📝 Borrador"}</span></div>
</div>
${(mi.presentes?.length || mi.ausentes?.length) ? `<div class="attendance"><div class="present"><h3>✅ Presentes</h3><ul>${(mi.presentes || []).map(p => `<li>${esc(p)}</li>`).join("")}</ul></div><div class="absent"><h3>❌ Ausentes</h3><ul>${(mi.ausentes || []).length ? (mi.ausentes || []).map(a => `<li>${esc(a)}</li>`).join("") : "<li>–</li>"}</ul></div></div>` : ""}
${(mi.sections || []).map((s, i) => `<div class="section"><h3>${i + 1}. ${esc(s.title)}</h3><p>${s.content ? esc(s.content) : "–"}</p></div>`).join("")}
${mi.tareas?.length ? `<div class="tasks"><h3>📋 Tareas asignadas (${mi.tareas.length})</h3><table><thead><tr><th>Tarea</th><th>Responsable</th><th>Fecha</th></tr></thead><tbody>${mi.tareas.map(t => `<tr><td>${esc(t.desc)}</td><td>${esc(t.resp)}</td><td>${fmtD(t.fecha)}</td></tr>`).join("")}</tbody></table></div>` : ""}
<div class="footer">Los Tordos Rugby Club · Generado: ${new Date().toLocaleDateString("es-AR")}</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
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
