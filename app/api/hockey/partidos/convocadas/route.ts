import { NextRequest, NextResponse } from "next/server";
import { verifyCallerWithRole } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const url = new URL(req.url);
  const partido_id = url.searchParams.get("partido_id");
  if (!partido_id) return NextResponse.json({ error: "partido_id requerido" }, { status: 400 });
  const { data, error } = await admin.from("partido_convocadas").select("*").eq("partido_id", Number(partido_id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const body = await req.json();
  const { partido_id, jugadoras } = body;
  if (!partido_id || !Array.isArray(jugadoras)) return NextResponse.json({ error: "partido_id y jugadoras[] requeridos" }, { status: 400 });
  const rows = jugadoras.map((j: any) => ({
    partido_id,
    jugadora_id: j.jugadora_id,
    titular: j.titular || false,
  }));
  const { data, error } = await admin.from("partido_convocadas").upsert(rows, { onConflict: "partido_id,jugadora_id" }).select();
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
  const { error } = await admin.from("partido_convocadas").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
