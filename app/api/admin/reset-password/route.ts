import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { admin } = auth;

  const { user_id, new_password } = await req.json();

  if (!user_id || !new_password) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (new_password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const { error } = await admin.auth.admin.updateUserById(user_id, { password: new_password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
