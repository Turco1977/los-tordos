import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const ADMIN_ROLES = ["superadmin", "admin"];

function generatePassword(): string {
  return randomBytes(12).toString("base64url");
}

async function verifyCaller(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "No autorizado", status: 401 };
  }

  const token = authHeader.slice(7);
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user: caller } } = await anonClient.auth.getUser(token);
  if (!caller) {
    return { error: "Token inválido", status: 401 };
  }

  const admin = createAdminClient();
  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (!callerProfile || !ADMIN_ROLES.includes(callerProfile.role)) {
    return { error: "Solo administradores pueden gestionar usuarios", status: 403 };
  }

  return { caller, callerProfile, admin };
}

export async function POST(req: NextRequest) {
  const auth = await verifyCaller(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { admin } = auth;

  const body = await req.json();
  const { email, password, first_name, last_name, role, dept_id, division, phone } = body;

  if (!email || !first_name || !last_name) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: password || generatePassword(),
    email_confirm: true,
    user_metadata: {
      first_name,
      last_name,
      role: role || "usuario",
      dept_id: dept_id || 1,
      division: division || "",
      phone: phone || "",
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}

export async function PUT(req: NextRequest) {
  const auth = await verifyCaller(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { admin } = auth;

  const { userId, email } = await req.json();
  if (!userId || !email) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { email });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
