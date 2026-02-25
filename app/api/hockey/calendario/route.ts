import { NextRequest, NextResponse } from "next/server";
import { verifyCallerWithRole } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const url = new URL(req.url);
  const division = url.searchParams.get("division");
  let q = admin.from("calendario_eventos").select("*").order("fecha", { ascending: true }).limit(200);
  if (division) q = q.eq("division", division);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { user, admin } = result;
  const body = await req.json();
  const { titulo, tipo, fecha, hora, duracion_min, division, rama, recurrencia, color, sesion_id, partido_id, notas } = body;
  if (!titulo || !fecha) return NextResponse.json({ error: "Título y fecha requeridos" }, { status: 400 });
  const { data, error } = await admin.from("calendario_eventos").insert({
    titulo, tipo: tipo || "otro", fecha, hora: hora || null,
    duracion_min: duracion_min || 60, division: division || null,
    rama: rama || null, recurrencia: recurrencia || "none",
    color: color || "#3B82F6", sesion_id: sesion_id || null,
    partido_id: partido_id || null, notas: notas || "",
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
  const { data, error } = await admin.from("calendario_eventos").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  const { error } = await admin.from("calendario_eventos").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
