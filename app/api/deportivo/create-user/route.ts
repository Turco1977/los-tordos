import { NextRequest, NextResponse } from "next/server";
import { verifyDepStaff } from "@/lib/api/auth";
import { randomBytes } from "crypto";

function generatePassword(): string {
  return randomBytes(12).toString("base64url");
}

export async function POST(req: NextRequest) {
  const auth = await verifyDepStaff(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { admin } = auth;

  const body = await req.json();
  const { email, password, first_name, last_name, dep_role, divisions } = body;

  if (!first_name || !last_name || !dep_role) {
    return NextResponse.json({ error: "Faltan campos requeridos (nombre, apellido, rol)" }, { status: 400 });
  }

  // If no email provided, generate a placeholder so Supabase auth can create the user
  const finalEmail = email || `${first_name.toLowerCase().replace(/\s+/g,"")}.${last_name.toLowerCase().replace(/\s+/g,"")}.${randomBytes(4).toString("hex")}@deportivo.internal`;
  const finalPassword = password || generatePassword();

  // 1. Create auth user (trigger creates profiles row automatically)
  const { data, error } = await admin.auth.admin.createUser({
    email: finalEmail,
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
    // Clean up the auth user if dep_staff insert fails
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: staffErr.message }, { status: 400 });
  }

  // 3. Return credentials (only meaningful if real email was provided)
  return NextResponse.json({
    user: { id: data.user.id, email: finalEmail },
    credentials: email ? { email: finalEmail, password: finalPassword } : null,
  });
}
