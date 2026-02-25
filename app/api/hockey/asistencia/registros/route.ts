import { NextRequest, NextResponse } from "next/server";
import { verifyCallerWithRole } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const url = new URL(req.url);
  const sesion_id = url.searchParams.get("sesion_id");
  if (!sesion_id) return NextResponse.json({ error: "sesion_id requerido" }, { status: 400 });
  const { data, error } = await admin.from("asistencia_registros").select("*").eq("sesion_id", Number(sesion_id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const body = await req.json();
  const { sesion_id, registros } = body;
  if (!sesion_id || !Array.isArray(registros)) return NextResponse.json({ error: "sesion_id y registros[] requeridos" }, { status: 400 });
  const rows = registros.map((r: any) => ({
    sesion_id,
    jugadora_id: r.jugadora_id,
    presente: r.presente !== false,
    metodo: r.metodo || "manual",
  }));
  const { data, error } = await admin.from("asistencia_registros").upsert(rows, { onConflict: "sesion_id,jugadora_id" }).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
