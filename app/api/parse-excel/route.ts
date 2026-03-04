import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

const KEYWORDS = ["DIVIS", "DIV", "RIVAL", "EQUIPO", "DIA", "FECHA", "HORA", "CONDIC", "CANCHA", "CATEG"];

/* Excel stores times as fractions of a day: 0.833… = 20:00 */
function excelTimeToHHMM(v: any): string {
  if (typeof v === "number" && v >= 0 && v < 1) {
    const totalMin = Math.round(v * 24 * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return String(v ?? "").trim();
}

/* Excel stores dates as days since 1900-01-01 */
function excelDateToISO(v: any): string {
  if (typeof v === "number" && v > 40000) {
    const d = new Date((v - 25569) * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  }
  return String(v ?? "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];

    // Get raw rows to find the real header row
    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let headerIdx = 0;
    for (let i = 0; i < Math.min(raw.length, 20); i++) {
      const cells = (raw[i] || []).map(c => String(c || "").toUpperCase().trim());
      const matches = cells.filter(c => KEYWORDS.some(kw => c.includes(kw))).length;
      if (matches >= 2) { headerIdx = i; break; }
    }

    const headers = raw[headerIdx].map(h => String(h || "").trim());

    // Find which columns are time/date by header name
    const timeIdxs = headers.map((h, i) => /HORA|TIME|HORARIO/i.test(h) ? i : -1).filter(i => i >= 0);
    const dateIdxs = headers.map((h, i) => /DIA|FECHA|DATE/i.test(h) ? i : -1).filter(i => i >= 0);

    const rows = raw.slice(headerIdx + 1)
      .filter(r => r.some(c => String(c || "").trim() !== ""))
      .map(r => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
          if (!h) return;
          let val = r[i] ?? "";
          // Convert Excel time serials to HH:MM
          if (timeIdxs.includes(i)) val = excelTimeToHHMM(val);
          // Convert Excel date serials to YYYY-MM-DD
          if (dateIdxs.includes(i)) val = excelDateToISO(val);
          obj[h] = val;
        });
        return obj;
      });

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Parse error" }, { status: 500 });
  }
}
