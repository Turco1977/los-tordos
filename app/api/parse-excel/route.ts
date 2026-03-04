import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

const KEYWORDS = ["DIVIS", "DIV", "RIVAL", "EQUIPO", "DIA", "FECHA", "HORA", "CONDIC", "CANCHA", "CATEG"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];

    // Get raw rows (arrays) to find the real header row
    const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let headerIdx = 0;
    for (let i = 0; i < Math.min(raw.length, 20); i++) {
      const cells = (raw[i] || []).map(c => String(c || "").toUpperCase().trim());
      const matches = cells.filter(c => KEYWORDS.some(kw => c.includes(kw))).length;
      if (matches >= 2) { headerIdx = i; break; }
    }

    const headers = raw[headerIdx].map(h => String(h || "").trim());
    const rows = raw.slice(headerIdx + 1)
      .filter(r => r.some(c => String(c || "").trim() !== ""))
      .map(r => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => { if (h) obj[h] = r[i] ?? ""; });
        return obj;
      });

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Parse error" }, { status: 500 });
  }
}
