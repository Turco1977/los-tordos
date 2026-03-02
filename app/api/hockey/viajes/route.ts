import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const sb = createAdminClient();
  const { data, error } = await sb.from("viajes").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = createAdminClient();
    const { data, error } = await sb.from("viajes").insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await sb.from("viaje_historial").insert({ viaje_id: data.id, accion: "creado", detalle: `Viaje a "${data.destino}" creado`, user_id: body.creado_por });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, _user_id, _action, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const sb = createAdminClient();
    if (updates.estado === "aprobado" && _user_id) {
      updates.aprobado_por = _user_id;
      updates.aprobado_at = new Date().toISOString();
    }
    const { data, error } = await sb.from("viajes").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (_user_id && _action) {
      await sb.from("viaje_historial").insert({ viaje_id: id, accion: _action, detalle: updates.estado ? `Estado cambiado a ${updates.estado}` : _action, user_id: _user_id });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const sb = createAdminClient();
    const { error } = await sb.from("viajes").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
