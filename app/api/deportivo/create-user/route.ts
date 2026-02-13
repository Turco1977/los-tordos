import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

function generatePassword(): string {
  return randomBytes(12).toString("base64url");
}

async function verifyDepCaller(req: NextRequest) {
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

  // Check dep_staff role (dd or dr) OR profiles admin/superadmin
  const { data: depStaff } = await admin
    .from("dep_staff")
    .select("dep_role")
    .eq("user_id", caller.id)
    .eq("active", true)
    .single();

  if (depStaff && (depStaff.dep_role === "dd" || depStaff.dep_role === "dr")) {
    return { caller, admin };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (profile && (profile.role === "superadmin" || profile.role === "admin")) {
    return { caller, admin };
  }

  return { error: "Solo DD/DR pueden crear usuarios deportivos", status: 403 };
}

export async function POST(req: NextRequest) {
  const auth = await verifyDepCaller(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { admin } = auth;

  const body = await req.json();
  const { email, password, first_name, last_name, dep_role, divisions } = body;

  if (!email || !first_name || !last_name || !dep_role) {
    return NextResponse.json({ error: "Faltan campos requeridos (email, nombre, apellido, rol)" }, { status: 400 });
  }

  const finalPassword = password || generatePassword();

  // 1. Create auth user (trigger creates profiles row automatically)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: finalPassword,
    email_confirm: true,
    user_metadata: {
      first_name,
      last_name,
      role: "usuario",
      dept_id: 1,
      division: "",
      phone: "",
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 2. Create dep_staff record
  const { error: staffErr } = await admin.from("dep_staff").insert({
    user_id: data.user.id,
    dep_role,
    divisions: divisions || [],
    active: true,
  });

  if (staffErr) {
    return NextResponse.json({ error: staffErr.message }, { status: 400 });
  }

  // 3. Return credentials so admin can share them
  return NextResponse.json({
    user: { id: data.user.id, email },
    credentials: { email, password: finalPassword },
  });
}
