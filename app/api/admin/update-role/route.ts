import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { userId, role } = await req.json();
  if (!userId || !role) return NextResponse.json({ error: "Faltan userId y role" }, { status: 400 });

  const admin = createAdminClient();

  // Update profile role
  const { data, error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("id, first_name, last_name, role")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also update user metadata
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  });

  return NextResponse.json({ user: data });
}
