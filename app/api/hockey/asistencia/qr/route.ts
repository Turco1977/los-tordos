import { NextRequest, NextResponse } from "next/server";
import { verifyCallerWithRole } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";

// GET: Validate QR token (public — no auth needed)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("asistencia_sesiones")
    .select("id,fecha,division,rama,tipo_actividad,estado,qr_expires_at")
    .eq("qr_token", token)
    .single();
  if (error || !data) return NextResponse.json({ error: "QR inválido o expirado" }, { status: 404 });
  if (data.estado === "cerrada") return NextResponse.json({ error: "Sesión cerrada" }, { status: 410 });
  if (data.qr_expires_at && new Date(data.qr_expires_at) < new Date()) return NextResponse.json({ error: "QR expirado" }, { status: 410 });
  return NextResponse.json(data);
}

// POST: Register attendance via QR scan (public — uses DNI)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, dni } = body;
  if (!token || !dni) return NextResponse.json({ error: "Token y DNI requeridos" }, { status: 400 });
  const admin = createAdminClient();

  // Validate session
  const { data: sesion } = await admin.from("asistencia_sesiones")
    .select("id,estado,qr_expires_at")
    .eq("qr_token", token)
    .single();
  if (!sesion) return NextResponse.json({ error: "QR inválido" }, { status: 404 });
  if (sesion.estado === "cerrada") return NextResponse.json({ error: "Sesión cerrada" }, { status: 410 });
  if (sesion.qr_expires_at && new Date(sesion.qr_expires_at) < new Date()) return NextResponse.json({ error: "QR expirado" }, { status: 410 });

  // Find athlete by DNI
  const { data: athlete } = await admin.from("dep_athletes")
    .select("id,first_name,last_name")
    .eq("dni", dni.trim())
    .eq("active", true)
    .single();
  if (!athlete) return NextResponse.json({ error: "DNI no encontrado en el plantel" }, { status: 404 });

  // Upsert attendance
  const { data, error } = await admin.from("asistencia_registros").upsert({
    sesion_id: sesion.id,
    jugadora_id: athlete.id,
    presente: true,
    metodo: "qr",
  }, { onConflict: "sesion_id,jugadora_id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, nombre: athlete.first_name + " " + athlete.last_name });
}

// PUT: Generate QR token for a session (auth required)
export async function PUT(req: NextRequest) {
  const result = await verifyCallerWithRole(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { admin } = result;
  const body = await req.json();
  const { sesion_id } = body;
  if (!sesion_id) return NextResponse.json({ error: "sesion_id requerido" }, { status: 400 });
  const qr_token = crypto.randomUUID();
  const qr_expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
  const { data, error } = await admin.from("asistencia_sesiones")
    .update({ qr_token, qr_expires_at })
    .eq("id", sesion_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
