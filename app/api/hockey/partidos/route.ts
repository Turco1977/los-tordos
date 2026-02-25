import { NextRequest, NextResponse } from "next/server";
import { verifyCallerWithRole } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const url = new URL(req.url);
  const division = url.searchParams.get("division");
  let q = admin.from("partidos").select("*").order("fecha", { ascending: false }).limit(100);
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
  const { fecha, hora, division, rama, rival, sede, competencia, notas } = body;
  if (!fecha || !division || !rival) return NextResponse.json({ error: "Fecha, división y rival requeridos" }, { status: 400 });
  const { data, error } = await admin.from("partidos").insert({
    fecha, hora: hora || null, division, rama: rama || "femenino",
    rival, sede: sede || "local", competencia: competencia || "amistoso",
    notas: notas || "", created_by: user.id,
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
  const { data, error } = await admin.from("partidos").update(updates).eq("id", id).select().single();
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
  const { error } = await admin.from("partidos").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
