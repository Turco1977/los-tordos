import { NextRequest, NextResponse } from "next/server";
import { verifyCallerWithRole } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const url = new URL(req.url);
  const division = url.searchParams.get("division");
  const rama = url.searchParams.get("rama");
  let q = admin.from("asistencia_sesiones").select("*").order("fecha", { ascending: false }).limit(100);
  if (division) q = q.eq("division", division);
  if (rama) q = q.eq("rama", rama);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { user, admin } = result;
  const body = await req.json();
  const { fecha, division, rama, tipo_actividad, notas } = body;
  if (!division) return NextResponse.json({ error: "División requerida" }, { status: 400 });
  const { data, error } = await admin.from("asistencia_sesiones").insert({
    fecha: fecha || new Date().toISOString().slice(0, 10),
    division,
    rama: rama || "femenino",
    tipo_actividad: tipo_actividad || "entrenamiento",
    notas: notas || "",
    created_by: user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  const { data, error } = await admin.from("asistencia_sesiones").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
