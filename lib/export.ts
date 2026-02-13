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
