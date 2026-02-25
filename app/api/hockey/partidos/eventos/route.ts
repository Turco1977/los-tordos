import { NextRequest, NextResponse } from "next/server";
import { verifyCallerWithRole } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const url = new URL(req.url);
  const partido_id = url.searchParams.get("partido_id");
  if (!partido_id) return NextResponse.json({ error: "partido_id requerido" }, { status: 400 });
  const { data, error } = await admin.from("partido_eventos").select("*").eq("partido_id", Number(partido_id)).order("minuto");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const body = await req.json();
  const { partido_id, jugadora_id, tipo, minuto, notas } = body;
  if (!partido_id || !jugadora_id || !tipo) return NextResponse.json({ error: "partido_id, jugadora_id y tipo requeridos" }, { status: 400 });
  const { data, error } = await admin.from("partido_eventos").insert({
    partido_id, jugadora_id, tipo,
    minuto: minuto ?? null,
    notas: notas || "",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Auto-update goles if it's a gol
  if (tipo === "gol") {
    const { data: partido } = await admin.from("partidos").select("goles_favor").eq("id", partido_id).single();
    if (partido) await admin.from("partidos").update({ goles_favor: (partido.goles_favor || 0) + 1 }).eq("id", partido_id);
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  // Check if gol to decrement counter
  const { data: evt } = await admin.from("partido_eventos").select("partido_id,tipo").eq("id", Number(id)).single();
  const { error } = await admin.from("partido_eventos").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (evt?.tipo === "gol") {
    const { data: partido } = await admin.from("partidos").select("goles_favor").eq("id", evt.partido_id).single();
    if (partido) await admin.from("partidos").update({ goles_favor: Math.max(0, (partido.goles_favor || 0) - 1) }).eq("id", evt.partido_id);
  }
  return NextResponse.json({ ok: true });
}
