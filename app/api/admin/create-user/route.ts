import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/auth";
import { randomBytes } from "crypto";

function generatePassword(): string {
  return randomBytes(12).toString("base64url");
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
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
  const auth = await verifyAdmin(req);
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
