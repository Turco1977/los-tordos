import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  // Verify caller is superadmin via their auth token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user: caller } } = await anonClient.auth.getUser(token);
  if (!caller) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // Check caller's role in profiles
  const admin = createAdminClient();
  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.role !== "superadmin") {
    return NextResponse.json({ error: "Solo superadmin puede crear usuarios" }, { status: 403 });
  }

  // Parse body
  const body = await req.json();
  const { email, password, first_name, last_name, role, dept_id, division, phone } = body;

  if (!email || !first_name || !last_name) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  // Create auth user with metadata
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: password || "lostordos2026",
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
